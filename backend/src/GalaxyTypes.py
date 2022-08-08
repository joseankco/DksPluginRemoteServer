from typing import Optional
from time import time

from bs4 import BeautifulSoup, element


class GateDTO(object):
    def __init__(self, gid, name, gate: element.Tag, multiplier: element.Tag, probabilities: element.Tag):
        self.id = gid
        self.name = name
        self.prepared = int(gate['prepared'])
        self.state = gate['state']
        self.lives = int(gate['livesLeft'])
        self.lifePrice = int(gate['lifePrice'])
        self.parts = {
            'current': int(gate['current']),
            'total': int(gate['total'])
        }
        self.waves = {
            'current': int(gate['currentWave']),
            'total': int(gate['totalWave'])
        }
        self.bonusGGReward = None
        bonus = gate.find('bonusGGReward')
        if bonus is not None:
            self.bonusGGReward = {
                'amount': int(bonus['amount']),
                'claimed': True if bonus['claimed'] == '1' else False,
                'countdown': int(bonus['countdown']),
                'lootId': bonus['lootId']
            }
        builders = gate.find_all('gatebuilders')
        if len(builders) == 0:
            self.builders = None
        else:
            self.builders = []
            for builder in builders:
                self.builders.append({
                    'gate': builder['name'].lower(),
                    'current': int(builder['current']),
                    'total': int(builder['total'])
                })

        if multiplier is not None:
            self.multiplier = {
                'value': int(multiplier['value']),
                'state': int(multiplier['state'])
            }
        else:
            self.multiplier = None

        if probabilities is not None:
            categories = probabilities.find_all('cat')
            if len(categories) == 0:
                self.probabilities = None
            else:
                self.probabilities = []
                for cat in categories:
                    idp: str = cat['id']
                    percentage: int = int(cat['percentage'])
                    if not idp.startswith('gate_') and not idp.startswith('special_'):
                        self.probabilities.append({
                            'id': idp,
                            'percentage': percentage
                        })
        else:
            self.probabilities = None


class GatesBoostItemDTO(object):
    def __init__(self, item):
        keys = [key for key in item.attrs]
        self.type = item['type']

        self.itemId = int(item['item_id']) if 'item_id' in keys else None
        self.date = int(item['date']) if 'date' in keys else -1
        self.spins = int(item['spins']) if 'spins' in keys else -1
        self.amount = int(item['amount']) if 'amount' in keys else -1
        self.multiplierUsed = int(item['multiplier_used']) if 'multiplier_used' in keys else -1
        self.multiplierAmount = int(item['multiplier_amount']) if 'multiplier_amount' in keys else -1
        self.gateId = int(item['gate_id']) if 'gate_id' in keys else -1
        self.gateName = GatesUtils.get_gate_name(self.gateId) if self.gateId > 0 else ''
        self.partId = int(item['part_id']) if 'part_id' in keys else -1
        self.duplicate = True if 'duplicate' in keys else False

        self.desc = self.type
        if self.type in ['battery', 'ore', 'rocket']:
            self.desc = GatesUtils.get_item_desc(self.type, self.itemId)
        elif self.type in ['part']:
            self.desc = self.gateName + ' part ' + str(self.partId)
            self.spins = 0 if self.duplicate else 1
        elif self.type in ['multiplier']:
            self.spins = 1


class GatesBoostDataDTO(object):
    def __init__(self, items):
        self.items: list[GatesBoostItemDTO] = []
        for item in items.find_all('item'):
            if item is not None:
                self.items.append(GatesBoostItemDTO(item))


class GatesDataDTO(object):
    def __init__(self, mode):
        self.mode = mode
        self.uri = 0
        self.ee = 0
        self.selectedSpinAmmount = 0
        self.eeCost = 0
        self.spinOnSale = False
        self.spinSalePercentage = 0
        self.galaxyGateDay = False
        self.bonusRewardsDay = False
        self.gates = []
        self.tick = round(time() * 1000)
        self.boosts: list[GatesBoostDataDTO] = []
        # TODO: <boosts>

    def set_uri_ee(self, uri, ee, ammount, cost):
        self.uri = int(uri)
        self.ee = int(ee)
        self.selectedSpinAmmount = int(ammount)
        self.eeCost = int(cost)

    def set_info(self, sos, ssp, ggd, brd):
        self.spinOnSale = int(sos) == 1
        self.spinSalePercentage = int(ssp)
        self.galaxyGateDay = int(ggd) == 1
        self.bonusRewardsDay = int(brd) == 1

    def append_boost(self, boost):
        self.boosts.append(GatesBoostDataDTO(boost))

    def append_gate(self, gate: GateDTO):
        self.gates.append(gate)

    def __str__(self):
        return str(getattr(self, '__dict__'))


class GatesDataDiffDTO(object):
    def __init__(self, ee_diff):
        self.eeDiff = ee_diff

    @staticmethod
    def get_gates_data_diff(init: GatesDataDTO, current: GatesDataDTO):
        return GatesDataDiffDTO(current.ee - init.ee)


class GatesDataStatsItemDTO(object):
    def __init__(self):
        self.spins = 0
        self.amount = 0


class GatesDataStatsGroupDTO(object):
    def __init__(self):
        self.spins = 0


class GatesDataStatsBatteryItemsDTO(object):
    def __init__(self):
        self.mcb25 = GatesDataStatsItemDTO()
        self.mcb50 = GatesDataStatsItemDTO()
        self.ucb100 = GatesDataStatsItemDTO()
        self.sab50 = GatesDataStatsItemDTO()


class GatesDataStatsBatteryDTO(GatesDataStatsGroupDTO):
    def __init__(self):
        super().__init__()
        self.items = GatesDataStatsBatteryItemsDTO()


class GatesDataStatsRocketItemsDTO(object):
    def __init__(self):
        self.plt2021 = GatesDataStatsItemDTO()
        self.acm01 = GatesDataStatsItemDTO()


class GatesDataStatsRocketDTO(GatesDataStatsGroupDTO):
    def __init__(self):
        super().__init__()
        self.items = GatesDataStatsRocketItemsDTO()


class GatesDataStatsOreItemsDTO(object):
    def __init__(self):
        self.xenomit = GatesDataStatsItemDTO()


class GatesDataStatsOreDTO(GatesDataStatsGroupDTO):
    def __init__(self):
        super().__init__()
        self.items = GatesDataStatsOreItemsDTO()


class GatesDataStatsPartItemsDTO(object):
    def __init__(self):
        self.part = GatesDataStatsItemDTO()
        self.multiplier = GatesDataStatsItemDTO()


class GatesDataStatsPartDTO(GatesDataStatsGroupDTO):
    def __init__(self):
        super().__init__()
        self.items = GatesDataStatsPartItemsDTO()


class GatesDataStatsSpecialItemsDTO(object):
    def __init__(self):
        self.nanohull = GatesDataStatsItemDTO()
        self.hitpoints = GatesDataStatsItemDTO()


class GatesDataStatsSpecialDTO(GatesDataStatsGroupDTO):
    def __init__(self):
        super().__init__()
        self.items = GatesDataStatsSpecialItemsDTO()


class GatesDataStatsDTO(object):
    def __init__(self):
        self.lastSpinDate = 0
        self.total = 0
        self.battery = GatesDataStatsBatteryDTO()
        self.rocket = GatesDataStatsRocketDTO()
        self.ore = GatesDataStatsOreDTO()
        self.part = GatesDataStatsPartDTO()
        self.voucher = GatesDataStatsGroupDTO()
        self.special = GatesDataStatsSpecialDTO()
        self.logfile = GatesDataStatsGroupDTO()

    def update_stats(self, data: GatesDataDTO):
        last_date = self.lastSpinDate
        for i, boost in enumerate(data.boosts):
            for j, item in enumerate(boost.items):
                if item.date > self.lastSpinDate:
                    if i == 0 and j == 0:
                        last_date = item.date
                    self.process_item(item)
                else:
                    break
        self.lastSpinDate = last_date

    def process_item(self, item: GatesBoostItemDTO):
        self.total += item.spins
        desc = item.desc.lower().replace('-', '')
        if item.type == 'battery':
            self.battery.spins += item.spins
            if desc == 'mcb25':
                self.battery.items.mcb25.spins += item.spins
                self.battery.items.mcb25.amount += item.amount
            elif desc == 'mcb50':
                self.battery.items.mcb50.spins += item.spins
                self.battery.items.mcb50.amount += item.amount
            elif desc == 'ucb100':
                self.battery.items.ucb100.spins += item.spins
                self.battery.items.ucb100.amount += item.amount
            elif desc == 'sab50':
                self.battery.items.sab50.spins += item.spins
                self.battery.items.sab50.amount += item.amount
        elif item.type == 'rocket':
            self.rocket.spins += item.spins
            if desc == 'plt2021':
                self.rocket.items.plt2021.spins += item.spins
                self.rocket.items.plt2021.amount += item.amount
            elif desc == 'acm01':
                self.rocket.items.acm01.spins += item.spins
                self.rocket.items.acm01.amount += item.amount
        elif item.type == 'ore':
            self.ore.spins += item.spins
            if desc == 'xenomit':
                self.ore.items.xenomit.spins += item.spins
                self.ore.items.xenomit.amount += item.amount
        elif item.type == 'logfile':
            self.logfile.spins += item.spins
        elif item.type == 'voucher':
            self.voucher.spins += item.spins
        elif item.type == 'special':
            self.special.spins += item.spins
        elif item.type == 'nanohull':
            self.special.spins += item.spins
            self.special.items.nanohull.spins += item.spins
            self.special.items.nanohull.amount += item.amount
        elif item.type == 'hitpoints':
            self.special.spins += item.spins
            self.special.items.hitpoints.spins += item.spins
            self.special.items.hitpoints.amount += item.amount
        elif item.type == 'part':
            self.part.spins += item.spins
            self.part.items.part.spins += item.spins
            self.part.items.part.amount += item.spins
        elif item.type == 'multiplier':
            self.part.spins += item.spins
            self.part.items.multiplier.spins += item.spins
            self.part.items.multiplier.amount += item.spins


class GatesDataTransferDTO(object):
    def __init__(self, init: GatesDataDTO, now: GatesDataDTO, diff: GatesDataDiffDTO):
        self.init = init
        self.now = now
        self.diff = diff
        self.stats = GatesDataStatsDTO()


class GatesUtils(object):
    gates_map = {
        1: 'alpha',
        2: 'beta',
        3: 'gamma',
        4: 'delta',
        5: 'epsilon',
        6: 'zeta',
        7: 'kappa',
        8: 'lambda',
        12: 'kronos',
        13: 'hades',
        19: 'streuner',
    }

    item_id_map = {
        'battery': {
            2: 'MCB-25',
            3: 'MCB-50',
            4: 'UCB-100',
            5: 'SAB-50'
        },
        'rocket': {
            3: 'PLT-2021',
            11: 'ACM-01'
        },
        'ore': {
            4: 'Xenomit'
        }
    }

    @staticmethod
    def parse_galaxy_gates(r) -> Optional[GatesDataDTO]:
        soup = BeautifulSoup(r.text, 'lxml-xml')
        jumpgate = soup.jumpgate
        if jumpgate is not None:
            data: GatesDataDTO = GatesDataDTO(jumpgate.mode.string)
            data.set_uri_ee(
                jumpgate.money.string,
                jumpgate.samples.string,
                jumpgate.spinamount_selected.string,
                jumpgate.energy_cost.string
            )
            data.set_info(
                jumpgate.spinOnSale.string,
                jumpgate.spinSalePercentage.string,
                jumpgate.galaxyGateDay.string,
                jumpgate.bonusRewardsDay.string
            )
            for boost in jumpgate.boosts.find_all('boost'):
                data.append_boost(boost)

            multipliers = jumpgate.multipliers.find_all('multiplier')
            gates = jumpgate.gates.find_all('gate')
            probabilities = jumpgate.probabilities.find_all('probability')
            for gate in gates:
                gid = int(gate['id'])
                name = GatesUtils.get_gate_name(gid)
                m = next((x for x in multipliers if x['mode'] == name), None)
                p = next((x for x in probabilities if x['mode'] == name), None)
                data.append_gate(GateDTO(gid, name, gate, m, p))
            return data
        return None

    @staticmethod
    def get_gate_name(i) -> str:
        return GatesUtils.gates_map.get(int(i), None)

    @staticmethod
    def get_gate_id(name: str) -> int:
        return list(GatesUtils.gates_map.keys())[list(GatesUtils.gates_map.values()).index(name)]

    @staticmethod
    def get_item_desc(tipo: str, item_id):
        return GatesUtils.item_id_map.get(tipo, 'battery').get(int(item_id), None)

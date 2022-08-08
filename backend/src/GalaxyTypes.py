from typing import Optional
from time import time

from bs4 import BeautifulSoup, element


class GateDTO(object):
    def __init__(self, gid, name, gate: element.Tag, multiplier: element.Tag, probabilities: element.Tag):
        self.id = gid
        self.name = name
        self.prepared = int(gate['prepared'])
        self.state = gate['state']
        self.lives = int(gate['livesleft'])
        self.lifePrice = int(gate['lifeprice'])
        self.parts = {
            'current': int(gate['current']),
            'total': int(gate['total'])
        }
        self.waves = {
            'current': int(gate['currentwave']),
            'total': int(gate['totalwave'])
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

    def append_gate(self, gate: GateDTO):
        self.gates.append(gate)

    def __str__(self):
        return str(getattr(self, '__dict__'))


class GatesDataDiffDTO(object):
    def __init__(self):
        pass

    @staticmethod
    def get_gates_data_diff(init: GatesDataDTO, current: GatesDataDTO):
        return GatesDataDiffDTO()


class GatesDataTransferDTO(object):
    def __init__(self, init: GatesDataDTO, now: GatesDataDTO, diff: GatesDataDiffDTO):
        self.init = init
        self.now = now
        self.diff = diff


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

    @staticmethod
    def parse_galaxy_gates(r) -> Optional[GatesDataDTO]:
        soup = BeautifulSoup(r.text, 'lxml')
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
                jumpgate.spinonsale.string,
                jumpgate.spinsalepercentage.string,
                jumpgate.galaxygateday.string,
                jumpgate.bonusrewardsday.string
            )
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

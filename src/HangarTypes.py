import base64
from time import time

class HangarShipDTO(object):
    def __init__(self, hangar):
        self.id = int(hangar['hangarID'])
        self.active = hangar['hangar_is_active']
        self.ship = hangar['general']['ship']['SM']
        self.designs = hangar['general']['ship']['M']

    def get_params(self) -> str:
        return '{"params": {"hi": ' + str(self.id) + '}}'

    def get_encoded_params(self) -> str:
        return base64.b64encode(self.get_params().encode('ascii')).decode('ascii')


class HangarListDTO(object):
    def __init__(self, hangars):
        self.hangars = []
        for i in hangars.keys():
            self.hangars.append(HangarShipDTO(hangars[str(i)]))

    def get_active_hangar(self):
        for hangar in self.hangars:
            if hangar.active:
                return hangar
        return None


class ItemDTO(object):
    def __init__(self, item, info, lootid):
        self.id = item['I']
        self.loot_id = item['L']
        self.loot_desc = lootid

        infokeys = info.keys()
        itemkeys = item.keys()

        if info['name'] == 'unnamed':
            self.name = HangarUtils.sanitize_name(self.loot_desc)
        else:
            self.name = info['name']
        self.level = item['LV']
        if 'properties' in itemkeys:
            self.properties = item['properties']
        else:
            self.properties = None

        if 'Q' in itemkeys:
            self.quantity = item['Q']
        else:
            self.quantity = 1

        if 'SUS' in itemkeys:
            self.ship_upgrade_ships = item['SUS'].split(',')
            self.ship_upgrade_modifiers = item['SUM'].split(';')
        else:
            self.ship_upgrade_ships = None
            self.ship_upgrade_modifiers = None

        if 'EQH' not in itemkeys or item['EQH'] == 'null':
            self.equipped_hangar = None
        else:
            self.equipped_hangar = item['EQH']
        if 'EQC' not in itemkeys or item['EQC'] == 'null':
            self.equipped_config = None
        else:
            self.equipped_config = item['EQC']
        if 'EQT' not in itemkeys or item['EQT'] == 'null':
            self.equipped_target = None
        else:
            self.equipped_target = item['EQT']

    def is_equipped(self):
        return self.equipped_hangar is not None

    def is_ship_module(self):
        return self.ship_upgrade_ships is not None

    def __str__(self):
        base = 'item=[lootID: {}, loot: {}, name={}, quantity={}]'.format(
            self.loot_id, self.loot_desc, self.name, self.quantity
        )
        if self.is_ship_module():
            return base + '[ships={}, modifiers={}]'.format(self.ship_upgrade_ships, self.ship_upgrade_modifiers)
        return base


class HangarItemsDTO(object):
    def __init__(self, items, infos, loots):
        self.items = []
        for item in items:
            lootid = item['L']
            for info in infos:
                if info['L'] == lootid and HangarUtils.check_if_keept(loots[lootid]):
                    itemdto = ItemDTO(item, info, loots[lootid])
                    exists = self.get_item_loot_id(itemdto.loot_id)
                    if exists is None or itemdto.is_ship_module():
                        self.items.append(itemdto)
                    else:
                        exists.quantity = exists.quantity + 1
                    break

    def get_item_loot_id(self, lootid):
        for item in self.items:
            if item.loot_id == lootid:
                return item
        return None

    def get_item_loot_desc(self, desc):
        for item in self.items:
            if item.loot_desc == desc:
                return item
        return None

    def get_ship_modules(self):
        modules = []
        for item in self.items:
            if item.is_ship_module():
                modules.append(item)
        return modules

    def __str__(self):
        res = 'hangar_items={\n'
        for item in self.items:
            res = res + '   ' + str(item) + '\n'
        res = res + '}'
        return res


class HangarItemsDiffDTO(object):
    def __init__(self, init: HangarItemsDTO, current: HangarItemsDTO):
        self.tick = round(time() * 1000)
        self.differences = []
        for c_item in current.items:
            i_item = init.get_item_loot_id(c_item.loot_id)
            if i_item is None:
                self.differences.append({
                    'lootId': c_item.loot_id,
                    'diff': c_item.quantity
                })
            else:
                self.differences.append({
                    'lootId': c_item.loot_id,
                    'diff': c_item.quantity - i_item.quantity
                })


class RankDataTransferDTO(object):
    def __init__(self, init: HangarItemsDTO, now: HangarItemsDTO, diff: HangarItemsDiffDTO):
        self.init = init
        self.now = now
        self.diff = diff


class HangarUtils(object):
    @staticmethod
    def check_if_keept(loot):
        remove = [
            'equipment_extra_',
            '_firework_',
            'ammunition_mine',
            'module_',
            'pet_designs_'
        ]
        for r in remove:
            if r in loot:
                return False
        return True

    @staticmethod
    def sanitize_name(loot):
        name = loot.replace(' ', '_').replace('-', '_').replace('.', '').upper()
        name = name.replace('RESOURCE_COLLECTABLE_', '')
        return name.lower()


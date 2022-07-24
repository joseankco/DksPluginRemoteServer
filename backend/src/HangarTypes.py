import base64
from enum import Enum
from time import time


class ItemTypes(Enum):
    SHIP_MODULE = 1
    AMMO_LASER = 2
    AMMO_ROCKET = 3
    AMMO_SPECIAL = 4
    AMMO = 5
    EQUIPMENT = 6
    DRONE_DESIGN = 7
    DRONE_FORMATION = 8
    ORE = 9
    RESOURCE = 10
    RESOURCE_COLLECTABLE = 11
    EQUIPMENT_WEAPON = 12
    EQUIPMENT_GENERATOR = 13
    PETGEAR = 14
    PETPROTOCOL = 15

    def get_str(self):
        switcher = {
            1: '_shipupgrade_',
            2: 'ammunition_laser_',
            3: 'ammunition_rocket',
            4: 'ammunition_specialammo_',
            5: 'ammunition_',
            6: 'equipment_',
            7: 'drone_designs_',
            8: 'drone_formation_',
            9: 'resource_ore_',
            10: 'resource_',
            11: 'resource_collectable_',
            12: 'equipment_weapon_',
            13: 'equipment_generator_',
            14: '_petgear_',
            15: '_aiprotocol_',
        }
        return switcher.get(self.value, '')

    def __str__(self):
        return self.get_str()


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
    def __init__(self, hangarsjson):
        self.hangars = []
        if type(hangarsjson) is dict:
            for i in hangarsjson.keys():
                self.hangars.append(HangarShipDTO(hangarsjson[str(i)]))
        elif type(hangarsjson) is list:
            for hangar in hangarsjson:
                self.hangars.append(HangarShipDTO(hangar))
        else:
            raise 'Unknown API HangarList'

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

    def is_type_of(self, of: ItemTypes):
        return of.get_str() in self.loot_desc

    def get_id(self):
        return self.id

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
        self.modules = []
        self.modules_id = []
        for item in items:
            lootid = item['L']
            for info in infos:
                if info['L'] == lootid and HangarUtils.check_if_keept(loots[lootid]):
                    itemdto = ItemDTO(item, info, loots[lootid])
                    exists = self.get_item_loot_id(itemdto.loot_id)
                    if exists is None or itemdto.is_ship_module():
                        if itemdto.is_ship_module():
                            self.modules_id.append(itemdto.get_id())
                            self.modules.append(itemdto)
                        self.items.append(itemdto)
                    else:
                        exists.quantity = exists.quantity + 1
                    break

    def get_item_id(self, rid):
        for item in self.items:
            if item.id == rid:
                return item
        return None

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

    def get_by_item_type(self, item_type: ItemTypes):
        itms = []
        for item in self.items:
            if item_type.get_str() in item.loot_desc:
                itms.append(item)
        return itms

    def get_quantity_module(self, loot_desc):
        total = 0
        for module in self.modules:
            if module.loot_desc == loot_desc:
                total = total + module.quantity
        return total

    def get_safe_quantity(self, item):
        if item.is_ship_module():
            return self.get_quantity_module(item.loot_desc)
        return item.quantity

    def get_modules_id(self):
        return self.modules_id

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
            i_item = init.get_item_loot_desc(c_item.loot_desc)
            c_quantity = current.get_safe_quantity(c_item)
            if i_item is None:
                self.differences.append({
                    'lootDesc': c_item.loot_desc,
                    'diff': c_quantity
                })
            else:
                i_quantity = init.get_safe_quantity(i_item)
                self.differences.append({
                    'lootDesc': c_item.loot_desc,
                    'diff': c_quantity - i_quantity
                })
        self.modules = {
            'init': init.get_modules_id(),
            'current': current.get_modules_id(),
            'diff': list(set(current.get_modules_id()) - set(init.get_modules_id()))
        }

    def get_quantity(self, items: HangarItemsDTO, item: ItemDTO):
        if item.is_ship_module():
            return items.get_quantity_loot_desc(item.loot_desc)
        return item.quantity


class HangarDataTransferDTO(object):
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

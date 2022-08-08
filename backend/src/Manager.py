import abc
import json
import threading
from enum import Enum
from time import sleep
import requests
import base64

from RankTypes import RankDataTransferDTO, RankUtils, RankDataDiffDTO, RankDataDTO
from HangarTypes import HangarListDTO, HangarItemsDTO, HangarItemsDiffDTO, HangarDataTransferDTO, ItemTypes
from GalaxyTypes import GatesUtils, GateDTO, GatesDataDTO, GatesDataDiffDTO, GatesDataTransferDTO


# MANAGER API
class ManagerAbstract(object):
    def __init__(self, aid: str):
        self.aid = aid
        self.sid = None
        self.instance = None
        self.useragent = 'BigpointClient/1.6.7'
        self.data = None

    def get_id(self):
        return self.aid

    def set_sesion(self, instance, sid):
        self.instance = instance
        self.sid = sid

    def get_cookies(self):
        return {'dosid': self.sid}

    def get_headers(self):
        return {'User-Agent': self.useragent}

    def get_data(self):
        return self.data

    def is_valid_instance(self):
        return self.instance is not None and self.sid is not None

    @abc.abstractmethod
    def get_url(self):
        pass

    @abc.abstractmethod
    def refresh_data(self):
        pass


class ManagerAPI(object):
    def __init__(self, aid: str):
        self.aid = aid
        self.backpage = BackPageSingleton(aid)
        self.hangar = HangarSingleton(aid)
        self.galaxy = GalaxyGatesSingleton(aid)
        self.thread = threading.Thread()

    def is_thread_alive(self):
        return self.thread.is_alive()

    def get_id(self):
        return self.aid

    def run(self):
        while True:
            sleep(1)
            self.backpage.refresh_data()
            sleep(2)
            self.galaxy.refresh_data()
            sleep(2)
            self.hangar.refresh_data()
            sleep(180)

    def run_thread(self):
        if self.thread.is_alive():
            return
        self.thread = threading.Thread(target=self.run)
        self.thread.daemon = True
        self.thread.start()

    def set_sesion(self, instance, sid):
        self.backpage.set_sesion(instance, sid)
        self.hangar.set_sesion(instance, sid)
        self.galaxy.set_sesion(instance, sid)

    def get_sid(self):
        return self.backpage.sid

    def get_instance(self):
        return self.backpage.instance


class ManagerSingleton(object):
    instance: list[ManagerAPI] = []

    def __new__(cls, aid: str):
        inst = cls.get_instance(aid)
        if inst is None:
            inst = ManagerAPI(aid)
            cls.instance.append(inst)
        return inst

    @classmethod
    def get_instance(cls, aid: str):
        if cls.instance is None or len(cls.instance) == 0:
            return None
        for inst in cls.instance:
            if inst.get_id() == aid:
                return inst
        return None


# HANGAR
class HangarActions(Enum):
    HANGAR_ITEMS = 1
    HANGAR_LIST = 2

    def get_str(self):
        switcher = {
            1: 'getHangar&params=',
            2: 'getHangarList',
        }
        return switcher.get(self.value, 'internalStart')

    def __str__(self):
        return self.get_str()


class HangarAPI(ManagerAbstract):
    def __init__(self, aid: str):
        super().__init__(aid)
        self.active_hangar = None
        self.data_charts = []
        self.data: HangarDataTransferDTO = HangarDataTransferDTO(None, None, None)
        self.hangar_list: HangarListDTO = None
        self.hangar_items: HangarItemsDTO = None

    # override
    def get_url(self):
        if self.is_valid_instance():
            return self.instance + 'flashAPI/inventory.php?action='
        return None

    # override
    def refresh_data(self):
        if self.hangar_list is None:
            while not self.refresh_hangar_list():
                sleep(1)
        while not self.refresh_items():
            sleep(1)

        now_hangar_data: HangarItemsDTO = self.hangar_items

        if self.data.init is None:
            self.data.init = now_hangar_data
        self.data.now = now_hangar_data

        self.data.diff = HangarItemsDiffDTO(self.data.init, self.data.now)

    def refresh_hangar_list(self):
        if not self.is_valid_instance():
            return False

        url = self.get_url_action(HangarActions.HANGAR_LIST)
        try:
            r = requests.get(
                url=url,
                headers=self.get_headers(),
                cookies=self.get_cookies(),
                timeout=5000
            )
        except BaseException:
            print('Exception Refreshing HangarList', self.aid)
            return False

        data_decoded = base64.b64decode(r.text)
        data = json.loads(data_decoded)
        if data['isError'] == 0:
            if 'data' in data.keys() and 'ret' in data['data'].keys():
                self.hangar_list = HangarListDTO(data['data']['ret']['hangars'])
                return True
        return False

    def refresh_items(self):
        if not self.is_valid_instance():
            return False

        active = self.hangar_list.get_active_hangar()
        url = self.get_url_action(HangarActions.HANGAR_ITEMS) + active.get_encoded_params()
        try:
            r = requests.get(
                url=url,
                headers=self.get_headers(),
                cookies=self.get_cookies(),
                timeout=5000
            )
        except BaseException:
            print('Exception Refreshing HangarItems', self.aid)
            return False

        data_decoded = base64.b64decode(r.text)
        data = json.loads(data_decoded)
        if data['isError'] == 0:
            if 'data' in data.keys() and 'ret' in data['data'].keys():
                items = data['data']['ret']['items']
                infos = data['data']['ret']['itemInfo']
                lootsid = data['data']['map']['lootIds']
                self.hangar_items = HangarItemsDTO(items, infos, lootsid)
                return True
        return False

    def get_url_action(self, action: HangarActions):
        if self.is_valid_instance():
            return self.get_url() + action.get_str()
        return None

    # override
    def get_data(self):
        if self.data.now is None or self.data.now.items is None:
            return {}

        modules = []
        ammo_laser = []
        ammo_rockets = []
        generators = []
        weapons = []
        pet = []
        resources = []
        ore = []
        drones = []

        for item in self.data.now.items:
            if item.is_type_of(ItemTypes.ORE):
                ore.append(item)
            elif item.is_type_of(ItemTypes.RESOURCE):
                resources.append(item)
            elif item.is_ship_module():
                modules.append(item)
            elif item.is_type_of(ItemTypes.AMMO_LASER):
                ammo_laser.append(item)
            elif item.is_type_of(ItemTypes.AMMO_ROCKET):
                ammo_rockets.append(item)
            elif item.is_type_of(ItemTypes.EQUIPMENT_GENERATOR):
                generators.append(item)
            elif item.is_type_of(ItemTypes.EQUIPMENT_WEAPON):
                weapons.append(item)
            elif item.is_type_of(ItemTypes.DRONE_DESIGN) or item.is_type_of(ItemTypes.DRONE_FORMATION):
                drones.append(item)
            elif item.is_type_of(ItemTypes.PETGEAR) or item.is_type_of(ItemTypes.PETPROTOCOL):
                pet.append(item)

        return {
            'diff': self.data.diff,
            'items': {
                'modules': modules,
                'ammo_laser': ammo_laser,
                'ammo_rockets': ammo_rockets,
                'generators': generators,
                'weapons': weapons,
                'pet': pet,
                'resources': resources,
                'ore': ore,
                'drones': drones
            }
        }


class HangarSingleton(object):
    instance: list[HangarAPI] = []

    def __new__(cls, aid: str):
        inst = cls.get_instance(aid)
        if inst is None:
            inst = HangarAPI(aid)
            cls.instance.append(inst)
        return inst

    @classmethod
    def get_instance(cls, aid: str):
        if cls.instance is None or len(cls.instance) == 0:
            return None
        for inst in cls.instance:
            if inst.get_id() == aid:
                return inst
        return None


# BACKPAGE
class BackPageActions(Enum):
    START = 1
    DOCK = 2
    AUCTION = 3
    GALAXY_GATES = 4
    PILOT_SHEET = 5
    HALL_OF_FAME = 6
    DAILY_RANK = 7

    def get_str(self):
        switcher = {
            1: 'internalStart',
            2: 'internalDock',
            3: 'internalAuction',
            4: 'internalGalaxyGates',
            5: 'internalPilotSheet',
            6: 'internalHallofFame',
            7: 'internalHallofFame&view=dailyRank'
        }
        return switcher.get(self.value, 'internalStart')

    def __str__(self):
        return self.get_str()


class BackPageAPI(ManagerAbstract):
    def __init__(self, aid: str):
        super().__init__(aid)
        self.data_charts = []
        self.data: RankDataTransferDTO = RankDataTransferDTO(None, None, None)

    # override
    def get_url(self):
        if self.is_valid_instance():
            return self.instance + 'indexInternal.es?action='
        return None

    # override
    def refresh_data(self):
        if not self.is_valid_instance():
            return False

        url = self.get_url_action(BackPageActions.DAILY_RANK)

        try:
            r = requests.get(
                url=url,
                headers=self.get_headers(),
                cookies=self.get_cookies(),
                timeout=5000
            )
        except BaseException:
            print('Exception Refreshing DailyRank', self.aid)
            return False

        now_rank_data: RankDataDTO = RankUtils.parse_daily_rank(r)
        if now_rank_data is not None:
            if self.data.init is None:
                self.data.init = now_rank_data
            self.data.now = now_rank_data

            self.data.diff = RankDataDiffDTO.get_rank_data_diff(self.data.init, self.data.now)
            return True
        else:
            return False

    def get_url_action(self, action: BackPageActions):
        if self.is_valid_instance():
            return self.get_url() + action.get_str()
        return None


class BackPageSingleton(object):
    instance: list[BackPageAPI] = []

    def __new__(cls, aid: str):
        inst = cls.get_instance(aid)
        if inst is None:
            inst = BackPageAPI(aid)
            cls.instance.append(inst)
        return inst

    @classmethod
    def get_instance(cls, aid: str):
        if cls.instance is None or len(cls.instance) == 0:
            return None
        for inst in cls.instance:
            if inst.get_id() == aid:
                return inst
        return None


# GALAXYGATES
class GalaxyGatesActions(Enum):
    INIT = 1
    INFO_GATE_FULL = 2,
    INFO_GATE_LAST = 3

    def get_str(self):
        switcher = {
            1: 'flashinput/galaxyGates.php?action=init&sid={}',
            2: 'jumpgate.php?gateID={}&type=full',
            3: 'jumpgate.php?gateID={}&type=last',
        }
        return switcher.get(self.value, '')

    def __str__(self):
        return self.get_str()


class GalaxyGatesAPI(ManagerAbstract):
    def __init__(self, aid: str):
        super().__init__(aid)
        self.data: GatesDataTransferDTO = GatesDataTransferDTO(None, None, None)

    # override
    def get_url(self):
        if self.is_valid_instance():
            return self.instance
        return None

    # override
    def refresh_data(self):
        if not self.is_valid_instance():
            return False

        url = self.get_url_action(GalaxyGatesActions.INIT)
        if url is not None:
            url = url.format(self.sid)

        try:
            r = requests.get(
                url=url,
                headers=self.get_headers(),
                cookies=self.get_cookies(),
                timeout=5000
            )
        except BaseException:
            print('Exception Refreshing GalaxyGates', self.aid)
            return False

        now_gg_data: GatesDataDTO = GatesUtils.parse_galaxy_gates(r)
        if now_gg_data is not None:
            if self.data.init is None:
                self.data.init = now_gg_data
            self.data.now = now_gg_data

            self.data.diff = GatesDataDiffDTO.get_gates_data_diff(self.data.init, self.data.now)
            self.data.stats.update_stats(self.data.now)
            return True
        else:
            return False

    def get_url_action(self, action: GalaxyGatesActions):
        if self.is_valid_instance():
            return self.get_url() + action.get_str()
        return None


class GalaxyGatesSingleton(object):
    instance: list[GalaxyGatesAPI] = []

    def __new__(cls, aid: str):
        inst = cls.get_instance(aid)
        if inst is None:
            inst = GalaxyGatesAPI(aid)
            cls.instance.append(inst)
        return inst

    @classmethod
    def get_instance(cls, aid: str):
        if cls.instance is None or len(cls.instance) == 0:
            return None
        for inst in cls.instance:
            if inst.get_id() == aid:
                return inst
        return None

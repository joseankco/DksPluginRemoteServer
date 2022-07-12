import abc
import json
import threading
from enum import Enum
from time import sleep
import requests
import base64

from RankTypes import RankDataTransferDTO, RankUtils, RankDataDiffDTO, RankDataDTO
from HangarTypes import HangarListDTO, HangarItemsDTO, HangarItemsDiffDTO


# MANAGER API
class ManagerAbstract(object):
    def __init__(self):
        self.sid = None
        self.instance = None
        self.useragent = 'BigpointClient/1.6.3'
        self.data = None

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


class ManagerSingleton(object):
    def __new__(cls):
        if not hasattr(cls, 'instance'):
            cls.instance = ManagerAPI()
        return cls.instance


class ManagerAPI(object):
    def __init__(self):
        self.backpage = BackPageSingleton()
        self.hangar = HangarSingleton()
        self.thread = threading.Thread()

    def run(self):
        while True:
            self.backpage.refresh_data()
            sleep(2)
            self.hangar.refresh_data()
            sleep(180)

    def run_thread(self):
        if self.thread.is_alive():
            self.thread.kill_receive = True

        self.thread = threading.Thread(target=self.run)
        self.thread.daemon = True
        self.thread.start()

    def set_sesion(self, instance, sid):
        self.backpage.set_sesion(instance, sid)
        self.hangar.set_sesion(instance, sid)


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


class HangarSingleton(object):
    def __new__(cls):
        if not hasattr(cls, 'instance'):
            cls.instance = HangarAPI()
        return cls.instance


class HangarAPI(ManagerAbstract):
    def __init__(self):
        super().__init__()
        self.active_hangar = None
        self.data_charts = []
        self.data: RankDataTransferDTO = RankDataTransferDTO(None, None, None)
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
        r = requests.get(
            url=url,
            headers=self.get_headers(),
            cookies=self.get_cookies(),
            timeout=2500
        )
        data_decoded = base64.b64decode(r.text)
        data = json.loads(data_decoded)
        if data['isError'] == 0:
            self.hangar_list = HangarListDTO(data['data']['ret']['hangars'])
            return True
        return False

    def refresh_items(self):
        if not self.is_valid_instance():
            return False

        active = self.hangar_list.get_active_hangar()
        url = self.get_url_action(HangarActions.HANGAR_ITEMS) + active.get_encoded_params()
        r = requests.get(
            url=url,
            headers=self.get_headers(),
            cookies=self.get_cookies(),
            timeout=2500
        )
        data_decoded = base64.b64decode(r.text)
        data = json.loads(data_decoded)
        if data['isError'] == 0:
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


class BackPageSingleton(object):
    def __new__(cls):
        if not hasattr(cls, 'instance'):
            cls.instance = BackPageAPI()
        return cls.instance


class BackPageAPI(ManagerAbstract):
    def __init__(self):
        super().__init__()
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
        r = requests.get(
            url=url,
            headers=self.get_headers(),
            cookies=self.get_cookies(),
            timeout=2500
        )

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

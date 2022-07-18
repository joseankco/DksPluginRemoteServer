from time import time


class PalladiumStatsAPI(object):
    def __init__(self, aid: str):
        self.aid = aid
        self.data = []

    def get_id(self):
        return self.aid

    def add_data(self, data):
        value = PalladiumStatsData(data)
        if value.get_is_valid():
            self.data.append(value)
            self.process_data()
            return True
        return False

    def process_data(self):
        if len(self.data) == 100:
            first = self.data[0:50]
            first_p = []
            for i in range(0, len(first), 2):
                p1 = first[i]
                p2 = first[i + 1]
                p = PalladiumStatsData(None)
                p.set_data(
                    (p1.tick + p2.tick) / 2,
                    (p1.total + p2.total) / 2,
                    (p1.totalh + p2.totalh) / 2,
                    (p1.eeh + p2.eeh) / 2
                )
                first_p.append(p)
            self.data = first_p + self.data[50:]

    def get_data(self):
        return self.data


class PalladiumStatsData(object):
    def __init__(self, data):
        try:
            self.tick = round(time() * 1000)
            self.total = int(data['total'].replace('.', ''))
            self.totalh = int(data['totalh'].replace('.', ''))
            self.eeh = int(data['eeh'].replace('.', '').replace('~', ''))
            self.is_valid = True
        except Exception:
            self.is_valid = False

    def set_data(self, tick, total, totalh, eeh):
        self.tick = round(tick)
        self.total = int(total)
        self.totalh = int(totalh)
        self.eeh = int(eeh)
        self.is_valid = True

    def get_is_valid(self):
        return self.is_valid


class PalladiumStatsSingleton(object):
    instance: list[PalladiumStatsAPI] = []

    def __new__(cls, aid: str):
        inst = cls.get_instance(aid)
        if inst is None:
            inst = PalladiumStatsAPI(aid)
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

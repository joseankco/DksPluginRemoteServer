from time import time
from typing import Optional

from bs4 import BeautifulSoup
import re


class RankDTO(object):
    def __init__(self, name, points, img):
        if isinstance(points, str):
            ipoints = int(RankUtils.sanitize(points))
        else:
            ipoints = int(points)
        self.points = ipoints
        self.name = name
        self.img = img.split('?__cv=')[0].replace(RankUtils.URL, '')


class RankDataDTO(object):
    def __init__(self, upper: RankDTO, current: RankDTO, lower: RankDTO):
        self.upper = upper
        self.current = current
        self.lower = lower
        self.tick = round(time() * 1000)


class RankDataDiffDTO(object):
    def __init__(self, upper, current, lower):
        self.upper = upper
        self.current = current
        self.lower = lower

    @staticmethod
    def get_rank_data_diff(init: RankDataDTO, current: RankDataDTO):
        return RankDataDiffDTO(
            current.upper.points - init.upper.points,
            current.current.points - init.current.points,
            current.lower.points - init.lower.points
        )


class RankDataTransferDTO(object):
    def __init__(self, init: RankDataDTO, now: RankDataDTO, diff: RankDataDiffDTO):
        self.init = init
        self.now = now
        self.diff = diff


class RankUtils(object):
    URL = 'https://darkorbit-22.bpsecure.com/do_img/global/ranks/rank_'

    @staticmethod
    def sanitize(num: str) -> str:
        return num.replace('.', '').replace(',', '')

    @staticmethod
    def parse_daily_rank(r) -> Optional[RankDataDTO]:
        try:
            soup = BeautifulSoup(r.text, 'html.parser')
            daily_points = soup.find(id='hof_daily_points_points')
            upper = None
            lower = None
            for img in soup.findAll('img'):
                src = img['src']
                if src is not None and RankUtils.URL in src:
                    rank_name = img.find_next_sibling('strong').getText()
                    rank_needed = re.findall(r'\d+', RankUtils.sanitize(img.findParent().getText()))[0]

                    rank = RankDTO(rank_name, rank_needed, src)
                    if upper is None:
                        upper = rank
                    else:
                        lower = rank

            current_name = soup.find(id='hof_content') \
                .findChild('div', {'class', 'small_grey_center'}) \
                .findChild('strong').getText()
            upper_n = upper.img.replace(RankUtils.URL, '').split('.png')[0]
            current_img = RankUtils.URL + str(int(upper_n) - 1) + '.png'
            current = RankDTO(current_name, daily_points.getText(), current_img)

            if upper is not None and current is not None and lower is not None:
                return RankDataDTO(upper, current, lower)
            return None
        except BaseException as e:
            print('Exception Parse_Daily_Rank', str(e))
            return None

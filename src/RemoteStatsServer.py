import json
import time

from flask import Flask, request, render_template
from flask_sock import Sock
import sys
import os
from FlaskServerApp import FlaskServerApp
import logging

from Manager import ManagerSingleton, ManagerAPI
from PalladiumStats import PalladiumStatsAPI, PalladiumStatsSingleton

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

server_data: str = None
manager_api: ManagerAPI = ManagerSingleton()
palladium_api: PalladiumStatsAPI = PalladiumStatsSingleton()

if getattr(sys, 'frozen', False):
    template_folder = os.path.join(sys._MEIPASS, 'templates')
    static_folder = os.path.join(sys._MEIPASS, 'static')
    app = Flask(__name__, template_folder=template_folder, static_folder=static_folder)
else:
    app = Flask(__name__)

sock = Sock(app)

rank_data_last_tick = 0
hangar_data_last_tick = 0


def reset_ticks():
    global rank_data_last_tick
    global hangar_data_last_tick
    rank_data_last_tick = 0
    hangar_data_last_tick = 0


def parse_post_data(data):
    global manager_api
    global rank_data_last_tick
    global hangar_data_last_tick

    # INSTANCE, DOSID
    sesion = data.get('sesion')
    del data['sesion']

    # BACKPAGE
    manager_api.set_sesion(sesion.get('instance'), sesion.get('sid'))

    rank_data = manager_api.backpage.get_data()
    hangar_data = manager_api.hangar.get_data()
    data['charts'] = {}
    if palladium_api.add_data(data['plugin']['palladiumStats']):
        data['charts']['palladiumStats'] = palladium_api.get_data()

    if rank_data is not None and rank_data.now is not None:
        if rank_data.now.tick != rank_data_last_tick:
            data['rankData'] = rank_data
            rank_data_last_tick = rank_data.now.tick
    if hangar_data is not None and 'diff' in hangar_data.keys():
        if hangar_data['diff'].tick != hangar_data_last_tick:
            data['hangarData'] = hangar_data
            hangar_data_last_tick = hangar_data['diff'].tick

    return data


@app.route('/', methods=['POST'])
def result():
    global server_data
    response = parse_post_data(request.get_json())
    server_data = json.dumps(response, default=lambda x: x.__dict__)
    return '200'


@app.route('/', methods=['GET'])
def index():
    reset_ticks()
    return render_template('index.html')


@sock.route('/stats')
def echo_stats(ws):
    try:
        global server_data
        while True:
            if server_data is not None:
                ws.send(server_data)
                server_data = None
            time.sleep(1)
    except Exception as e:
        reset_ticks()
        print(e)


def main():
    server_app = FlaskServerApp(app)
    server_app.run()


if __name__ == '__main__':
    main()

import time
import hashlib
from colorama import Fore
from flask import Flask, request, render_template
from flask_sock import Sock
import sys
import os
import json
from FlaskServerApp import FlaskServerApp
import logging

# API Backend
from Manager import ManagerSingleton, ManagerAPI
from PalladiumStats import PalladiumStatsAPI, PalladiumStatsSingleton
manager_api: ManagerAPI = ManagerSingleton()
palladium_api: PalladiumStatsAPI = PalladiumStatsSingleton()

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

if getattr(sys, 'frozen', False):
    template_folder = os.path.join(sys._MEIPASS, 'templates')
    static_folder = os.path.join(sys._MEIPASS, 'static')
    app = Flask(__name__, template_folder=template_folder, static_folder=static_folder)
else:
    app = Flask(__name__)

sock = Sock(app)
server_data_hash = {}
server_ticks_hash = {}
server_fails_hash = {}
TICK_FAIL_LIMIT = 60
is_server_hashed = False

# API Backend
rank_data_last_tick = 0
hangar_data_last_tick = 0


def reset_ticks():
    global rank_data_last_tick
    global hangar_data_last_tick
    rank_data_last_tick = 0
    hangar_data_last_tick = 0


def hash_string_md5(s):
    return hashlib.md5(s.encode('utf-8')).hexdigest()


def parse_post_data(data):
    global manager_api
    global rank_data_last_tick
    global hangar_data_last_tick

    # INSTANCE, DOSID
    sesion = data.get('sesion')
    del data['sesion']

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


def parse_data_to_json(data):
    return json.dumps(data, default=lambda x: x.__dict__)


@app.route('/', methods=['POST'])
def result():
    global server_data_hash
    global is_server_hashed

    response = parse_post_data(request.get_json())
    accid = str(response['hero']['id'])
    if accid != '0':
        response['hashed'] = is_server_hashed
        if is_server_hashed:
            accid = hash_string_md5(accid)
            response['hero']['id'] = accid
            response['hero']['username'] = hash_string_md5(response['hero']['username'])
        server_data_hash[accid] = response
    return '200'


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')


@app.errorhandler(404)
def page_not_found(enf):
    return render_template('index.html')


def get_param(r):
    try:
        accid = r.args.get('id')
    except BaseException as exc:
        accid = None
    return accid


def get_multiple_data():
    global TICK_FAIL_LIMIT
    global server_ticks_hash
    global server_fails_hash
    global server_data_hash

    array = [value for key, value in server_data_hash.items()]
    for data in array:
        if 'plugin' in data.keys():
            del data['plugin']
        accid = data['hero']['id']
        tick = server_ticks_hash.get(accid, -1)
        fails = server_fails_hash.get(accid, 0)
        if tick == -1 or data['tick'] != tick:
            server_ticks_hash[accid] = data['tick']
            server_fails_hash[accid] = 0
        else:
            server_fails_hash[accid] = fails + 1
            if server_fails_hash[accid] >= TICK_FAIL_LIMIT:
                del server_fails_hash[accid]
                del server_ticks_hash[accid]
                del server_data_hash[accid]
    return array


def get_single_data(accid):
    global server_data_hash
    global server_ticks_hash
    global server_fails_hash

    if accid in server_data_hash.keys():
        data = server_data_hash.get(accid)
        tick = server_ticks_hash.get(accid, -1)
        if tick == -1 or data['tick'] != tick:
            server_ticks_hash[accid] = data['tick']
            server_fails_hash[accid] = 0
            return data
    return None


@sock.route('/stream')
def echo(ws):
    global server_data_hash

    try:
        while True:
            accid = get_param(request)
            if accid is not None:
                data = get_single_data(accid)
                if data is not None:
                    ws.send(parse_data_to_json(data))
            elif server_data_hash != {}:
                data = get_multiple_data()
                ws.send(parse_data_to_json(data))
            time.sleep(1)
    except BaseException as e:
        reset_ticks()


def main():
    global is_server_hashed

    server_app = FlaskServerApp(app)
    is_server_hashed = server_app.get_hashed()
    server_app.run()
    server_app.run_gui()


if __name__ == '__main__':
    try:
        main()
    except BaseException as e:
        if 'The authtoken you specified does not look like a proper ngrok tunnel authtoken' in str(e):
            print(Fore.RED + 'An error occurred with your Auth Token. Try to reset it at '
                             'https://dashboard.ngrok.com/get-started/your-authtoken and reconfigure the plugin.' + Fore.RESET)
        input()

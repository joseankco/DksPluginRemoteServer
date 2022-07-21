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
rank_data_last_tick = {}
hangar_data_last_tick = {}
palladium_api: PalladiumStatsAPI = None

manager_api_hash = {}
palladium_api_hash = {}
account_id = None


def reset_ticks():
    global rank_data_last_tick
    global hangar_data_last_tick
    rank_data_last_tick = {}
    hangar_data_last_tick = {}


def fill_ticks_if_empty(accid, tick):
    if rank_data_last_tick.get(accid, None) is None:
        rank_data_last_tick[accid] = {'tick': tick, 'sent': False}
    if hangar_data_last_tick.get(accid, None) is None:
        hangar_data_last_tick[accid] = {'tick': tick, 'sent': False}


def reset_acc_id():
    global account_id
    account_id = None


def mark_all_unsent():
    for key, value in rank_data_last_tick.items():
        value['sent'] = False


def hash_string_md5(s):
    return hashlib.md5(s.encode('utf-8')).hexdigest()


def parse_post_data(data):
    global manager_api_hash
    global palladium_api_hash
    global rank_data_last_tick
    global hangar_data_last_tick

    # INSTANCE, DOSID
    sesion = data.get('sesion')
    del data['sesion']

    accid = str(data['hero']['id'])
    if accid != '0':

        data['hashed'] = is_server_hashed
        if is_server_hashed:
            accid = hash_string_md5(accid)
            data['hero']['id'] = accid
            data['hero']['username'] = hash_string_md5(data['hero']['username'])

        fill_ticks_if_empty(accid, 0)

        manager = manager_api_hash.get(accid, None)
        if manager is None:
            manager = ManagerSingleton(accid)
            manager_api_hash[accid] = manager
        if not manager.is_thread_alive():
            manager.run_thread()

        manager.set_sesion(sesion['instance'], sesion['sid'])
        # palladium_api = PalladiumStatsSingleton(accid)

        rank_data = manager.backpage.get_data()
        hangar_data = manager.hangar.get_data()
        # data['charts'] = {}
        # if palladium_api.add_data(data['plugin']['palladiumStats']):
        # data['charts']['palladiumStats'] = palladium_api.get_data()

        if rank_data is not None and rank_data.now is not None:
            data['rankData'] = rank_data
            if rank_data.now.tick != rank_data_last_tick[accid]['tick']:
                rank_data_last_tick[accid] = {'tick': rank_data.now.tick, 'sent': False}
        if hangar_data is not None and 'diff' in hangar_data.keys():
            data['hangarData'] = hangar_data
            if hangar_data['diff'].tick != hangar_data_last_tick[accid]['tick']:
                hangar_data_last_tick[accid] = {'tick': hangar_data['diff'].tick, 'sent': False}

        server_data_hash[accid] = data

    return data


def parse_data_to_json(data):
    return json.dumps(data, default=lambda x: x.__dict__)


@app.route('/', methods=['POST'])
def result():
    global server_data_hash
    global is_server_hashed
    parse_post_data(request.get_json())
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
    global rank_data_last_tick
    global hangar_data_last_tick

    array = [value for key, value in server_data_hash.items()]
    for data in array:
        if 'plugin' in data.keys():
            del data['plugin']
        accid = data['hero']['id']
        tick = server_ticks_hash.get(accid, -1)
        fails = server_fails_hash.get(accid, 0)

        if 'rankData' in data.keys():
            del data['rankData']

        if 'hangarData' in data.keys():
            del data['hangarData']

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

        # print(data.keys())
        if 'rankData' in data.keys():
            if rank_data_last_tick[accid]['sent']:
                del data['rankData']
                # print('del rank data', rank_data_last_tick[accid]['tick'], accid)
            else:
                # print('sent rank data', rank_data_last_tick[accid]['tick'], accid)
                rank_data_last_tick[accid]['sent'] = True

        if 'hangarData' in data.keys():
            if hangar_data_last_tick[accid]['sent']:
                del data['hangarData']
                # print('del hangar data:', hangar_data_last_tick[accid]['tick'], accid)
            else:
                # print('sent hangar data:', hangar_data_last_tick[accid]['tick'], accid)
                hangar_data_last_tick[accid]['sent'] = True

        if tick == -1 or data['tick'] != tick:
            server_ticks_hash[accid] = data['tick']
            server_fails_hash[accid] = 0
            return data
    return None


def process_input_message(command: str):
    global account_id
    if command is not None:
        if command.startswith('switch'):
            account_id = command.split(':')[1]
            reset_ticks()
            fill_ticks_if_empty(account_id, round(time.time() * 1000))
        elif command == 'multiple':
            account_id = None
        # mark_all_unsent()


@sock.route('/stream')
def echo(ws):
    global server_data_hash
    global account_id

    try:
        while True:
            # accid = get_param(request)
            process_input_message(ws.receive(0))
            if account_id is not None:
                data = get_single_data(account_id)
                if data is not None:
                    ws.send(parse_data_to_json(data))
            elif server_data_hash != {}:
                data = get_multiple_data()
                ws.send(parse_data_to_json(data))
            time.sleep(1)
    except BaseException as e:
        reset_ticks()
        reset_acc_id()


def main():
    global is_server_hashed

    server_app = FlaskServerApp(app)
    is_server_hashed = server_app.get_hashed()
    server_app.run()


if __name__ == '__main__':
    try:
        main()
    except SystemExit:
        pass
    except BaseException as e:
        if 'The authtoken you specified does not look like a proper ngrok tunnel authtoken' in str(e):
            print(Fore.RED + 'An error occurred with your Auth Token. Try to reset it at '
                             'https://dashboard.ngrok.com/get-started/your-authtoken and reconfigure the plugin.' + Fore.RESET)
        print('Exception:', e)
        input()

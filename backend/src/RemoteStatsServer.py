import time
import hashlib
from typing import Optional

import bs4
import requests
from colorama import Fore
from flask import Flask, request, render_template, jsonify, send_file, make_response
from flask_sock import Sock
import sys
import os
import json
from FlaskServerApp import FlaskServerApp, Version
import logging
from flask_cors import CORS

# API Backend
from Manager import ManagerSingleton, ManagerAPI
from PalladiumStats import PalladiumStatsAPI, PalladiumStatsSingleton
from RankTypes import RankDataTransferDTO
from HangarTypes import HangarDataTransferDTO
from GalaxyTypes import GatesDataTransferDTO

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

if getattr(sys, 'frozen', False):
    template_folder = os.path.join(sys._MEIPASS, 'templates')
    static_folder = os.path.join(sys._MEIPASS, 'static')
    app = Flask(__name__, template_folder=template_folder, static_folder=static_folder)
else:
    app = Flask(__name__)

CORS(app)
sock = Sock(app)

server_data_hash = {}
server_ticks_hash = {}
server_fails_hash = {}
TICK_FAIL_LIMIT = 60
is_server_hashed = False

# API Backend
rank_data_last_tick = {}
hangar_data_last_tick = {}
galaxy_data_last_tick = {}
palladium_api: PalladiumStatsAPI = None

manager_api_hash = {}
palladium_api_hash = {}
account_id = None
server_response = {}

unhash_id = {}
server_start_time = round(time.time() * 1000)


def set_server_response(action, aid, parameter=''):
    global server_response
    global app

    if aid is None:
        aid = 'all'

    if parameter is None:
        parameter = ''

    with app.app_context():
        server_response = jsonify({
            'action': action,
            'id': aid,
            'tick': round(time.time() * 1000),
            'parameter': parameter
        })
        server_response.status_code = 200


def reset_ticks():
    global rank_data_last_tick
    global hangar_data_last_tick
    global galaxy_data_last_tick

    rank_data_last_tick = {}
    hangar_data_last_tick = {}
    galaxy_data_last_tick = {}


def fill_ticks_if_empty(accid, tick):
    global rank_data_last_tick
    global hangar_data_last_tick
    global galaxy_data_last_tick

    if rank_data_last_tick.get(accid, None) is None:
        rank_data_last_tick[accid] = {'tick': tick, 'sent': False}
    if hangar_data_last_tick.get(accid, None) is None:
        hangar_data_last_tick[accid] = {'tick': tick, 'sent': False}
    if galaxy_data_last_tick.get(accid, None) is None:
        galaxy_data_last_tick[accid] = {'tick': tick, 'sent': False}


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
    global galaxy_data_last_tick
    global server_start_time

    # INSTANCE, DOSID
    sesion = data.get('sesion')
    del data['sesion']

    accid = str(data['hero']['id'])
    if accid != '0':
        data['serverStartTime'] = server_start_time
        data['hashed'] = is_server_hashed
        orig_id = accid
        if is_server_hashed:
            accid = hash_string_md5(accid)
            data['hero']['id'] = accid
            data['hero']['username'] = hash_string_md5(data['hero']['username'])
        unhash_id[str(data['hero']['id'])] = orig_id

        fill_ticks_if_empty(accid, 0)

        manager = manager_api_hash.get(accid, None)
        if manager is None:
            manager = ManagerSingleton(accid)
            manager_api_hash[accid] = manager
        if not manager.is_thread_alive():
            manager.run_thread()

        manager.set_sesion(sesion['instance'], sesion['sid'])
        # palladium_api = PalladiumStatsSingleton(accid)

        rank_data: RankDataTransferDTO = manager.backpage.get_data()
        hangar_data = manager.hangar.get_data()
        galaxy_data: GatesDataTransferDTO = manager.galaxy.get_data()
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
        if galaxy_data is not None and galaxy_data.now is not None:
            data['galaxyData'] = galaxy_data
            if galaxy_data.now.tick != galaxy_data_last_tick[accid]['tick']:
                galaxy_data_last_tick[accid] = {'tick': galaxy_data.now.tick, 'sent': False}

        server_data_hash[accid] = data

    return data


def get_sesion_data():
    global account_id
    manager = manager_api_hash.get(account_id, None)
    if manager is None:
        manager: ManagerAPI = ManagerSingleton(account_id)
        manager_api_hash[account_id] = manager
    return [manager.get_sid(), manager.get_instance()]


def parse_data_to_json(data):
    return json.dumps(data, default=lambda x: x.__dict__)


@app.route('/set-account', methods=['POST'])
def set_account():
    global account_id
    data = request.get_json()
    accid = data['id']
    if accid != '':
        account_id = accid
        reset_ticks()
        fill_ticks_if_empty(account_id, round(time.time() * 1000))
    else:
        account_id = None

    response = jsonify()
    response.status_code = 200
    return response


@app.route('/get-sid', methods=['POST'])
def get_sid():
    global account_id
    data = request.get_json()
    pswd = hashlib.md5(data['password'].encode('utf-8')).hexdigest()

    checked = False
    if os.path.exists(Version().working_dir + '\\passwd'):
        with open(Version().working_dir + '\\passwd', 'r') as passwd:
            checked = passwd.readlines()[0] == pswd

        if checked:
            sesion = get_sesion_data()
            response = jsonify({'sid': sesion[0], 'instance': sesion[1]})
            response.status_code = 200
            response.set_cookie('dosid', sesion[0], secure=True)
            return response
        else:
            response = jsonify()
            response.status_code = 403
            return response

    response = jsonify()
    response.status_code = 404
    return response


@app.route('/get-gate', methods=['GET'])
def get_gate_full():
    global account_id
    global unhash_id

    gate_id = request.args.get('gate')
    gtype = request.args.get('type')
    session = get_sesion_data()
    if gate_id is not None and session is not None and account_id is not None:
        if gtype is None:
            gtype = 'full'
        accid = unhash_id[account_id]
        r = requests.get(
            session[1] + 'jumpgate.php?userID=' + accid + '&gateID=' + gate_id + '&type=' + gtype,
            cookies={'dosid': session[0]},
            headers={
                'User-Agent': 'BigpointClient/1.6.7',
            }
        )
        response = make_response(r.content)
        response.headers.set('Content-Type', 'image/png')
        return response

    response = jsonify()
    response.status_code = 404
    return response


@app.route('/get-pilot-sheet', methods=['GET'])
def get_pilot_sheet():
    global account_id
    global unhash_id

    session = get_sesion_data()
    if session is not None and account_id is not None:
        r = requests.post(
            session[1] + 'ajax/pilotprofil.php',
            data={'command': 'getInternalProfilPage', 'type': 'showSkilltree'},
            cookies={'dosid': session[0]},
            headers={'User-Agent': 'BigpointClient/1.6.7'},
        )
        append = '<head>'
        append += '<link rel="stylesheet" href="https://darkorbit-22.bpsecure.com/css/cdn/internalPilotSheet.css">'
        append += '<script src="https://darkorbit-22.bpsecure.com/js/base.js"></script>'
        append += '<script src="https://darkorbit-22.bpsecure.com/js/scriptaculous/tooltip.js"></script>'
        append += '<script src="https://darkorbit-22.bpsecure.com/js/tooltipPilotSheet.js"></script>'
        append += '</head>'
        # skilltree_font pilotSheet -> skilltree_font
        # id="directlink_logfiles" -> ''
        # class="skillResetButton" -> ''

        soup = bs4.BeautifulSoup(json.loads(r.text)['code'], 'html.parser')
        response = soup.find('div', {'id': 'skillTreeHorScrollable'})
        response = str(response)
        response = response.replace('class="scrollBackground"', '')
        response = response.replace('id="skillTreeHorScrollable"', 'style="font-size: 0.8em"')

        response = make_response(append + response)
        return response

    response = jsonify()
    response.status_code = 404
    return response


@app.route('/', methods=['POST'])
def result():
    global server_data_hash
    global is_server_hashed
    global server_response
    parse_post_data(request.get_json())
    return server_response


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

        if 'galaxyData' in data.keys():
            del data['galaxyData']

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
    global rank_data_last_tick
    global hangar_data_last_tick
    global galaxy_data_last_tick

    if accid in server_data_hash.keys():
        data = server_data_hash.get(accid)
        tick = server_ticks_hash.get(accid, -1)

        # print(data.keys())
        if 'rankData' in data.keys():
            if rank_data_last_tick[accid]['sent']:
                del data['rankData']
            else:
                rank_data_last_tick[accid]['sent'] = True

        if 'hangarData' in data.keys():
            if hangar_data_last_tick[accid]['sent']:
                del data['hangarData']
            else:
                hangar_data_last_tick[accid]['sent'] = True

        if 'galaxyData' in data.keys():
            if galaxy_data_last_tick[accid]['sent']:
                del data['galaxyData']
            else:
                galaxy_data_last_tick[accid]['sent'] = True

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
        elif command.startswith('action'):
            spl = command.split(':')
            action = spl[1]
            parameters = spl[2]
            set_server_response(action, account_id, parameters)


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
        set_server_response('none', 'all')


def main():
    global is_server_hashed

    server_app = FlaskServerApp(app)
    is_server_hashed = server_app.get_hashed()
    server_app.run()


if __name__ == '__main__':
    try:
        set_server_response('none', 'all')
        main()
    except SystemExit:
        pass
    except BaseException as e:
        if 'The authtoken you specified does not look like a proper ngrok tunnel authtoken' in str(e):
            print(Fore.RED + 'An error occurred with your Auth Token. Try to reset it at '
                             'https://dashboard.ngrok.com/get-started/your-authtoken and reconfigure the plugin.' + Fore.RESET)
        print('Exception:', e)
        input()

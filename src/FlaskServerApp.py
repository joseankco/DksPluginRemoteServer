import sys
import time

import requests
from flask import Flask
import threading
import argparse
from pyngrok import ngrok, conf
from pyngrok.conf import PyngrokConfig
import qrcode
import os
from pathlib import Path
import io
from colorama import *
import webbrowser
import json

init()

NGROK_PATH = str(Path.home()) + '\\ngrok\\ngrok.exe'
conf.set_default(PyngrokConfig(ngrok_path=NGROK_PATH))


class Version(object):
    def __init__(self):
        self.version = '1.0.1'
        self.min_plugin_version = '1.3.3'
        self.url = 'https://gist.githubusercontent.com/joseankco/bbddd86e6f2c12cf2fe81658b579587f/raw/server.json'
        self.update_url = 'https://gist.githubusercontent.com/joseankco/bbddd86e6f2c12cf2fe81658b579587f/raw/RemoteStatsServer.exe'
        self.latest_version = None
        self.latest_min_plugin_version = None

    def load_latest_version(self):
        try:
            r = requests.get(url=self.url, timeout=5000)
            data = json.loads(r.text.encode('utf-8').decode())
            self.latest_version = data['version']
            self.latest_min_plugin_version = data['minPluginVersion']
        except Exception:
            print('Fail while loading latest version')

    def check_updates(self, print_uptodate=True):
        self.load_latest_version()
        if self.version == self.latest_version:
            if print_uptodate:
                print(self)
                print(Fore.GREEN + 'Already up-to-date' + Fore.RESET)
        else:
            print(Fore.RED + 'Update Required')
            print('Server Version: {} -> {}'.format(self.version, self.latest_version))
            if self.min_plugin_version == self.latest_min_plugin_version:
                print('Required DksPlugin Version: {}'.format(self.min_plugin_version))
            else:
                print('Required DksPlugin Version: {} -> {}'.format(self.min_plugin_version, self.latest_min_plugin_version))
            print(Fore.RESET, end='')
            print('Do you want to download the latest version? (y/N)')
            key = input('> ')
            if key.lower() in ['y', 'ye', 'yes', 'si', 'sí', 's']:
                print(self.update_url)
                webbrowser.open(self.update_url, new=2)
            exit(0)

    def __str__(self):
        return Fore.GREEN +\
               'Server Version: ' + self.version +\
               '\nRequired DksPlugin Version: ' + self.min_plugin_version +\
               Fore.RESET\



def parse_args():
    parser = argparse.ArgumentParser(formatter_class=argparse.ArgumentDefaultsHelpFormatter)

    parser.add_argument('--host', type=str,
                        help='Host where to run the server',
                        default='localhost', dest='host')

    parser.add_argument('--port', type=int,
                        help='Port where to run the server',
                        default=8085, dest='port')

    parser.add_argument('--auth', type=str,
                        help='Ngrok Auth Token. Visit: https://dashboard.ngrok.com/get-started/your-authtoken',
                        default=None, dest='token')

    parser.add_argument('--ngrok', dest='run_ngrok', action='store_true')
    parser.add_argument('--no-ngrok', dest='run_ngrok', action='store_false')
    parser.set_defaults(run_ngrok=True)

    return parser.parse_args()


def get_ngrok_path():
    return os.path.realpath(conf.get_default().ngrok_path.replace('ngrok.exe', ''))


def get_banner():
    print(Fore.GREEN, end='')
    print('''  ____  _        ____  _             _       
 |  _ \| | _____|  _ \| |_   _  __ _(_)_ __  
 | | | | |/ / __| |_) | | | | |/ _` | | '_ \ 
 | |_| |   <\__ \  __/| | |_| | (_| | | | | |
 |____/|_|\_\___/_|   |_|\__,_|\__, |_|_| |_|
                               |___/ Ter.DKS''')
    print(Style.RESET_ALL)


class FlaskServerApp(object):
    def __init__(self, flask_app: Flask):
        self.args = parse_args()
        self.flask_app = flask_app
        self.flask_thread: threading.Thread = threading.Thread()
        self.qrcode = None
        self.tunnel = None

    def get_host(self):
        return self.args.host

    def get_port(self):
        return self.args.port

    def get_auth_token(self):
        return self.args.token

    def run_flask_app(self):
        self.flask_app.run(host=self.get_host(), port=self.get_port())

    def run_flask_thread(self):
        if self.flask_thread.is_alive():
            self.flask_thread.kill_receive = True

        self.flask_thread = threading.Thread(target=self.run_flask_app)
        self.flask_thread.daemon = True
        self.flask_thread.start()

    def should_run_ngrok(self):
        return self.args.run_ngrok

    def run_ngrok(self):
        if self.get_auth_token() is not None:
            ngrok.set_auth_token(self.get_auth_token())

        self.tunnel = ngrok.connect(self.get_port())

    def refresh_ngrok(self):
        ngrok.kill()
        self.run_ngrok()

    def plot_qrcode(self):
        qr = qrcode.QRCode()
        qr.add_data(self.tunnel.public_url)
        f = io.StringIO()
        qr.print_ascii(out=f)
        f.seek(0)
        lines = f.readlines()
        for i in range(2, len(lines) - 2):
            print('  ', lines[i], end='')

    def wait_processes(self):
        ngrok_process = ngrok.get_ngrok_process()
        try:
            ngrok_process.proc.wait()
        except KeyboardInterrupt:
            ngrok.kill()
            self.flask_thread.kill_receive = True

    def print_status(self):
        os.system('cls')
        get_banner()
        self.plot_qrcode()
        print('    {}'.format(self.tunnel.public_url))
        print()
        print('k=kill, r=refresh, w=ngrok path, d=donate')
        print('       v=version, u=check updates')

    def run(self):
        self.run_flask_thread()
        if self.should_run_ngrok():
            self.run_ngrok()

    def kill(self):
        ngrok.kill()
        self.flask_thread.kill_receive = True
        sys.exit()

    def run_gui(self):
        try:
            os.system('cls')
            Version().check_updates(False)
            while True:
                self.print_status()
                key = input('> ')
                if key.lower() in ['k', 'kill', '!k', '!kill', 'q', 'quit', '!q', '!quit', 'exit']:
                    self.kill()
                elif key.lower() in ['w', 'where', '!w', '!where']:
                    print(Fore.BLUE, end='')
                    path = get_ngrok_path()
                    print(path)
                    os.startfile(path)
                    print(Fore.RESET, end='')
                    time.sleep(5)
                elif key.lower() in ['r', 'refresh', '!r', '!refresh']:
                    self.refresh_ngrok()
                elif key.lower() in ['d', 'donate', '!d', '!donate']:
                    print(Fore.RED, end='')
                    url = 'https://www.paypal.me/joseankco'
                    print(url)
                    webbrowser.open(url, new=2)
                    print(Fore.RESET, end='')
                    time.sleep(5)
                elif key.lower() in ['v', 'version', '!v', '!version']:
                    print(str(Version()))
                    time.sleep(5)
                elif key.lower() in ['u', 'updates', '!u', '!updates']:
                    Version().check_updates()
                    time.sleep(5)
        except KeyboardInterrupt:
            self.kill()

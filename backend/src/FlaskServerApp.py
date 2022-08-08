import argparse
import hashlib
import io
import json
import os
import ssl
import subprocess
import sys
import threading
import time
import webbrowser
from pathlib import Path

import qrcode
import requests
from colorama import *
from flask import Flask
from pyngrok import ngrok, conf, installer
from pyngrok.conf import PyngrokConfig

init()
os.system('title DksPluginRemoteServer')

NGROK_PATH = str(Path.home()) + '\\ngrok\\ngrok.exe'
conf.set_default(PyngrokConfig(ngrok_path=NGROK_PATH))


def install_ngrok():
    pyngrok_config = conf.get_default()
    if not os.path.exists(pyngrok_config.ngrok_path):
        myssl = ssl.create_default_context()
        myssl.check_hostname = False
        myssl.verify_mode = ssl.CERT_NONE
        installer.install_ngrok(pyngrok_config.ngrok_path, context=myssl)


class Version(object):
    def __init__(self):
        self.version = '3.1.5'
        self.min_plugin_version = '1.4.0'
        self.url = 'https://gist.githubusercontent.com/joseankco/bbddd86e6f2c12cf2fe81658b579587f/raw/server.json'
        self.update_url = 'https://gist.githubusercontent.com/joseankco/bbddd86e6f2c12cf2fe81658b579587f/raw/RemoteStatsServer.exe'
        self.latest_version = None
        self.latest_min_plugin_version = None

        self.fullpath = None
        self.fullpath_old = None
        self.args = None
        self.working_dir = None
        self.load_directories()

    def load_directories(self):
        exe = sys.argv[0]
        current = os.getcwd()
        if os.path.isabs(exe):
            self.fullpath = exe
        else:
            self.fullpath = current + '\\' + exe
        self.fullpath_old = self.fullpath + '_old'
        self.working_dir = os.path.dirname(self.fullpath)

        self.try_remove_old()

        self.args = ' '
        for i in range(1, len(sys.argv)):
            self.args += sys.argv[i] + ' '

    def load_latest_version(self):
        try:
            r = requests.get(url=self.url, timeout=5000)
            data = json.loads(r.text.encode('utf-8').decode())
            self.latest_version = data['version']
            self.latest_min_plugin_version = data['minPluginVersion']
        except BaseException as exc:
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
                print('Minimum Required DksPlugin Version: {}'.format(self.min_plugin_version))
            else:
                print('Minimum Required DksPlugin Version: {} -> {}'.format(self.min_plugin_version,
                                                                            self.latest_min_plugin_version))
            print(Fore.RESET, end='')
            print('Do you want to download the latest version? (y/N)')
            key = input('> ')
            if key.lower() in ['y', 'ye', 'yes', 'si', 'sí', 's']:
                self.do_update()
            if key.lower() != 'imadevxd':
                sys.exit(0)

    def try_remove_old(self):
        if os.path.exists(self.fullpath_old):
            os.remove(self.fullpath_old)

    def do_update(self):
        self.try_remove_old()
        response = requests.get(self.update_url)
        if response.status_code == 200:
            os.rename(self.fullpath, self.fullpath_old)
            with open(self.fullpath, 'wb') as output:
                output.write(response.content)
            os.system('cls')
            flags = subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP
            subprocess.Popen(self.fullpath + self.args, shell=True, creationflags=flags)
        else:
            print('Error Updating. Manual Update at: ' + self.update_url)
            input()
        sys.exit(0)

    def get_version_v(self):
        return 'v' + self.version

    def __str__(self):
        return Fore.GREEN + \
               'Server Version: ' + self.version + \
               '\nMinimum Required DksPlugin Version: ' + self.min_plugin_version + \
               Fore.RESET


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
    parser.add_argument('--hashed', dest='run_hashed', action='store_true')
    parser.add_argument('--no-hashed', dest='run_hashed', action='store_false')
    parser.set_defaults(run_ngrok=True, run_hashed=True)
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
 ''' + Version().get_version_v().rjust(29, ' ') + ''' |___/ Ter.DKS''')
    print(Style.RESET_ALL)


class FlaskServerApp(object):
    def __init__(self, flask_app: Flask):
        print('Checking for updates...')
        Version().check_updates(False)
        install_ngrok()
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

    def get_hashed(self):
        return self.args.run_hashed

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

        self.tunnel = ngrok.connect(self.get_port(), bind_tls=True)

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
        print(Fore.RED + 'This URL contains your IP. Share at your own risk.' + Fore.RESET)
        print()
        print('k=kill, r=refresh, w=ngrok path, d=donate')
        print('v=version, u=check updates, p=set password')

    def run(self):
        self.run_flask_thread()
        if self.should_run_ngrok():
            self.run_ngrok()
        self.run_gui()

    def kill(self):
        ngrok.kill()
        self.flask_thread.kill_receive = True
        sys.exit(0)

    def run_gui(self):
        try:
            Version().try_remove_old()
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
                elif key.lower() in ['p', '!p', 'pass', '!pass', 'password', '!password']:
                    pass1, pass2 = '', '0'
                    while pass1 != pass2:
                        while len(pass1) < 1:
                            pass1 = input('Type password: ')
                            if len(pass1) < 1:
                                print('Invalid Password')
                        pass2 = input('Confirm password: ')
                        if pass1 != pass2:
                            print('Wrong Confirmation Password')

                    with open(Version().working_dir + '\\passwd', 'w') as passwd:
                        passwd.write(hashlib.md5(pass1.encode('utf-8')).hexdigest())

        except KeyboardInterrupt:
            self.kill()

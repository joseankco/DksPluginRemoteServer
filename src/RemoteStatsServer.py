import time

from colorama import Fore
from flask import Flask, request, render_template
from flask_sock import Sock
import sys
import os
import json
from FlaskServerApp import FlaskServerApp
import logging

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

server_data: str = None

if getattr(sys, 'frozen', False):
    template_folder = os.path.join(sys._MEIPASS, 'templates')
    static_folder = os.path.join(sys._MEIPASS, 'static')
    app = Flask(__name__, template_folder=template_folder, static_folder=static_folder)
else:
    app = Flask(__name__)

sock = Sock(app)


def parse_post_data(data):
    global manager_api

    # INSTANCE, DOSID
    sesion = data.get('sesion')
    del data['sesion']

    return data


@app.route('/', methods=['POST'])
def result():
    global server_data
    response = parse_post_data(request.get_json())
    server_data = json.dumps(response, default=lambda x: x.__dict__)
    return '200'


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')


@sock.route('/stream')
def echo(ws):
    global server_data
    while True:
        if server_data is not None:
            ws.send(server_data)
            server_data = None
        time.sleep(1)


def main():
    server_app = FlaskServerApp(app)
    server_app.run()
    server_app.run_gui()


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        if 'The authtoken you specified does not look like a proper ngrok tunnel authtoken' in str(e):
            print(Fore.RED + 'An error occurred with your Auth Token. Try to reset it at '
                             'https://dashboard.ngrok.com/get-started/your-authtoken and reconfigure the plugin.' + Fore.RESET)
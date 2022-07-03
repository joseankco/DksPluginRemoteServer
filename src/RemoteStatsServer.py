from flask import Flask, request, render_template
from flask_sock import Sock
import sys
import os
import queue
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


@app.route('/', methods=['POST'])
def result():
    global server_data
    server_data = str(request.data.decode('utf-8'))
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


def main():
    server_app = FlaskServerApp(app)
    server_app.run()
    server_app.run_gui()


if __name__ == '__main__':
    try:
        main()
    except Exception:
        input("Exception.")


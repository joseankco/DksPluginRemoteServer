pyinstaller --onefile --icon="src/resources/icon.ico" --add-data "src/templates;templates" --add-data "src/static;static" src/RemoteStatsServer.py
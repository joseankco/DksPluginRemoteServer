pyinstaller --onefile --icon="src/resources/icon.ico" --add-data "src/templates;src/templates" --add-data "src/static;src/static" src/RemoteStatsServer.py
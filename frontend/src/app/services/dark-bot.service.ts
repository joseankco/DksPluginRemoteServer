import {Injectable, isDevMode} from '@angular/core';
import {ReplaySubject} from "rxjs";
import {ServerResponse} from "../models/main.model";
import {ServerStatus} from "../models/server-status.model";

@Injectable({
  providedIn: 'root'
})
export class DarkBotService {

  private websocket: WebSocket | undefined;
  private status: ServerStatus = ServerStatus.DISCONNECTED;
  private error: Event | undefined;
  private endpoint: string = 'stream';
  private data$: ReplaySubject<ServerResponse | ServerResponse[]> = new ReplaySubject<ServerResponse | ServerResponse[]>(1);
  private lastReceived: Date | undefined;
  private lastData: ServerResponse | ServerResponse[] = [];
  private id: string = '';
  private isGettingArray: boolean = true;

  constructor() {

  }

  public isSingle() {
    return !this.isGettingArray;
  }

  public isConnected() {
    return this.status === ServerStatus.CONNECTED;
  }

  public isConnecting() {
    return this.status === ServerStatus.CONNECTING;
  }

  public isDisconnecting() {
    return this.status === ServerStatus.DISCONNECTING;
  }

  public hasError() {
    return this.status === ServerStatus.ERRORED;
  }

  public getStatusMessage() {
    switch (this.status) {
      case ServerStatus.CONNECTED:
        return 'connected';
      case ServerStatus.DISCONNECTED:
        return 'disconnected';
      case ServerStatus.CONNECTING:
        return 'connecting...';
      case ServerStatus.DISCONNECTING:
        return 'disconnecting...';
      case ServerStatus.ERRORED:
        return 'error, try again, may fail several times';
    }
  }

  public getStatus() {
    return this.status;
  }

  public getLastReceived() {
    if (this.isConnected()) {
      return this.lastReceived?.toLocaleTimeString();
    }
    return null;
  }

  public getError() {
    if (this.hasError()) {
      return this.error;
    }
    return null;
  }

  public connect(id: string = '') {
    if (this.websocket) {
      return;
    }

    this.id = id;
    this.status = ServerStatus.CONNECTING;
    this.websocket = new WebSocket(this.getFullUrl(id));
    this.websocket.onclose = () => {
      if (!this.error) {
        console.log('Connection Closed');
        this.status = ServerStatus.DISCONNECTED;
      }
      this.websocket = undefined;
      this.id = '';
    }
    this.websocket.onerror = (e) => {
      console.log('Error', e);
      this.status = ServerStatus.ERRORED;
      this.error = e;
    }
    this.websocket.onopen = () => {
      console.log('Connection Succesfully');
      this.status = ServerStatus.CONNECTED;
      this.error = undefined;
      this.lastReceived = undefined;
    }
    this.websocket.onmessage = (m) => {
      this.lastData = JSON.parse(m.data);
      this.isGettingArray = Array.isArray(this.lastData);
      this.data$.next(this.lastData);
      if (this.isGettingArray) {
        this.lastReceived = new Date();
      } else {
        this.lastReceived = new Date((this.lastData as ServerResponse).tick);
      }
      this.error = undefined;
      //console.log('Data Received At ' + this.lastReceived.toLocaleTimeString())
      console.log(JSON.parse(m.data))
    }
  }

  public disconnect() {
    if (this.websocket) {
      this.status = ServerStatus.DISCONNECTING;
      this.websocket.close();
    }
  }

  public refresh(id: string = '') {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = undefined;
    }
    this.connect(id);
  }

  public getUrl() {
    if (!isDevMode()) {
      return window.location.origin
        .replace('http://', 'ws://')
        .replace('https://', 'wss://')
    } else {
      return 'ws://localhost:8085';
    }
  }

  public getEndpoint(id: string = '') {
    if (id === '') {
      return this.endpoint;
    } else {
      return this.endpoint + '?id=' + id;
    }
  }

  public getFullUrl(id: string = '') {
    return this.getUrl() + '/' + this.getEndpoint(id);
  }

  public getData() {
    return this.data$;
  }
}

import {Injectable, isDevMode} from '@angular/core';
import {firstValueFrom, map, ReplaySubject} from "rxjs";
import {ServerResponse} from "../models/main.model";
import {RankData} from "../models/rank-data.model";
import {HangarData} from "../models/hangar-data.model";
import WebSocketAsPromised from 'websocket-as-promised';
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class DarkBotService {

  private websocket: WebSocketAsPromised;
  private error: Event | undefined;
  private endpoint: string = 'stream';

  private data$: ReplaySubject<ServerResponse | ServerResponse[]> = new ReplaySubject<ServerResponse | ServerResponse[]>(1);
  private rankData$: ReplaySubject<RankData | undefined> = new ReplaySubject<RankData | undefined>(1);
  private hangarData$: ReplaySubject<HangarData | undefined> = new ReplaySubject<HangarData | undefined>(1);

  private lastReceived: Date | undefined;
  private lastData: ServerResponse | ServerResponse[] = [];

  private isGettingArray: boolean = true;

  constructor(private http: HttpClient) {
    this.websocket = new WebSocketAsPromised(this.getFullUrl());
    this.websocket.onClose.addListener(this.onclose.bind(this));
    this.websocket.onError.addListener(this.onerror.bind(this));
    this.websocket.onOpen.addListener(this.onopen.bind(this));
    this.websocket.onMessage.addListener(this.onmessage.bind(this));
  }

  public connect(id: string = '') {
    /*
    if (id) {
      return this.websocket.open().then(() => this.websocket.send('switch:' + id))
    }
    return this.websocket.open().then(() => this.websocket.send('multiple'))
    */
    return firstValueFrom(this.setAccount(id)).then((r) => {
      return this.websocket.open();
    });
  }

  public setAccount(id: string = '') {
    return this.http.post(this.getUrlBackend() + '/set-account', {id: id});
  }

  public disconnect() {
    console.log('Disconnect trigger')
    return this.websocket.close();
  }

  public switch(id: string = '') {
    if (this.isConnected()) {
      if (id) {
        this.trySendLastDataAsSingle(id);
        this.websocket.send('switch:' + id);
      } else {
        this.sendEmptyMultipleData();
        this.websocket.send('multiple');
      }
    }
  }

  public action(action: string) {
    if (this.isConnected()) {
      const finalaction = 'action:' + action;
      console.log('Sent action: ', finalaction)
      this.websocket.send(finalaction);
      return true;
    }
    return false;
  }

  private onopen() {
    console.log('Connection Succesfully');
    this.error = undefined;
    this.lastReceived = undefined;
  }

  private onclose() {
    if (!this.error) {
      console.log('Connection Closed');
    }
    this.hangarData$.next(undefined);
    this.rankData$.next(undefined);
  }

  private onerror(e: Event) {
    console.log('Error', e);
    this.error = e;
  }

  private onmessage(m: string) {
    this.lastData = JSON.parse(m);
    this.isGettingArray = Array.isArray(this.lastData);
    this.data$.next(this.lastData);

    if (this.isGettingArray) {
      this.lastReceived = new Date();
    } else {
      let data = (this.lastData as ServerResponse);
      if (data.rankData) {
        data.rankData.id = data.hero.id;
        this.rankData$.next(data.rankData);
      }
      if (data.hangarData) {
        data.hangarData.id = data.hero.id;
        this.hangarData$.next(data.hangarData)
      }
      this.lastReceived = new Date(data.tick);
    }
    this.error = undefined;
    console.log(JSON.parse(m))
  }

  private trySendLastDataAsSingle(id: string) {
    if (Array.isArray(this.lastData)) {
      const data = (this.lastData as ServerResponse[]).find(r => r.hero.id === id);
      if (data) {
        this.isGettingArray = false;
        this.lastData = data;
        this.data$.next(data);
        // this.rankData$.next(undefined);
        // this.hangarData$.next(undefined);
      }
    }
  }

  private sendEmptyMultipleData() {
    this.isGettingArray = true;
    this.data$.next([]);
  }

  public isSingle() {
    return !this.isGettingArray;
  }

  public isConnected() {
    return this.websocket.isOpened;
  }

  public isConnecting() {
    return this.websocket.isOpening;
  }

  public isDisconnecting() {
    return this.websocket.isClosing
  }

  public isDisconnected() {
    return this.websocket.isClosed;
  }

  public hasError() {
    return !!this.error;
  }

  public getStatusMessage() {
    if (this.isConnected()) {
      return 'connected';
    }
    if (this.hasError()) {
      return 'error, try again, may fail several times';
    }
    if (this.isDisconnected()) {
      return 'disconnected';
    }
    if (this.isConnecting()) {
      return 'connecting...';
    }
    if (this.isDisconnecting()) {
      return 'disconnecting...';
    }
    return 'unknown status';
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

  public getUrl() {
    if (!isDevMode()) {
      return window.location.origin
        .replace('http://', 'ws://')
        .replace('https://', 'wss://')
    } else {
      return 'ws://localhost:8085';
    }
  }

  public getUrlBackend() {
    if (!isDevMode()) {
      return window.location.origin;
    } else {
      return 'http://localhost:8085';
    }
  }

  public getEndpoint() {
      return this.endpoint;
  }

  public getFullUrl() {
    return this.getUrl() + '/' + this.getEndpoint();
  }

  public getData() {
    return this.data$;
  }

  public getRankData() {
    return this.rankData$;
  }

  public getHangarData() {
    return this.hangarData$;
  }
}

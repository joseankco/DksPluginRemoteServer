import {Component, OnDestroy, OnInit} from '@angular/core';
import {DarkBotService} from "../../services/dark-bot.service";
import {ServerStatus} from "../../models/server-status.model";
import {ServerResponse} from "../../models/main.model";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-server-status',
  templateUrl: './server-status.component.html',
  styleUrls: ['./server-status.component.css']
})
export class ServerStatusComponent implements OnInit, OnDestroy {

  subscriptions$: Subscription[] = [];
  id: string = '';

  constructor(
    public darkbot: DarkBotService,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const sub$ = this.activatedRoute.paramMap.subscribe(params => {
      const id = params.get('id');
      this.id = id ? id : '';
    })
    this.subscriptions$.push(sub$);
  }

  connect() {
    this.darkbot.connect(this.id);
  }

  disconnect() {
    this.darkbot.disconnect();
  }

  ngOnDestroy() {
    this.subscriptions$.forEach(s => s.unsubscribe());
  }

  isDisabled() {
    const status = this.darkbot.getStatus();
    return status === ServerStatus.CONNECTING || status === ServerStatus.DISCONNECTING;
  }

  getAsset() {
    const status = this.darkbot.getStatus();
    switch (status) {
      case ServerStatus.CONNECTED:
      case ServerStatus.DISCONNECTING:
        return 'assets/pause.png';
      case ServerStatus.DISCONNECTED:
      case ServerStatus.CONNECTING:
        return 'assets/play.png';
      case ServerStatus.ERRORED:
        return 'assets/reload.png';
    }
  }

  doAction() {
    const status = this.darkbot.getStatus();
    switch (status) {
      case ServerStatus.CONNECTED:
        this.darkbot.disconnect();
        break;
      case ServerStatus.DISCONNECTED:
        this.darkbot.connect(this.id);
        break;
      case ServerStatus.ERRORED:
        this.darkbot.refresh(this.id);
    }
  }
}

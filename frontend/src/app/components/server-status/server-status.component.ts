import {Component, OnDestroy, OnInit} from '@angular/core';
import {DarkBotService} from "../../services/dark-bot.service";
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
  start: number | undefined;
  runningTime: number = 0;

  constructor(
    public darkbot: DarkBotService,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const sub$ = this.activatedRoute.paramMap.subscribe(params => {
      const id = params.get('id');
      this.id = id ? id : '';
    })
    const sub2$ = this.darkbot.getData().subscribe(data => {
      if (Array.isArray(data)) {
        this.start = data[0]?.serverStartTime;
      } else {
        this.start = data?.serverStartTime;
      }
      if (this.start) {
        this.runningTime = new Date().getTime() - this.start;
      }
    })
    this.subscriptions$.push(sub$);
    this.subscriptions$.push(sub2$);
  }

  connect() {
    this.darkbot.connect(this.id).then();
  }

  disconnect() {
    this.darkbot.disconnect().then();
  }

  ngOnDestroy() {
    this.subscriptions$.forEach(s => s.unsubscribe());
  }

  isDisabled() {
    return this.darkbot.isConnecting() || this.darkbot.isDisconnecting();
  }

  getAsset() {
    if (this.darkbot.isConnected() || this.darkbot.isDisconnecting()) {
      return 'assets/pause.png';
    }
    if (this.darkbot.hasError()) {
      return 'assets/reload.png';
    }
    return 'assets/play.png';
  }

  doAction() {
    if (this.darkbot.isConnected()) {
      this.disconnect();
    } else {
      this.connect();
    }
  }
}

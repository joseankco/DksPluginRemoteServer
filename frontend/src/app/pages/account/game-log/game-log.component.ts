import {Component, OnDestroy, OnInit} from '@angular/core';
import {ServerResponse} from "../../../models/main.model";
import {Subscription} from "rxjs";
import {DarkBotService} from "../../../services/dark-bot.service";

@Component({
  selector: 'app-game-log',
  templateUrl: './game-log.component.html',
  styleUrls: ['./game-log.component.css']
})
export class GameLogComponent implements OnInit, OnDestroy {

  data!: ServerResponse;
  subscription$!: Subscription;

  constructor(
    public darkbot: DarkBotService
  ) { }

  ngOnInit(): void {
    this.subscription$ = this.darkbot.getData().subscribe(data => {
      if (this.darkbot.isSingle()) {
        this.data = data as ServerResponse;
      } else {
        this.darkbot.disconnect();
      }
    })
  }

  ngOnDestroy() {
    this.subscription$.unsubscribe();
  }

  getLogLines() {
    let ll = '';
    this.data.plugin.liveLogs.lastStdLogs.forEach(l => {
      ll += l + '\n';
    });
    return ll;
  }
}

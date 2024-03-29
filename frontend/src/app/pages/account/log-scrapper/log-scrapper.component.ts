import {Component, OnDestroy, OnInit} from '@angular/core';
import {ServerResponse} from "../../../models/main.model";
import {Subscription} from "rxjs";
import {DarkBotService} from "../../../services/dark-bot.service";

@Component({
  selector: 'app-log-scrapper',
  templateUrl: './log-scrapper.component.html',
  styleUrls: ['./log-scrapper.component.css']
})
export class LogScrapperComponent implements OnInit, OnDestroy {

  data!: ServerResponse;
  subscription$!: Subscription;

  constructor(
    public darkbot: DarkBotService
  ) { }

  ngOnInit(): void {
    this.subscription$ = this.darkbot.getData().subscribe(data => {
      if (this.darkbot.isSingle()) {
        this.data = data as ServerResponse;
      }
    })
  }

  ngOnDestroy() {
    this.subscription$.unsubscribe();
  }

}

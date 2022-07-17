import {Component, OnDestroy, OnInit} from '@angular/core';
import {ServerResponse} from "../../../models/main.model";
import {Subscription} from "rxjs";
import {DarkBotService} from "../../../services/dark-bot.service";

@Component({
  selector: 'app-palladium-stats',
  templateUrl: './palladium-stats.component.html',
  styleUrls: ['./palladium-stats.component.css']
})
export class PalladiumStatsComponent implements OnInit, OnDestroy {

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

}

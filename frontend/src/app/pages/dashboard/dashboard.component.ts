import {Component, OnDestroy, OnInit} from '@angular/core';
import {DarkBotService} from "../../services/dark-bot.service";
import {ServerResponse} from "../../models/main.model";
import {MinimapService} from "../../services/minimap.service";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  data: ServerResponse[] = [];
  subscription$!: Subscription;

  constructor(
    public darkbot: DarkBotService,
    private minimap: MinimapService
  ) { }

  ngOnInit(): void {
    this.subscription$ = this.darkbot.getData().subscribe(data => {
      if (!this.darkbot.isSingle()) {
        this.data = data as ServerResponse[];
      } else {
        // this.darkbot.disconnect();
      }
    });
  }

  ngOnDestroy() {
    this.subscription$.unsubscribe();
  }
}

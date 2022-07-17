import {Component, OnDestroy, OnInit} from '@angular/core';
import {DarkBotService} from "../../services/dark-bot.service";
import {ServerResponse} from "../../models/main.model";
import {ActivatedRoute} from "@angular/router";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {

  single: ServerResponse | undefined;
  multiple: ServerResponse[] | undefined;
  subscriptions$: Subscription[] = [];
  id: string = '';

  constructor(
    public darkbot: DarkBotService,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const datasub = this.darkbot.getData().subscribe(data => {
      if (this.darkbot.isSingle()) {
        this.multiple = undefined;
        this.single = data as ServerResponse;
      } else {
        this.single = undefined;
        this.multiple = data as ServerResponse[];
      }
    })
    this.subscriptions$.push(datasub);
  }

  ngOnDestroy() {
    this.subscriptions$.forEach(s => s.unsubscribe());
  }

}

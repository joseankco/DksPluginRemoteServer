import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {DarkBotService} from "../../../services/dark-bot.service";
import {RankService} from "../../../services/rank.service";
import {RankData} from "../../../models/rank-data.model";
import {HangarData, HangarItem} from "../../../models/hangar-data.model";
import {Subscription} from "rxjs";
import {UrlShipPipe} from "../../../pipes/url-ship.pipe";
import {UrlItemPipe} from "../../../pipes/url-item.pipe";

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatsComponent implements OnInit, OnDestroy {

  rankData!: RankData;
  hangarData!: HangarData;
  subscription$: Subscription[] = [];
  filter: string = '';
  id!: string;

  constructor(
    public darkbot: DarkBotService,
    public rankservice: RankService,
    private readonly cdRef: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    const sub = this.darkbot.getHangarData().subscribe(hangar => {
      if (hangar && (!this.hangarData || (hangar.diff.tick !== this.hangarData?.diff.tick))) {
        this.hangarData = hangar;
        this.cdRef.detectChanges();
      }
    })
    const sub2 = this.darkbot.getRankData().subscribe(rank => {
      if (rank && (!this.rankData || (rank.now.tick !== this.rankData?.now.tick))) {
        this.rankData = rank;
        this.cdRef.detectChanges();
      }
    })
    this.subscription$.push(sub);
    this.subscription$.push(sub2);
  }

  ngOnDestroy() {
    this.subscription$.map(s => s.unsubscribe());
  }

  getItemDiff(item: HangarItem) {
    return this.hangarData.diff.differences.find(d => d.lootDesc === item.loot_desc)?.diff;
  }

  checkIfPassFilter(name: string) {
    if (!this.filter) {
      return true;
    }
    return this.filter.split(' ').some(part => name.toLowerCase().includes(part.trim().toLowerCase()))
  }

  getOrderedItems(items: HangarItem[]) {
    return items.sort((a, b) => a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1);
  }

  defaultItem(event: ErrorEvent, loot_desc: string) {
    (event.target as HTMLImageElement).src = <string>new UrlItemPipe().transform(loot_desc, 30);
    event.target?.removeEventListener('error', null);
  }
}

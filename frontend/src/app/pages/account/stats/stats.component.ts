import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {DarkBotService} from "../../../services/dark-bot.service";
import {RankService} from "../../../services/rank.service";
import {RankData} from "../../../models/rank-data.model";
import {HangarData, HangarItem, HangarItemGroups} from "../../../models/hangar-data.model";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";

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
  mapToggles: Map<string, boolean> = new Map<string, boolean>();
  titles: string[] = ['resources', 'ore', 'laser ammo', 'rocket ammo', 'drone related', 'pet related'];
  filter: string = '';
  id!: string;

  constructor(
    public darkbot: DarkBotService,
    public rankservice: RankService,
    private readonly cdRef: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute
  ) {
    this.titles.forEach(title => {
      this.mapToggles.set(title, false);
    });
  }

  ngOnInit(): void {
    const sub3 = this.activatedRoute.paramMap.subscribe(params => {
      const id = params.get('id');
      this.id = id ? id : '';
    })
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
    this.subscription$.push(sub3);
  }

  ngOnDestroy() {
    this.subscription$.map(s => s.unsubscribe());
  }

  getItemDiff(item: HangarItem) {
    return this.hangarData.diff.differences.find(d => d.lootDesc === item.loot_desc)?.diff;
  }

  getValues(title: string) {
    return {
      toggle: this.mapToggles.get(title),
    };
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
}
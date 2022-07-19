import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {RankData} from "../../../models/rank-data.model";
import {HangarData} from "../../../models/hangar-data.model";
import {Subscription} from "rxjs";
import {DarkBotService} from "../../../services/dark-bot.service";
import {RankService} from "../../../services/rank.service";
import {parseModule, ShipModule, ShipModuleModifier, sortModules} from "../../../models/ship-module.model";
import {removeDuplicates, removeDuplicatesN, sortAlphabetically} from "../../../utils/utils";

@Component({
  selector: 'app-upgrade-modules',
  templateUrl: './upgrade-modules.component.html',
  styleUrls: ['./upgrade-modules.component.css']
})
export class UpgradeModulesComponent implements OnInit, OnDestroy {

  subscription$: Subscription[] = [];
  modules: ShipModule[] = [];

  modifiers: string[] = [];
  filterModifier: string = '';
  ships: string[] = [];
  filterShip: string = '';

  toggleDMG: boolean = true;
  toggleSHD: boolean = true;
  toggleHP: boolean = true;
  toggleSPC: boolean = true;

  dmgModules: ShipModule[] = [];
  dmgLootsId: number[] = [];
  shdModules: ShipModule[] = [];
  shdLootsId: number[] = [];
  hpModules: ShipModule[] = [];
  hpLootsId: number[] = [];
  spcModules: ShipModule[] = [];
  spcLootsId: number[] = [];

  mapTotalNew: Map<string, number[]> = new Map<string, number[]>();

  allLootsId: number[] = [];
  diffLootsId: { lootId: number; diff: number }[] = [];

  constructor(
    public darkbot: DarkBotService
  ) {
    this.mapTotalNew.set('DMG', [0, 0]);
    this.mapTotalNew.set('SHD', [0, 0]);
    this.mapTotalNew.set('HP',  [0, 0]);
    this.mapTotalNew.set('SPC', [0, 0]);
  }

  ngOnInit(): void {
    const sub = this.darkbot.getHangarData().subscribe(hangar => {
      if (hangar) {
        this.dmgLootsId = [];
        this.shdLootsId = [];
        this.hpLootsId = [];
        this.spcLootsId = [];

        this.modules = hangar.items.modules.map(m => parseModule(m));
        this.modules = sortModules(this.modules);
        this.modules.forEach(m => {
          this.allLootsId.push(m.lootId);
          if (m.name.startsWith('DMG')) {
            this.dmgLootsId.push(m.lootId);
          } else if (m.name.startsWith('SHD')) {
            this.shdLootsId.push(m.lootId);
          } else if (m.name.startsWith('HP')) {
            this.hpLootsId.push(m.lootId);
          } else if (m.name.startsWith('SPC')) {
            this.spcLootsId.push(m.lootId);
          }
          m.ships.forEach(sus => this.ships.push(sus.replace('ship_', '')));
          m.modifiers.forEach(sum => this.modifiers.push(sum.desc));
        });

        this.ships = sortAlphabetically(removeDuplicates(this.ships));
        this.modifiers = sortAlphabetically(removeDuplicates(this.modifiers));

        this.allLootsId = removeDuplicatesN(this.allLootsId);
        this.diffLootsId = hangar.diff.differences.filter(d => this.allLootsId.includes(d.lootId));

        this.dmgLootsId = removeDuplicatesN(this.dmgLootsId);
        this.shdLootsId = removeDuplicatesN(this.shdLootsId);
        this.hpLootsId = removeDuplicatesN(this.hpLootsId);
        this.spcLootsId = removeDuplicatesN(this.spcLootsId);

        this.dmgModules = this.getModulesType('DMG');
        this.shdModules = this.getModulesType('SHD');
        this.hpModules = this.getModulesType('HP');
        this.spcModules = this.getModulesType('SPC');

        this.fillDiff('DMG', this.dmgModules, this.dmgLootsId);
        this.fillDiff('SHD', this.shdModules, this.shdLootsId);
        this.fillDiff('HP', this.hpModules, this.hpLootsId);
        this.fillDiff('SPC', this.spcModules, this.spcLootsId);
      }
    })
    this.subscription$.push(sub);
  }

  fillDiff(key: string, modules: ShipModule[], loots: number[]) {
    let value = this.mapTotalNew.get(key)
    if (value) {
      value[0] = modules.length;
      let total = 0;
      loots.forEach(li => {
        const idx = this.diffLootsId.findIndex(i => i.lootId === li);
        if (idx !== -1) {
          total += this.diffLootsId[idx].diff;
        }
      });
      value[1] = total;
    }
  }

  ngOnDestroy() {
    this.subscription$.map(s => s.unsubscribe());
  }

  getModifiers(module: ShipModule, modifier: string) {

  }

  getShips(module: ShipModule) {
    let ships = '';
    module.ships.forEach(s => ships += s.replace('ship_', '') + ' ');
    return ships;
  }

  getModulesType(type: string) {
    const mods: ShipModule[] = [];
    this.modules.forEach(m => {
      if (m.name.startsWith(type)) {
        mods.push(m);
      }
    })
    return mods;
  }

  checkPassFilter(module: ShipModule) {
    if (!this.filterShip && !this.filterModifier) {
      return true;
    }
    return module.ships.some(s => this.filterShip === '' || s === this.filterShip)
      && module.modifiers.some(m => this.filterModifier === '' || (m.desc === this.filterModifier && m.value > 0));
  }

  getDiffValues(key: string) {
    return this.mapTotalNew.get(key);
  }
}

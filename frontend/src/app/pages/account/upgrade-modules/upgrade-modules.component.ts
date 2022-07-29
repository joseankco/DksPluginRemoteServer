import {Component, OnDestroy, OnInit} from '@angular/core';
import {HangarDifference, HangarModulesDiff} from "../../../models/hangar-data.model";
import {Subscription} from "rxjs";
import {DarkBotService} from "../../../services/dark-bot.service";
import {parseModule, ShipModule, sortModules} from "../../../models/ship-module.model";
import {removeDuplicates, sortAlphabetically} from "../../../utils/utils";
import {UrlShipPipe} from "../../../pipes/url-ship.pipe";

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
  toggleNews: boolean = false;

  dmgModules: ShipModule[] = [];
  dmgLootsDesc: string[] = [];
  shdModules: ShipModule[] = [];
  shdLootsDesc: string[] = [];
  hpModules: ShipModule[] = [];
  hpLootsDesc: string[] = [];
  spcModules: ShipModule[] = [];
  spcLootsDesc: string[] = [];

  mapTotalNew: Map<string, number[]> = new Map<string, number[]>();

  allLootsDesc: string[] = [];
  diffLootsDesc: HangarDifference[] = [];
  diffModules!: HangarModulesDiff;

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
        this.dmgLootsDesc = [];
        this.shdLootsDesc = [];
        this.hpLootsDesc = [];
        this.spcLootsDesc = [];

        this.modules = hangar.items.modules.map(m => parseModule(m));
        this.modules = sortModules(this.modules);
        this.modules.forEach(m => {
          this.allLootsDesc.push(m.lootDesc);
          if (m.name.startsWith('DMG')) {
            this.dmgLootsDesc.push(m.lootDesc);
          } else if (m.name.startsWith('SHD')) {
            this.shdLootsDesc.push(m.lootDesc);
          } else if (m.name.startsWith('HP')) {
            this.hpLootsDesc.push(m.lootDesc);
          } else if (m.name.startsWith('SPC')) {
            this.spcLootsDesc.push(m.lootDesc);
          }
          m.ships.forEach(sus => this.ships.push(sus.replace('ship_', '')));
          m.modifiers.forEach(sum => this.modifiers.push(sum.desc));
        });

        this.ships = sortAlphabetically(removeDuplicates(this.ships));
        this.modifiers = sortAlphabetically(removeDuplicates(this.modifiers));

        this.allLootsDesc = removeDuplicates(this.allLootsDesc);
        this.diffLootsDesc = hangar.diff.differences.filter(d => this.allLootsDesc.includes(d.lootDesc));

        this.dmgLootsDesc = removeDuplicates(this.dmgLootsDesc);
        this.shdLootsDesc = removeDuplicates(this.shdLootsDesc);
        this.hpLootsDesc = removeDuplicates(this.hpLootsDesc);
        this.spcLootsDesc = removeDuplicates(this.spcLootsDesc);

        this.dmgModules = this.getModulesType('DMG');
        this.shdModules = this.getModulesType('SHD');
        this.hpModules = this.getModulesType('HP');
        this.spcModules = this.getModulesType('SPC');

        this.fillDiff('DMG', this.dmgModules, this.dmgLootsDesc);
        this.fillDiff('SHD', this.shdModules, this.shdLootsDesc);
        this.fillDiff('HP', this.hpModules, this.hpLootsDesc);
        this.fillDiff('SPC', this.spcModules, this.spcLootsDesc);

        this.diffModules = hangar.diff.modules;
      }
    })
    this.subscription$.push(sub);
  }

  fillDiff(key: string, modules: ShipModule[], lootsDesc: string[]) {
    let value = this.mapTotalNew.get(key)
    if (value) {
      value[0] = modules.length;
      let total = 0;
      lootsDesc.forEach(li => {
        const idx = this.diffLootsDesc.findIndex(i => i.lootDesc === li);
        if (idx !== -1) {
          total += this.diffLootsDesc[idx].diff;
        }
      });
      value[1] = total;
    }
  }

  ngOnDestroy() {
    this.subscription$.map(s => s.unsubscribe());
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
    if (this.toggleNews && !this.isNewModule(module)) {
      return false;
    }
    if (!this.filterShip && !this.filterModifier) {
      return true;
    }
    return module.ships.some(s => this.filterShip === '' || s === this.filterShip)
      && module.modifiers.some(m => this.filterModifier === '' || (m.desc === this.filterModifier && m.value > 0));
  }

  getDiffValues(key: string) {
    return this.mapTotalNew.get(key);
  }

  isNewModule(module: ShipModule) {
    return this.diffModules && this.diffModules.diff.includes(module.id);
  }
}

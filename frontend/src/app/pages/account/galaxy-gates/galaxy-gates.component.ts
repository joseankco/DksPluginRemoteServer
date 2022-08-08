import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {DarkBotService} from "../../../services/dark-bot.service";
import {Subscription} from "rxjs";
import {
  GalaxyData,
  GalaxyGateBoost,
  GalaxyGateBoostItem,
  GalaxyGateInfo, GalaxyGateStats,
  GalaxyInfo, GateProbabilities
} from "../../../models/galaxy-data.model";
import {AuthService} from "../../../services/auth.service";
import {LoginResponse} from "../../../models/main.model";
import {GalaxyGatesService} from "../../../services/galaxy-gates.service";

@Component({
  selector: 'app-galaxy-gates',
  templateUrl: './galaxy-gates.component.html',
  styleUrls: ['./galaxy-gates.component.css']
})
export class GalaxyGatesComponent implements OnInit, OnDestroy {

  galaxyData!: GalaxyData;
  data!: GalaxyInfo;
  session: LoginResponse | undefined;
  subscription$: Subscription[] = [];
  detailed: GalaxyGateInfo | undefined;
  @ViewChild('modal', {static: true}) modal!: ElementRef<HTMLDivElement>;
  showDetailedLastSpins: boolean = true;
  stats!: GalaxyGateStats;

  constructor(
    public darkbot: DarkBotService,
    public auth: AuthService,
    public gg: GalaxyGatesService
  ) {
    this.resetStats();
  }

  ngOnInit(): void {
    this.modal.nativeElement.addEventListener('hidden.bs.modal', () => this.detailed = undefined);
    const sub = this.darkbot.getGalaxyData().subscribe(galaxy => {
      if (galaxy && (!this.galaxyData || (galaxy.now.tick !== this.galaxyData?.now.tick))) {
        this.galaxyData = galaxy;
        this.data = this.galaxyData.now;
        // this.processBoost(this.data.boosts)
        this.stats = this.galaxyData.stats;
      }
    })
    const sub2 = this.auth.getSession().subscribe(session => {
      this.session = session;
    });
    this.subscription$.push(sub);
    this.subscription$.push(sub2);
  }

  ngOnDestroy() {
    this.subscription$.map(s => s.unsubscribe());
  }

  getItemSrc(item: GalaxyGateBoostItem) {
    switch (item.type) {
      case 'battery':
      case 'rocket':
      case 'ore':
        return item.desc.toLowerCase();
      default:
        return item.type.toLowerCase();
    }
  }

  resetStats() {
    this.stats = {
      total: 0,
      battery: {
        spins: 0,
        items: {
          mcb25: {
            spins: 0,
            amount: 0
          },
          mcb50: {
            spins: 0,
            amount: 0
          },
          ucb100: {
            spins: 0,
            amount: 0
          },
          sab50: {
            spins: 0,
            amount: 0
          }
        }
      },
      rocket: {
        spins: 0,
        items: {
          plt2021: {
            spins: 0,
            amount: 0
          },
          acm01: {
            spins: 0,
            amount: 0
          }
        }
      },
      ore: {
        spins: 0,
        items: {
          xenomit: {
            spins: 0,
            amount: 0
          }
        }
      },
      part: {
        spins: 0,
        items: {
          part: {
            spins: 0,
            amount: 0
          },
          multiplier: {
            spins: 0,
            amount: 0
          }
        }
      },
      voucher: {
        spins: 0,
      },
      special: {
        spins: 0,
        items: {
          hitpoints: {
            spins: 0,
            amount: 0
          },
          nanohull: {
            spins: 0,
            amount: 0
          }
        }
      },
      logfile: {
        spins: 0,
      }
    }
  }

  processBoost(boosts: GalaxyGateBoost[]) {
    this.resetStats();
    for (const boost of boosts) {
      for (const item of boost.items) {
        this.stats.total += item.spins;
        switch (item.type) {
          case 'battery':
            this.stats.battery.spins += item.spins;
            switch (item.desc.toLowerCase().replace('-', '')) {
              case 'mcb25':
                this.stats.battery.items.mcb25.spins += item.spins;
                this.stats.battery.items.mcb25.amount += item.amount;
                break;
              case 'mcb50':
                this.stats.battery.items.mcb50.spins += item.spins;
                this.stats.battery.items.mcb50.amount += item.amount;
                break;
              case 'ucb100':
                this.stats.battery.items.ucb100.spins += item.spins;
                this.stats.battery.items.ucb100.amount += item.amount;
                break;
              case 'sab50':
                this.stats.battery.items.sab50.spins += item.spins;
                this.stats.battery.items.sab50.amount += item.amount;
                break;
            }
            break;
          case 'rocket':
            this.stats.rocket.spins += item.spins;
            switch (item.desc.toLowerCase().replace('-', '')) {
              case 'plt2021':
                this.stats.rocket.items.plt2021.spins += item.spins;
                this.stats.rocket.items.plt2021.amount += item.amount;
                break;
              case 'acm01':
                this.stats.rocket.items.acm01.spins += item.spins;
                this.stats.rocket.items.acm01.amount += item.amount;
                break;
            }
            break;
          case 'ore':
            this.stats.ore.spins += item.spins;
            switch (item.desc.toLowerCase().replace('-', '')) {
              case 'xenomit':
                this.stats.ore.items.xenomit.spins += item.spins;
                this.stats.ore.items.xenomit.amount += item.amount;
                break;
            }
            break;
          case 'logfile':
            this.stats.logfile.spins += item.spins;
            break;
          case 'voucher':
            this.stats.voucher.spins += item.spins;
            break;
          case 'special':
            this.stats.special.spins += item.spins;
            break;
          case 'nanohull':
            this.stats.special.spins += item.spins;
            this.stats.special.items.nanohull.spins += item.spins;
            this.stats.special.items.nanohull.amount += item.amount;
            break;
          case 'hitpoints':
            this.stats.special.spins += item.spins;
            this.stats.special.items.hitpoints.spins += item.spins;
            this.stats.special.items.hitpoints.amount += item.amount;
            break;
          case 'part':
            this.stats.part.spins += item.spins;
            this.stats.part.items.part.spins += item.spins;
            this.stats.part.items.part.amount += item.spins;
            break;
          case 'multiplier':
            this.stats.part.spins += item.spins;
            this.stats.part.items.multiplier.spins += item.spins;
            this.stats.part.items.multiplier.amount += item.spins;
            break;
        }
      }
    }
  }

  getStatsAttribute(key: string) {
    return this.stats[key as keyof GalaxyGateStats];
  }

  getProbability(probabilities: GateProbabilities[], prob: string) {
    return probabilities.find(p => p.id === prob);
  }

  getProbabilitiesOrder(probabilities: GateProbabilities[]) {
    return probabilities.filter(p => !p.id.startsWith('ammo_'))
      .sort((a, b) => a.percentage > b.percentage ? -1 : 1)
  }

  getProbabilitiesAmmo(probabilities: GateProbabilities[]) {
    return probabilities.filter(p => p.id.startsWith('ammo_'))
      .sort((a, b) => a.percentage > b.percentage ? -1 : 1) as GateProbabilities[];
  }

  getProbabilityAsset(prob: GateProbabilities) {
    if (prob.id.startsWith('ammo_')) {
      const ammo = prob.id.replace('ammo_', '');
      switch (ammo) {
        case 'x2':
          return 'mcb-25';
        case 'x3':
          return 'mcb-50';
        case 'x4':
          return 'ucb-100';
        case 'abs':
          return 'sab-50';
        case 'rocket':
          return 'plt-2021';
        case 'mine':
          return 'acm-01';
      }
      return 'ammo';
    } else if (prob.id === 'special') {
      return 'nanohull';
    } else if (prob.id === 'ammunition') {
      return 'ammo';
    } else if (prob.id === 'resource') {
      return 'xenomit';
    } else {
      return prob.id;
    }
  }

  checkIfProbIsAmmo(prob: GateProbabilities, probs: GateProbabilities[]) {
    if (prob.id === 'ammunition') {
      return {
        isAmmo: true,
        probs: this.getProbabilitiesAmmo(probs)
      }
    } else {
      return {
        isAmmo: false,
        probs: [] as GateProbabilities[]
      }
    }
  }
}

import {Component, OnInit} from '@angular/core';
import {ServerResponse} from "../../../models/main.model";
import {Subscription} from "rxjs";
import {DarkBotService} from "../../../services/dark-bot.service";
import {BotConfig} from "../../../models/bot-config.model";

@Component({
  selector: 'app-bot-session',
  templateUrl: './bot-session.component.html',
  styleUrls: ['./bot-session.component.css'],
})
export class BotSessionComponent implements OnInit {

  data!: ServerResponse;
  subscription$: Subscription[] = [];
  botConfig: BotConfig | undefined;
  currentModuleId: string | undefined;
  currentMapId: number | undefined;
  currentProfile: string | undefined;
  isChangingModule: boolean = false;
  isChangingMap: boolean = false;
  isChangingProfile: boolean = false;
  isFocusingModule: boolean = false;
  isFocusingMap: boolean = false;
  isFocusingProfile: boolean = false;

  constructor(
    public darkbot: DarkBotService
  ) { }

  ngOnInit(): void {
    const sub = this.darkbot.getData().subscribe(data => {
      if (this.darkbot.isSingle()) {
        this.data = data as ServerResponse;
        if (!this.botConfig || (!this.isFocusingProfile && !this.isFocusingModule && !this.isFocusingMap)) {
          this.botConfig = this.data.config;
        }
        if (this.currentModuleId) {
          const rcurrent = this.data.config.selectedModuleId;
          if (this.currentModuleId === rcurrent) {
            this.isChangingModule = false;
            this.currentModuleId = undefined;
          }
        }
        if (this.currentMapId) {
          const rcurrent = this.data.config.selectedMapId;
          if (this.currentMapId === rcurrent) {
            this.isChangingMap = false;
            this.currentMapId = undefined;
          }
        }
        if (this.currentProfile) {
          const rcurrent = this.data.config.selectedProfile;
          if (this.currentProfile === rcurrent) {
            this.isChangingProfile = false;
            this.currentProfile = undefined;
          }
        }
      }
    });
    this.subscription$.push(sub);
  }

  ngOnDestroy() {
    this.subscription$.map(s => s.unsubscribe());
  }

  getNpcList() {
    const npcmap = new Map();
    let bigger = 1;
    this.data.map.npcs.forEach((npc) => {
      const npcm = npcmap.get(npc.name);
      if (!npcm) {
        npcmap.set(npc.name, 1);
      } else {
        const n = npcm + 1;
        npcmap.set(npc.name, n)
        if (n > bigger) {
          bigger = n;
        }
      }
    });
    let np = '';
    npcmap.forEach((value, key) => {
      const biggerstr = bigger.toString();
      if (value > 1) {
        const valuestr = value.toString();
        np += valuestr.padStart(biggerstr.length, ' ') + 'x ' + key + '\n'
      } else {
        if (bigger > 1) {
          np += ''.padStart(biggerstr.length + 2, ' ') + key + '\n'
        } else {
          np += key + '\n'
        }
      }
    });
    return np;
  }

  getPlayerList() {
    let pl = '';
    this.data.map.players.forEach((p) => {
      pl += p.name + '\n';
    });
    return pl;
  }

  setNewModule() {
    if (this.darkbot.action('module:' + this.currentModuleId)) {
      this.isChangingModule = true;
    }
  }

  setNewMap() {
    if (this.darkbot.action('map:' + this.currentMapId)) {
      this.isChangingMap = true;
    }
  }

  setNewProfile() {
    if (this.darkbot.action('profile:' + this.currentProfile)) {
      this.isChangingProfile = true;
    }
  }

  resetBotStats() {
    this.darkbot.action('reset_bot_stats:none')
  }
}

import { Component, OnInit } from '@angular/core';
import {ServerResponse} from "../../../models/main.model";
import {Subscription} from "rxjs";
import {DarkBotService} from "../../../services/dark-bot.service";

@Component({
  selector: 'app-bot-session',
  templateUrl: './bot-session.component.html',
  styleUrls: ['./bot-session.component.css']
})
export class BotSessionComponent implements OnInit {

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
}

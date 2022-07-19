import {BotStats} from "./bot-stats.model";
import {Hero} from "./hero.model";
import {BotMap} from "./bot-map.model";
import {BotModule} from "./bot-module.model";
import {BotPlugin} from "./bot-plugin.model";
import {RankData} from "./rank-data.model";
import {HangarData} from "./hangar-data.model";

export interface ServerResponse {
  hero: Hero;
  map: BotMap;
  stats: BotStats;
  module: BotModule;
  plugin: BotPlugin;
  tick: number;
  hashed: boolean;
  rankData?: RankData;
  hangarData?: HangarData;
}

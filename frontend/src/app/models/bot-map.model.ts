export interface Portal {
  x: number;
  y: number;
}

export interface Npc {
  x: number;
  y: number;
  name: string;
}

export interface Player {
  x: number;
  y: number;
  name: string;
  isEnemy: boolean;
}

export interface BotMap {
  boundX: number;
  boundY: number;
  name: string;
  mapID: string;
  portals: Portal[];
  npcs: Npc[];
  players: Player[];
}

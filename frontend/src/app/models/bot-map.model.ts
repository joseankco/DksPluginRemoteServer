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

export interface Barrier {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface BotMap {
  id: number;
  boundX: number;
  boundY: number;
  name: string;
  mapID: string;
  portals: Portal[];
  npcs: Npc[];
  players: Player[];
  barriers: Barrier[];
}

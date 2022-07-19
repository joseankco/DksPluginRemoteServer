export interface HangarDataDiff {
  differences: {lootId: number, diff: number}[];
  tick: number;
}

export interface HangarItem {
  equipped_config: string;
  equipped_hangar: string;
  equipped_target: string;
  id: string;
  level: number;
  loot_desc: string;
  loot_id: number;
  name: string;
  properties: any; // TODO ?
  quantity: number;
  ship_upgrade_modifiers: string[];
  ship_upgrade_ships: string[];
}

export interface HangarItemGroups {
  ammo_laser: HangarItem[];
  ammo_rockets: HangarItem[];
  drones: HangarItem[];
  generators: HangarItem[];
  modules: HangarItem[];
  ore: HangarItem[];
  pet: HangarItem[];
  resources: HangarItem[];
  weapons: HangarItem[];
}

export interface HangarData {
  diff: HangarDataDiff;
  items: HangarItemGroups;
}

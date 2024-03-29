import {HangarItem} from "./hangar-data.model";

export interface ShipModuleModifier {
  desc: string;
  value: number;
}

export interface ShipModule {
  id: string;
  lootId: number;
  lootDesc: string;
  name: string;
  modifiers: ShipModuleModifier[];
  ships: string[];
  shipsIds: string[];
}

export function parseModule(item: HangarItem) {
  return {
    id: item.id,
    lootId: item.loot_id,
    lootDesc: item.loot_desc,
    name: item.name,
    modifiers: item.ship_upgrade_modifiers.map(sum => {
      const tuple = sum.split(',');
      return {
        desc: tuple[0],
        value: Number(tuple[1])
      } as ShipModuleModifier;
    }),
    ships: item.ship_upgrade_ships,
    shipsIds: !!item?.properties?.ships ? item.properties.ships.split(',') : []
  } as ShipModule;
}

export function sortModules(modules: ShipModule[]) {
  return modules.sort((a, b) => a.name > b.name ? 1 : -1);
}

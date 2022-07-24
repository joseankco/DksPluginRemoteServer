export interface ModuleOptions {
  name: string;
  value: string;
}

export interface MapOptions {
  name: string;
  value: number;
}

export interface BotConfig {
  mapOptions: MapOptions[];
  moduleOptions: ModuleOptions[];
  profileOptions: string[];
  selectedMapId: number;
  selectedModuleId: string;
  selectedProfile: string;
}

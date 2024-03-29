export interface Booster {
  amount: number;
  name: string;
  small: string;
  color: string;
  category: string;
  remainingTime: number;
}

export interface Target {
  isValid: boolean;
  isEnemy: boolean;
  x: number;
  y: number;
  name: string;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  hpPercent: number;
  shieldPercent: number;
}

export interface Destination {
  hasDestination: boolean;
  x: number;
  y: number;
}

export interface Pet {
  isEnabled: boolean;
  isActive: boolean;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  fuel: number;
  maxFuel: number;
  hpPercent: number;
  shieldPercent: number;
  fuelPercent: number;
}

export interface Hero {
  id: string;
  x: number;
  y: number;
  configuration: string;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  hull: number;
  maxHull: number;
  hpPercent: number;
  shieldPercent: number;
  hullPercent: number;
  username: string;
  target: Target;
  boosters: Booster[];
  destination: Destination;
  pet: Pet;
}

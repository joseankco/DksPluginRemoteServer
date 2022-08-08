export interface GalaxyDataDiff {
  eeDiff: number;
}

export interface GateBuilders {
  gate: string;
  current: number;
  total: number;
}

export interface GateProbabilities {
  id: string;
  percentage: number;
}

export interface GateMultipliers {
  value: number;
  state: number;
}

export interface Completable {
  current: number;
  total: number;
}

export interface GalaxyGateBonusGGReward {
  amount: number;
  claimed: boolean;
  countdown: number;
  lootId: string;
}

export interface GalaxyGateInfo {
  id: number;
  name: string;
  prepared: number;
  state: string;
  lives: number;
  lifePrice: number;
  builders: GateBuilders[];
  probabilities: GateProbabilities[];
  multipliers: GateMultipliers[];
  parts: Completable;
  waves: Completable;
  bonusGGReward: GalaxyGateBonusGGReward;
}

export interface GalaxyGateBoostItem {
  type: string;
  itemId: number;
  date: number;
  spins: number;
  amount: number;
  multiplierUsed: number;
  multiplierAmount: number;
  gateId: number;
  gateName: string;
  partId: number;
  duplicate: boolean;
  desc: string;
}

export interface GalaxyGateBoost {
  items: GalaxyGateBoostItem[];
}

export interface GalaxyInfo {
  mode: string;
  uri: number;
  ee: number;
  selectedSpinAmmount: number;
  eeCost: number;
  spinOnSale: boolean
  spinSalePercentage: number;
  galaxyGateDay: boolean
  bonusRewardsDay: boolean
  gates: GalaxyGateInfo[]
  tick: number;
  boosts: GalaxyGateBoost[];
}

export interface GalaxyData {
  id?: string;
  diff: GalaxyDataDiff;
  init: GalaxyInfo;
  now: GalaxyInfo;
  stats: GalaxyGateStats;
}

export interface GalaxyGateStats {
  total: number;
  battery: {
    spins: number;
    items: {
      mcb25: {
        spins: number,
        amount: number
      };
      mcb50: {
        spins: number,
        amount: number
      };
      ucb100: {
        spins: number,
        amount: number
      };
      sab50: {
        spins: number,
        amount: number
      };
    }
  },
  rocket: {
    spins: number;
    items: {
      plt2021: {
        spins: number,
        amount: number
      };
      acm01: {
        spins: number,
        amount: number
      };
    }
  },
  ore: {
    spins: number;
    items: {
      xenomit: {
        spins: number,
        amount: number
      };
    }
  },
  part: {
    spins: number;
    items: {
      part: {
        spins: number,
        amount: number
      };
      multiplier: {
        spins: number,
        amount: number
      };
    }
  },
  voucher: {
    spins: number;
  },
  special: {
    spins: number;
    items: {
      hitpoints: {
        spins: number,
        amount: number
      };
      nanohull: {
        spins: number,
        amount: number
      };
    }
  },
  logfile: {
    spins: number;
  }
}

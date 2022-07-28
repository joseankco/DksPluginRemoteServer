export interface RankDataDiff {
  upper: number;
  current: number;
  lower: number;
}

export interface RankInfo {
  points: number;
  name: string;
  img: string;
}

export interface RankValues {
  upper: RankInfo;
  current: RankInfo;
  lower: RankInfo;
  tick: number;
}

export interface RankData {
  id?: string;
  diff: RankDataDiff;
  init: RankValues;
  now: RankValues;
}

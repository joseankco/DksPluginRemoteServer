export interface GameLogViewer {
  lastStdLogs: string[];
}

export interface LogPattern {
  pattern: string;
  occurrences: string;
  occurrencesh: string;
  total: string;
  totalh: string;
}

export interface GameLogScrapper {
  patterns: LogPattern[];
}

export interface PalladiumStats {
  status: string;
  runningTime: string;
  total: string;
  totalh: string;
  eeh: string;
}

export interface BotPlugin {
  liveLogs: GameLogViewer;
  logScrapper: GameLogScrapper;
  palladiumStats: PalladiumStats;
}

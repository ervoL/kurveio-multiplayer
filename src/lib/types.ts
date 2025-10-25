export interface GameConfig {
  playerCount: number;
  speed: number;
  growthInterval: number;
  gapInterval: number;
}

export interface Player {
  id: number;
  x: number;
  y: number;
  angle: number;
  color: string;
  alive: boolean;
  trail: Point[];
  turnLeft: string;
  turnRight: string;
  nextGapTime: number;
  gapActive: boolean;
  gapEndTime: number;
}

export interface Point {
  x: number;
  y: number;
  isGap?: boolean;
}

export interface Keys {
  [key: string]: boolean;
}

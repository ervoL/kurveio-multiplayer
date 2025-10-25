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
  controlType: 'keyboard' | 'mouse' | 'touch';
  nextGapTime: number;
  gapActive: boolean;
  gapEndTime: number;
  touchLeftActive?: boolean;
  touchRightActive?: boolean;
}

export interface Point {
  x: number;
  y: number;
  isGap?: boolean;
}

export interface Keys {
  [key: string]: boolean;
}

export interface TouchControl {
  playerId: number;
  side: 'left' | 'right';
  x: number;
  y: number;
  radius: number;
  active: boolean;
}

export interface GameConfig {
  playerCount: number;
  speed: number;
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

// Network types for multiplayer
export type GameMode = 'local' | 'online';

export interface NetworkPlayer {
  peerId: string;
  playerName: string;
  ready: boolean;
  playerId?: number;
}

export interface GameState {
  players: Player[];
  timestamp: number;
}

export interface InputMessage {
  type: 'input';
  playerId: number;
  turnLeft: boolean;
  turnRight: boolean;
  timestamp: number;
}

export interface StateUpdateMessage {
  type: 'state';
  state: GameState;
}

export interface PlayerJoinMessage {
  type: 'player-join';
  playerName: string;
  peerId: string;
}

export interface PlayerReadyMessage {
  type: 'player-ready';
  peerId: string;
  ready: boolean;
}

export interface StartGameMessage {
  type: 'start-game';
  config: GameConfig;
  playerAssignments: { peerId: string; playerId: number }[];
}

export interface GameEndMessage {
  type: 'game-end';
  winnerId?: number;
}

export type NetworkMessage =
  | InputMessage
  | StateUpdateMessage
  | PlayerJoinMessage
  | PlayerReadyMessage
  | StartGameMessage
  | GameEndMessage;

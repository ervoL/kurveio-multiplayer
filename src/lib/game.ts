import type { Player } from './types';

export const PLAYER_COLORS = [
  'oklch(0.65 0.25 25)',
  'oklch(0.70 0.20 145)', 
  'oklch(0.65 0.20 240)',
];

export const PLAYER_CONTROLS = [
  { turnLeft: 'a', turnRight: 'd' },
  { turnLeft: 'j', turnRight: 'l' },
  { turnLeft: 'ArrowLeft', turnRight: 'ArrowRight' },
];

export const TURN_SPEED = 0.08;
export const TRAIL_WIDTH = 3;
export const GAP_LENGTH = 15;
export const SPAWN_PADDING = 100;

export function createPlayer(id: number, canvasWidth: number, canvasHeight: number): Player {
  const controls = PLAYER_CONTROLS[id];
  const spawnPositions = [
    { x: SPAWN_PADDING, y: canvasHeight / 2, angle: 0 },
    { x: canvasWidth - SPAWN_PADDING, y: canvasHeight / 2, angle: Math.PI },
    { x: canvasWidth / 2, y: SPAWN_PADDING, angle: Math.PI / 2 },
  ];
  
  const spawn = spawnPositions[id];
  
  return {
    id,
    x: spawn.x,
    y: spawn.y,
    angle: spawn.angle,
    color: PLAYER_COLORS[id],
    alive: true,
    trail: [],
    turnLeft: controls.turnLeft,
    turnRight: controls.turnRight,
    nextGapTime: 0,
    gapActive: false,
    gapEndTime: 0,
  };
}

export function checkCollision(
  x: number,
  y: number,
  players: Player[],
  currentPlayerId: number
): boolean {
  for (const player of players) {
    for (let i = 0; i < player.trail.length - 5; i++) {
      const point = player.trail[i];
      
      if (point.isGap) continue;
      
      if (player.id === currentPlayerId && i >= player.trail.length - 10) {
        continue;
      }
      
      const distance = Math.sqrt(
        Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2)
      );
      
      if (distance < TRAIL_WIDTH * 2) {
        return true;
      }
    }
  }
  
  return false;
}

export function wrapPosition(pos: number, max: number): number {
  if (pos < 0) return max;
  if (pos > max) return 0;
  return pos;
}

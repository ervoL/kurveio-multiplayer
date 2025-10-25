import type { Player } from './types';

export const PLAYER_COLORS = [
  'oklch(0.65 0.25 25)',
  'oklch(0.70 0.20 145)', 
  'oklch(0.65 0.20 240)',
  'oklch(0.75 0.18 70)',
];

export const PLAYER_CONTROLS = [
  { turnLeft: 'a', turnRight: 'd', controlType: 'keyboard' as const },
  { turnLeft: 'j', turnRight: 'l', controlType: 'keyboard' as const },
  { turnLeft: 'ArrowLeft', turnRight: 'ArrowRight', controlType: 'keyboard' as const },
  { turnLeft: 'mouse-left', turnRight: 'mouse-right', controlType: 'mouse' as const },
];

// Check if device has touch capability
export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Generate touch controls for mobile
export const getTouchControlsForPlayer = (playerId: number, canvasWidth: number, canvasHeight: number) => {
  const controlSize = 60;
  const padding = 40;
  const sideOffset = 80; // Distance from edge
  
  // Position controls based on where each player starts
  // Player 0: starts left side -> controls on left side (vertical center)
  // Player 1: starts right side -> controls on right side (vertical center)
  // Player 2: starts top -> controls on top (horizontal center)
  // Player 3: starts bottom -> controls on bottom (horizontal center)
  
  const positions = [
    // Player 1: starts from left, controls on left side vertically centered
    { 
      leftX: padding + controlSize, 
      leftY: canvasHeight / 2 - controlSize - 20, 
      rightX: padding + controlSize, 
      rightY: canvasHeight / 2 + controlSize + 20 
    },
    // Player 2: starts from right, controls on right side vertically centered
    { 
      leftX: canvasWidth - padding - controlSize, 
      leftY: canvasHeight / 2 - controlSize - 20, 
      rightX: canvasWidth - padding - controlSize, 
      rightY: canvasHeight / 2 + controlSize + 20 
    },
    // Player 3: starts from top, controls on top horizontally centered
    { 
      leftX: canvasWidth / 2 - controlSize * 2 - 20, 
      leftY: padding + controlSize, 
      rightX: canvasWidth / 2 + controlSize * 2 + 20, 
      rightY: padding + controlSize 
    },
    // Player 4: starts from bottom, controls on bottom horizontally centered
    { 
      leftX: canvasWidth / 2 - controlSize * 2 - 20, 
      leftY: canvasHeight - padding - controlSize, 
      rightX: canvasWidth / 2 + controlSize * 2 + 20, 
      rightY: canvasHeight - padding - controlSize 
    },
  ];
  
  return positions[playerId] || positions[0];
};

export const TURN_SPEED = 0.08;
export const TRAIL_WIDTH = 3;
export const GAP_LENGTH = 15;
export const SPAWN_PADDING = 100;

export function createPlayer(id: number, canvasWidth: number, canvasHeight: number): Player {
  const isMobile = isTouchDevice();
  const controls = PLAYER_CONTROLS[id];
  const spawnPositions = [
    { x: SPAWN_PADDING, y: canvasHeight / 2, angle: 0 },
    { x: canvasWidth - SPAWN_PADDING, y: canvasHeight / 2, angle: Math.PI },
    { x: canvasWidth / 2, y: SPAWN_PADDING, angle: Math.PI / 2 },
    { x: canvasWidth / 2, y: canvasHeight - SPAWN_PADDING, angle: -Math.PI / 2 },
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
    controlType: isMobile ? 'touch' : controls.controlType,
    nextGapTime: 0,
    gapActive: false,
    gapEndTime: 0,
    touchLeftActive: false,
    touchRightActive: false,
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

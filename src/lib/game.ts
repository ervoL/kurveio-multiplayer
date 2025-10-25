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
    // Player 3: starts from top moving down, controls on top horizontally centered
    // When moving down, left turn goes to the right side of screen, so swap positions
    { 
      leftX: canvasWidth / 2 + controlSize * 2 + 20,  // Swapped: left control on right side
      leftY: padding + controlSize, 
      rightX: canvasWidth / 2 - controlSize * 2 - 20,  // Swapped: right control on left side
      rightY: padding + controlSize 
    },
    // Player 4: starts from bottom moving up, controls on bottom horizontally centered
    // When moving up, left turn goes to the left side of screen, so normal order
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
  const maxSegmentLength = 20; // Maximum valid segment length (to detect wraps)
  
  for (const player of players) {
    // Check all trail points except the very recent ones of the current player
    const skipCount = player.id === currentPlayerId ? 15 : 5;
    
    for (let i = 0; i < player.trail.length - skipCount; i++) {
      const point = player.trail[i];
      
      // Skip gap points
      if (point.isGap) continue;
      
      // Calculate distance from current position to trail point
      const distance = Math.sqrt(
        Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2)
      );
      
      // Collision if within trail width
      if (distance < TRAIL_WIDTH * 2) {
        return true;
      }
      
      // Also check line segment collision for consecutive points
      if (i > 0 && !player.trail[i - 1].isGap) {
        const prevPoint = player.trail[i - 1];
        
        // Calculate segment length to detect screen wraps
        const segmentLength = Math.sqrt(
          Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)
        );
        
        // Skip this segment if it's too long (indicates a screen wrap)
        if (segmentLength > maxSegmentLength) {
          continue;
        }
        
        const segmentDist = pointToLineDistance(x, y, prevPoint.x, prevPoint.y, point.x, point.y);
        
        if (segmentDist < TRAIL_WIDTH * 2) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// Helper function to calculate distance from a point to a line segment
function pointToLineDistance(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) {
    return Math.sqrt(A * A + B * B);
  }
  
  const param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;
  
  return Math.sqrt(dx * dx + dy * dy);
}

export function wrapPosition(pos: number, max: number): number {
  if (pos < 0) return max;
  if (pos > max) return 0;
  return pos;
}

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { GameConfig, Player, Keys, TouchControl } from '@/lib/types';
import {
  createPlayer,
  checkCollision,
  wrapPosition,
  TURN_SPEED,
  TRAIL_WIDTH,
  GAP_LENGTH,
  getTouchControlsForPlayer,
  isTouchDevice,
} from '@/lib/game';

interface GameCanvasProps {
  config: GameConfig;
  onGameEnd: (winnerId?: number) => void;
}

export function GameCanvas({ config, onGameEnd }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playersRef = useRef<Player[]>([]);
  const keysRef = useRef<Keys>({});
  const mouseButtonsRef = useRef({ left: false, right: false });
  const animationRef = useRef<number>(0);
  const lastGrowthRef = useRef<number>(0);
  const [showRestart, setShowRestart] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const gameLoopRef = useRef<(() => void) | null>(null);
  const touchControlsRef = useRef<TouchControl[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  const startNewGame = () => {
    setShowRestart(false);
    setWinner(null);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    playersRef.current = Array.from({ length: config.playerCount }, (_, i) =>
      createPlayer(i, canvas.width, canvas.height)
    );

    // Reinitialize touch controls
    if (isMobile) {
      const controlSize = 60;
      touchControlsRef.current = [];
      
      for (let i = 0; i < config.playerCount; i++) {
        const positions = getTouchControlsForPlayer(i, canvas.width, canvas.height);
        
        touchControlsRef.current.push({
          playerId: i,
          side: 'left',
          x: positions.leftX,
          y: positions.leftY,
          radius: controlSize / 2,
          active: false,
        });
        
        touchControlsRef.current.push({
          playerId: i,
          side: 'right',
          x: positions.rightX,
          y: positions.rightY,
          radius: controlSize / 2,
          active: false,
        });
      }
    }

    const now = Date.now();
    playersRef.current.forEach((player) => {
      player.nextGapTime = now + Math.random() * config.gapInterval;
    });

    lastGrowthRef.current = now;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (gameLoopRef.current) {
      animationRef.current = requestAnimationFrame(gameLoopRef.current);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const touchEnabled = isTouchDevice();
    setIsMobile(touchEnabled);

    playersRef.current = Array.from({ length: config.playerCount }, (_, i) =>
      createPlayer(i, canvas.width, canvas.height)
    );

    // Initialize touch controls for mobile
    if (touchEnabled) {
      const controlSize = 60;
      touchControlsRef.current = [];
      
      for (let i = 0; i < config.playerCount; i++) {
        const positions = getTouchControlsForPlayer(i, canvas.width, canvas.height);
        
        touchControlsRef.current.push({
          playerId: i,
          side: 'left',
          x: positions.leftX,
          y: positions.leftY,
          radius: controlSize / 2,
          active: false,
        });
        
        touchControlsRef.current.push({
          playerId: i,
          side: 'right',
          x: positions.rightX,
          y: positions.rightY,
          radius: controlSize / 2,
          active: false,
        });
      }
    }

    const now = Date.now();
    playersRef.current.forEach((player) => {
      player.nextGapTime = now + Math.random() * config.gapInterval;
    });

    lastGrowthRef.current = now;

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      if (e.button === 0) {
        mouseButtonsRef.current.left = true;
      } else if (e.button === 2) {
        mouseButtonsRef.current.right = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      if (e.button === 0) {
        mouseButtonsRef.current.left = false;
      } else if (e.button === 2) {
        mouseButtonsRef.current.right = false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      Array.from(e.touches).forEach((touch) => {
        const touchX = touch.clientX;
        const touchY = touch.clientY;
        
        touchControlsRef.current.forEach((control) => {
          const distance = Math.sqrt(
            Math.pow(touchX - control.x, 2) + Math.pow(touchY - control.y, 2)
          );
          
          if (distance <= control.radius * 1.5) {
            control.active = true;
            const player = playersRef.current[control.playerId];
            if (player) {
              if (control.side === 'left') {
                player.touchLeftActive = true;
              } else {
                player.touchRightActive = true;
              }
            }
          }
        });
      });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      touchControlsRef.current.forEach((control) => {
        control.active = false;
        const player = playersRef.current[control.playerId];
        if (player) {
          if (control.side === 'left') {
            player.touchLeftActive = false;
          } else {
            player.touchRightActive = false;
          }
        }
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', handleContextMenu);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    const gameLoop = () => {
      if (!canvas || !ctx) return;

      const now = Date.now();
      const alivePlayers = playersRef.current.filter((p) => p.alive);

      if (alivePlayers.length <= 1) {
        if (alivePlayers.length === 1) {
          const winnerPlayer = alivePlayers[0];
          setWinner(winnerPlayer.id);
          onGameEnd(winnerPlayer.id);
          toast(`Player ${winnerPlayer.id + 1} Wins! 🏆`, {
            description: 'Congratulations on your victory!',
            duration: 5000,
          });
        }
        setShowRestart(true);
        return;
      }

      playersRef.current.forEach((player) => {
        if (!player.alive) return;

        if (player.controlType === 'keyboard') {
          if (keysRef.current[player.turnLeft]) {
            player.angle -= TURN_SPEED;
          }
          if (keysRef.current[player.turnRight]) {
            player.angle += TURN_SPEED;
          }
        } else if (player.controlType === 'mouse') {
          if (mouseButtonsRef.current.left) {
            player.angle -= TURN_SPEED;
          }
          if (mouseButtonsRef.current.right) {
            player.angle += TURN_SPEED;
          }
        } else if (player.controlType === 'touch') {
          if (player.touchLeftActive) {
            player.angle -= TURN_SPEED;
          }
          if (player.touchRightActive) {
            player.angle += TURN_SPEED;
          }
        }

        player.x += Math.cos(player.angle) * config.speed;
        player.y += Math.sin(player.angle) * config.speed;

        player.x = wrapPosition(player.x, canvas.width);
        player.y = wrapPosition(player.y, canvas.height);

        if (now >= player.nextGapTime && !player.gapActive) {
          player.gapActive = true;
          player.gapEndTime = now + GAP_LENGTH * (1000 / 60);
          player.nextGapTime = now + config.gapInterval + Math.random() * config.gapInterval;
        }

        if (player.gapActive && now >= player.gapEndTime) {
          player.gapActive = false;
        }

        // Always add trail point (even for collision check before dying)
        player.trail.push({
          x: player.x,
          y: player.y,
          isGap: player.gapActive,
        });

        // Check collision after adding the trail point
        if (!player.gapActive) {
          if (checkCollision(player.x, player.y, playersRef.current, player.id)) {
            player.alive = false;
            // Add one final trail point to ensure no gap where the snake died
            player.trail.push({
              x: player.x,
              y: player.y,
              isGap: false,
            });
          }
        }
      });

      ctx.fillStyle = 'oklch(0.10 0.05 250)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      playersRef.current.forEach((player) => {
        ctx.strokeStyle = player.color;
        ctx.lineWidth = TRAIL_WIDTH;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        let drawing = false;

        for (let i = 0; i < player.trail.length; i++) {
          const point = player.trail[i];

          if (point.isGap) {
            if (drawing) {
              ctx.stroke();
              drawing = false;
            }
            continue;
          }

          if (i > 0) {
            const prevPoint = player.trail[i - 1];
            const dx = Math.abs(point.x - prevPoint.x);
            const dy = Math.abs(point.y - prevPoint.y);
            const maxJump = config.speed * 2;

            if (dx > maxJump || dy > maxJump) {
              if (drawing) {
                ctx.stroke();
                drawing = false;
              }
            }
          }

          if (!drawing) {
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            drawing = true;
          } else {
            ctx.lineTo(point.x, point.y);
          }
        }

        if (drawing) {
          ctx.stroke();
        }

        if (player.alive) {
          ctx.fillStyle = player.color;
          ctx.beginPath();
          ctx.arc(player.x, player.y, TRAIL_WIDTH * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw touch controls for mobile
      if (touchEnabled) {
        touchControlsRef.current.forEach((control) => {
          const player = playersRef.current[control.playerId];
          if (!player) return;

          // Draw semi-transparent control circle with fill
          ctx.globalAlpha = control.active ? 0.4 : 0.2; // 40% when active, 20% when inactive
          ctx.fillStyle = player.color;
          ctx.beginPath();
          ctx.arc(control.x, control.y, control.radius, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw border with slightly higher opacity
          ctx.globalAlpha = 0.5; // 50% opacity for border
          ctx.strokeStyle = player.color;
          ctx.lineWidth = 3;
          ctx.stroke();
          
          // Reset alpha
          ctx.globalAlpha = 1.0;
        });
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = gameLoop;
    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
      canvas.removeEventListener('touchmove', handleTouchMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [config]);

  return (
    <>
      <canvas ref={canvasRef} className="block" />
      {showRestart && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto">
            <Button
              onClick={startNewGame}
              size="lg"
              className="text-lg h-14 px-8"
            >
              Play Again
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

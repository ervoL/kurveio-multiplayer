import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { GameConfig, Player, Keys } from '@/lib/types';
import {
  createPlayer,
  checkCollision,
  wrapPosition,
  TURN_SPEED,
  TRAIL_WIDTH,
  GAP_LENGTH,
} from '@/lib/game';

interface GameCanvasProps {
  config: GameConfig;
  onGameEnd: (winnerId?: number) => void;
}

export function GameCanvas({ config, onGameEnd }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playersRef = useRef<Player[]>([]);
  const keysRef = useRef<Keys>({});
  const animationRef = useRef<number>(0);
  const lastGrowthRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    playersRef.current = Array.from({ length: config.playerCount }, (_, i) =>
      createPlayer(i, canvas.width, canvas.height)
    );

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

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const gameLoop = () => {
      if (!canvas || !ctx) return;

      const now = Date.now();
      const alivePlayers = playersRef.current.filter((p) => p.alive);

      if (alivePlayers.length <= 1) {
        if (alivePlayers.length === 1) {
          const winner = alivePlayers[0];
          toast(`Player ${winner.id + 1} Wins! 🏆`, {
            description: 'Congratulations on your victory!',
            duration: 5000,
          });
          setTimeout(() => onGameEnd(winner.id), 2000);
        } else {
          setTimeout(() => onGameEnd(), 2000);
        }
        return;
      }

      playersRef.current.forEach((player) => {
        if (!player.alive) return;

        if (keysRef.current[player.turnLeft]) {
          player.angle -= TURN_SPEED;
        }
        if (keysRef.current[player.turnRight]) {
          player.angle += TURN_SPEED;
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

        player.trail.push({
          x: player.x,
          y: player.y,
          isGap: player.gapActive,
        });

        if (!player.gapActive) {
          if (checkCollision(player.x, player.y, playersRef.current, player.id)) {
            player.alive = false;
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

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [config, onGameEnd]);

  return <canvas ref={canvasRef} className="block" />;
}

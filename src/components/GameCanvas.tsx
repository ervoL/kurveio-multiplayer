import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { GameConfig, Player, Keys, TouchControl, GameMode, GameState } from '@/lib/types';
import type { NetworkManager } from '@/lib/network';
import {
  createPlayer,
  checkCollision,
  wrapPosition,
  TURN_SPEED,
  TRAIL_WIDTH,
  GAP_LENGTH,
  SPAWN_PADDING,
  getTouchControlsForPlayer,
  isTouchDevice,
} from '@/lib/game';
import { AudioManager } from '@/lib/audio';

interface GameCanvasProps {
  config: GameConfig;
  onGameEnd: (winnerId?: number) => void;
  onBackToMenu: () => void;
  onBackToLobby?: () => void;
  networkManager?: NetworkManager | null;
  isHost?: boolean;
  gameMode: GameMode;
  myPlayerId?: number;
}

export function GameCanvas({ config, onGameEnd, onBackToMenu, onBackToLobby, networkManager, isHost, gameMode, myPlayerId = 0 }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playersRef = useRef<Player[]>([]);
  const keysRef = useRef<Keys>({});
  const mouseButtonsRef = useRef({ left: false, right: false });
  const animationRef = useRef<number>(0);
  const [showRestart, setShowRestart] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const gameLoopRef = useRef<(() => void) | null>(null);
  const touchControlsRef = useRef<TouchControl[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const audioManagerRef = useRef<AudioManager | null>(null);
  const myPlayerIdRef = useRef<number>(0);
  const lastStateUpdateRef = useRef<number>(0);
  const inputBufferRef = useRef({ turnLeft: false, turnRight: false });
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Store client input states for continuous application on host
  const clientInputsRef = useRef<Map<number, { turnLeft: boolean; turnRight: boolean }>>(new Map());
  
  // Fixed game world size for online multiplayer (independent of screen size)
  const gameWorldRef = useRef({ width: 1920, height: 1080 });

  const startCountdown = (sendMessage: boolean = true) => {
    setCountdown(5);
    setShowRestart(true);
    
    // Only host sends network messages, and only if sendMessage is true
    const shouldSendMessages = gameMode === 'online' && isHost && networkManager && sendMessage;
    
    // If online mode and host, send countdown start to clients
    if (shouldSendMessages) {
      // Use setTimeout to ensure game-end message is processed first
      setTimeout(() => {
        networkManager!.send({
          type: 'start-countdown',
        });
      }, 50);
    }

    let timeLeft = 5;
    countdownTimerRef.current = setInterval(() => {
      timeLeft--;
      setCountdown(timeLeft);
      
      if (timeLeft <= 0) {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        
        // If online mode and host, send restart to clients
        if (shouldSendMessages) {
          networkManager!.send({
            type: 'restart-game',
          });
        }
        
        startNewGame();
      }
    }, 1000);
  };

  const startNewGame = () => {
    // Reset countdown and restart states
    setCountdown(null);
    setShowRestart(false);
    setWinner(null);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // For online mode, use fixed game world size; for local mode, use canvas size
    const worldWidth = gameMode === 'online' ? gameWorldRef.current.width : canvas.width;
    const worldHeight = gameMode === 'online' ? gameWorldRef.current.height : canvas.height;

    playersRef.current = Array.from({ length: config.playerCount }, (_, i) =>
      createPlayer(i, worldWidth, worldHeight)
    );

    // Reinitialize touch controls (always use canvas size for UI elements)
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

    // Initialize audio manager
    if (!audioManagerRef.current) {
      audioManagerRef.current = new AudioManager();
    }

    // For online mode, use fixed game world size; for local mode, use canvas size
    const worldWidth = gameMode === 'online' ? gameWorldRef.current.width : canvas.width;
    const worldHeight = gameMode === 'online' ? gameWorldRef.current.height : canvas.height;

    playersRef.current = Array.from({ length: config.playerCount }, (_, i) =>
      createPlayer(i, worldWidth, worldHeight)
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

    // Set up network handlers for online mode
    if (gameMode === 'online' && networkManager) {
      if (isHost) {
        // HOST: Handle input from clients
        networkManager.on('input', (data, peerId) => {
          const inputData = data as { playerId: number; turnLeft: boolean; turnRight: boolean };
          // Store the client's input state for continuous application
          clientInputsRef.current.set(inputData.playerId, {
            turnLeft: inputData.turnLeft,
            turnRight: inputData.turnRight,
          });
        });
      } else {
        // CLIENT: Set my player ID from props
        myPlayerIdRef.current = myPlayerId;
        
        // Handle state updates from host
        networkManager.on('state', (data) => {
          const stateData = data as { state: GameState };
          playersRef.current = stateData.state.players;
        });

        // Handle game end from host
        networkManager.on('game-end', (data) => {
          const endData = data as { winnerId?: number };
          if (endData.winnerId !== undefined) {
            const winnerPlayer = playersRef.current.find((p) => p.id === endData.winnerId);
            if (winnerPlayer) {
              setWinner(winnerPlayer.id);
              onGameEnd(winnerPlayer.id);
              toast(`Player ${winnerPlayer.id + 1} Wins! 🏆`, {
                description: 'Next game starts in 5 seconds...',
                duration: 5000,
              });
            }
          }
          // Don't start countdown here - wait for start-countdown message
          setShowRestart(true);
        });

        // Handle restart game from host
        networkManager.on('restart-game', () => {
          console.log('Client: Received restart-game message from host');
          startNewGame();
        });

        // Handle countdown start from host
        networkManager.on('start-countdown', () => {
          console.log('Client: Received start-countdown message from host');
          startCountdown(false); // Don't send message on client
        });

        // Handle back to lobby from host
        networkManager.on('back-to-lobby', () => {
          console.log('Client: Received back-to-lobby message from host');
          if (onBackToLobby) {
            onBackToLobby();
          }
        });
      }
    }

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

      // Online mode: Different behavior for host vs client
      if (gameMode === 'online' && networkManager) {
        if (isHost) {
          // HOST: Run full game simulation
          const alivePlayers = playersRef.current.filter((p) => p.alive);

          // Check game end condition
          if (config.playerCount > 1 && alivePlayers.length <= 1) {
            audioManagerRef.current?.stopHeartbeat();
            
            if (alivePlayers.length === 1) {
              const winnerPlayer = alivePlayers[0];
              setWinner(winnerPlayer.id);
              onGameEnd(winnerPlayer.id);
              
              // Notify all clients
              networkManager.send({
                type: 'game-end',
                winnerId: winnerPlayer.id,
              });
              
              toast(`Player ${winnerPlayer.id + 1} Wins! 🏆`, {
                description: 'Next game starts in 5 seconds...',
                duration: 5000,
              });
            }
            startCountdown();
            return;
          }

          // Update all players (host simulates all)
          playersRef.current.forEach((player) => {
            if (!player.alive) return;

            // Apply controls for each player
            // For clients, check stored input state; for host, check local inputs
            if (player.id === myPlayerIdRef.current) {
              // Host's own player - use local inputs
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
            } else {
              // Client player - use stored input state
              const clientInput = clientInputsRef.current.get(player.id);
              if (clientInput) {
                if (clientInput.turnLeft && !clientInput.turnRight) {
                  player.angle -= TURN_SPEED;
                } else if (clientInput.turnRight && !clientInput.turnLeft) {
                  player.angle += TURN_SPEED;
                }
              }
            }

            // Update position
            player.x += Math.cos(player.angle) * config.speed;
            player.y += Math.sin(player.angle) * config.speed;
            player.x = wrapPosition(player.x, gameWorldRef.current.width);
            player.y = wrapPosition(player.y, gameWorldRef.current.height);

            // Handle gaps
            if (now >= player.nextGapTime && !player.gapActive) {
              player.gapActive = true;
              player.gapEndTime = now + GAP_LENGTH * (1000 / 60);
              player.nextGapTime = now + config.gapInterval + Math.random() * config.gapInterval;
            }

            if (player.gapActive && now >= player.gapEndTime) {
              player.gapActive = false;
            }

            // Add trail point
            player.trail.push({
              x: player.x,
              y: player.y,
              isGap: player.gapActive,
            });

            // Check collision
            if (!player.gapActive) {
              if (checkCollision(player.x, player.y, playersRef.current, player.id)) {
                audioManagerRef.current?.playCrash();
                player.alive = false;
                player.trail.push({
                  x: player.x,
                  y: player.y,
                  isGap: false,
                });
              }
            }
          });

          // Broadcast state to clients (throttled to ~30 updates/sec)
          if (now - lastStateUpdateRef.current > 33) {
            lastStateUpdateRef.current = now;
            const gameState: GameState = {
              players: playersRef.current,
              timestamp: now,
            };
            networkManager.send({
              type: 'state',
              state: gameState,
            });
          }
        } else {
          // CLIENT: Send inputs to host, render received state
          const myPlayer = playersRef.current[myPlayerIdRef.current];
          if (myPlayer && myPlayer.alive) {
            let turnLeft = false;
            let turnRight = false;

            // Check my controls
            if (myPlayer.controlType === 'keyboard') {
              turnLeft = keysRef.current[myPlayer.turnLeft] || false;
              turnRight = keysRef.current[myPlayer.turnRight] || false;
            } else if (myPlayer.controlType === 'mouse') {
              turnLeft = mouseButtonsRef.current.left;
              turnRight = mouseButtonsRef.current.right;
            } else if (myPlayer.controlType === 'touch') {
              turnLeft = myPlayer.touchLeftActive || false;
              turnRight = myPlayer.touchRightActive || false;
            }

            // Send input every frame to ensure host has current state
            networkManager.send({
              type: 'input',
              playerId: myPlayerIdRef.current,
              turnLeft,
              turnRight,
              timestamp: now,
            });
          }
        }
      } else {
        // LOCAL MODE: Original game loop
        const alivePlayers = playersRef.current.filter((p) => p.alive);

        if (config.playerCount > 1 && alivePlayers.length <= 1) {
          audioManagerRef.current?.stopHeartbeat();
          
          if (alivePlayers.length === 1) {
            const winnerPlayer = alivePlayers[0];
            setWinner(winnerPlayer.id);
            onGameEnd(winnerPlayer.id);
            toast(`Player ${winnerPlayer.id + 1} Wins! 🏆`, {
              description: 'Next game starts in 5 seconds...',
              duration: 5000,
            });
          }
          startCountdown();
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

          player.trail.push({
            x: player.x,
            y: player.y,
            isGap: player.gapActive,
          });

          if (!player.gapActive) {
            if (checkCollision(player.x, player.y, playersRef.current, player.id)) {
              audioManagerRef.current?.playCrash();
              
              if (config.playerCount === 1) {
                player.trail = [];
                const spawn = { x: SPAWN_PADDING, y: canvas.height / 2, angle: 0 };
                player.x = spawn.x;
                player.y = spawn.y;
                player.angle = spawn.angle;
                player.alive = true;
                player.nextGapTime = now + Math.random() * config.gapInterval;
                player.gapActive = false;
              } else {
                player.alive = false;
                player.trail.push({
                  x: player.x,
                  y: player.y,
                  isGap: false,
                });
              }
            }
          }
        });
      }

      // Update heartbeat based on distance between alive snakes
      audioManagerRef.current?.updateHeartbeat(playersRef.current);

      // Clear canvas background
      ctx.fillStyle = 'oklch(0.10 0.05 250)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // For online mode, scale the rendering to fill the entire canvas
      if (gameMode === 'online') {
        const scaleX = canvas.width / gameWorldRef.current.width;
        const scaleY = canvas.height / gameWorldRef.current.height;
        
        ctx.save();
        ctx.scale(scaleX, scaleY);
      }

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

      // Restore context for online mode scaling
      if (gameMode === 'online') {
        ctx.restore();
      }

      // Draw touch controls for mobile (always in screen coordinates, not scaled)
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

    // Handle window resize
    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
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
      // Clean up countdown timer
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      // Clean up audio manager
      audioManagerRef.current?.destroy();
    };
  }, [config]);

  // Handle keyboard shortcuts for game end screen
  useEffect(() => {
    if (!showRestart) return;

    const handleGameEndKeys = (e: KeyboardEvent) => {
      // If countdown is active, Enter skips it, Esc cancels and goes to menu
      if (countdown !== null && countdown > 0) {
        if (e.key === 'Enter') {
          e.preventDefault();
          // Clear countdown and start immediately
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          setCountdown(null);
          
          // If online mode and host, send restart to clients
          if (gameMode === 'online' && isHost && networkManager) {
            networkManager.send({
              type: 'restart-game',
            });
          }
          
          startNewGame();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          // Clear countdown and go to menu
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          setCountdown(null);
          onBackToMenu();
        }
      } else {
        // No countdown active, normal behavior
        if (e.key === 'Enter') {
          e.preventDefault();
          startNewGame();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onBackToMenu();
        }
      }
    };

    window.addEventListener('keydown', handleGameEndKeys);
    return () => {
      window.removeEventListener('keydown', handleGameEndKeys);
    };
  }, [showRestart, countdown]);

  return (
    <>
      <canvas 
        ref={canvasRef} 
        className="block w-full h-full fixed top-0 left-0" 
        style={{ touchAction: 'none' }}
      />
      
      {/* Connection indicator for online mode */}
      {gameMode === 'online' && networkManager && (
        <div className="fixed top-4 right-4 z-10 pointer-events-none">
          <div className="bg-background/80 backdrop-blur-sm border rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-medium">
                {isHost ? 'Host' : `Player ${myPlayerId + 1}`}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {showRestart && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto flex flex-col gap-4 items-center">
            {countdown !== null && countdown > 0 ? (
              <div className="text-center">
                <div className="text-8xl font-bold mb-4 animate-pulse">
                  {countdown}
                </div>
                <div className="text-2xl text-muted-foreground">
                  Next game starting...
                </div>
              </div>
            ) : (
              <>
                <Button
                  onClick={startNewGame}
                  size="lg"
                  className="text-lg h-14 px-8 min-w-[240px]"
                >
                  {gameMode === 'online' ? 'Back to Lobby' : 'Play Again'}
                  <span className="ml-3 text-sm opacity-70">(Enter)</span>
                </Button>
                <Button
                  onClick={onBackToMenu}
                  variant="outline"
                  size="lg"
                  className="text-lg h-14 px-8 min-w-[240px]"
                >
                  Main Menu
                  <span className="ml-3 text-sm opacity-70">(Esc)</span>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Play } from '@phosphor-icons/react';
import type { GameConfig } from '@/lib/types';

interface ConfigScreenProps {
  onStartGame: (config: GameConfig) => void;
}

export function ConfigScreen({ onStartGame }: ConfigScreenProps) {
  const [playerCount, setPlayerCount] = useState(2);
  const [speed, setSpeed] = useState(2);
  const [gapInterval, setGapInterval] = useState(3000);

  const handleStart = () => {
    onStartGame({
      playerCount,
      speed,
      gapInterval,
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-8">
      <Card className="w-full max-w-lg p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">KURVE</h1>
          <p className="text-sm text-muted-foreground tracking-wide">
            Multiplayer Snake Arena
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="player-count" className="text-base">
              Number of Players
            </Label>
            <Select
              value={playerCount.toString()}
              onValueChange={(v) => setPlayerCount(parseInt(v))}
            >
              <SelectTrigger id="player-count">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Player</SelectItem>
                <SelectItem value="2">2 Players</SelectItem>
                <SelectItem value="3">3 Players</SelectItem>
                <SelectItem value="4">4 Players</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <Label htmlFor="speed" className="text-base">
                Snake Speed
              </Label>
              <span className="text-sm text-muted-foreground">{speed.toFixed(1)}</span>
            </div>
            <Slider
              id="speed"
              min={1}
              max={5}
              step={0.5}
              value={[speed]}
              onValueChange={(v) => setSpeed(v[0])}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <Label htmlFor="gap" className="text-base">
                Gap Interval
              </Label>
              <span className="text-sm text-muted-foreground">
                {(gapInterval / 1000).toFixed(1)}s
              </span>
            </div>
            <Slider
              id="gap"
              min={1000}
              max={8000}
              step={500}
              value={[gapInterval]}
              onValueChange={(v) => setGapInterval(v[0])}
            />
          </div>
        </div>

        <div className="pt-4 space-y-4">
          <Button
            onClick={handleStart}
            className="w-full text-base h-12"
            size="lg"
          >
            <Play className="mr-2" weight="fill" />
            Start Game
          </Button>

          <div className="text-xs text-muted-foreground space-y-1 text-center tracking-wide">
            <p>Player 1: A / D • Player 2: J / L</p>
            <p>Player 3: ← / → • Player 4: Left / Right Click</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

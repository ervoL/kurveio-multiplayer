import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Monitor } from '@phosphor-icons/react';
import type { GameMode } from '@/lib/types';

interface ModeSelectionProps {
  onSelectMode: (mode: GameMode) => void;
}

export function ModeSelection({ onSelectMode }: ModeSelectionProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-8">
      <Card className="w-full max-w-lg p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">KURVE</h1>
          <p className="text-sm text-muted-foreground tracking-wide">
            Multiplayer Snake Arena
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <Button
            onClick={() => onSelectMode('local')}
            className="w-full text-base h-16 text-lg"
            size="lg"
          >
            <Monitor className="mr-3" size={24} weight="fill" />
            Local
            <span className="ml-auto text-sm opacity-70">Same Device</span>
          </Button>

          <Button
            onClick={() => onSelectMode('online')}
            variant="outline"
            className="w-full text-base h-16 text-lg"
            size="lg"
          >
            <Users className="mr-3" size={24} weight="fill" />
            Online
            <span className="ml-auto text-sm opacity-70">Different Devices</span>
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center tracking-wide pt-2">
          <p>Choose your preferred game mode</p>
        </div>
      </Card>
    </div>
  );
}

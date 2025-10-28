import { Card } from '@/components/ui/card';
import { Trophy } from '@phosphor-icons/react';

interface ScoreboardProps {
  scores: number[];
  playerCount: number;
  players?: { peerId: string; playerId: number; playerName: string }[];
}

const playerColors = [
  'oklch(0.65 0.25 25)',
  'oklch(0.70 0.20 145)',
  'oklch(0.65 0.20 240)',
  'oklch(0.75 0.18 70)',
];

export function Scoreboard({ scores, playerCount, players = [] }: ScoreboardProps) {
  const maxScore = Math.max(...scores);

  const getPlayerName = (index: number) => {
    const player = players.find(p => p.playerId === index);
    return player ? player.playerName : `Player ${index + 1}`;
  };

  return (
    <Card className="fixed top-4 right-4 p-4 min-w-[200px] bg-transparent border-transparent backdrop-blur-none shadow-none pointer-events-none">
      <div className="flex items-center gap-2 mb-3 opacity-70">
        <Trophy weight="fill" className="text-accent" size={20} />
        <h2 className="text-sm font-bold tracking-wide">SCOREBOARD</h2>
      </div>
      <div className="space-y-2">
        {Array.from({ length: playerCount }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 opacity-70"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: playerColors[i] }}
              />
              <span className="text-sm">{getPlayerName(i)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold tabular-nums">{scores[i]}</span>
              {scores[i] === maxScore && scores[i] > 0 && (
                <Trophy weight="fill" className="text-accent" size={16} />
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

import { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { ConfigScreen } from '@/components/ConfigScreen';
import { GameCanvas } from '@/components/GameCanvas';
import { Scoreboard } from '@/components/Scoreboard';
import type { GameConfig } from '@/lib/types';

function App() {
  const [gameState, setGameState] = useState<'config' | 'playing'>('config');
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [scores, setScores] = useState<number[]>([0, 0, 0, 0]);

  const handleStartGame = (newConfig: GameConfig) => {
    setConfig(newConfig);
    setGameState('playing');
  };

  const handleGameEnd = (winnerId?: number) => {
    if (winnerId !== undefined) {
      setScores((currentScores) => {
        const newScores = [...currentScores];
        newScores[winnerId] = (newScores[winnerId] || 0) + 1;
        return newScores;
      });
    }
  };

  const handleBackToMenu = () => {
    setGameState('config');
    setScores([0, 0, 0, 0]); // Reset scores when going back to menu
  };

  return (
    <>
      {gameState === 'config' && <ConfigScreen onStartGame={handleStartGame} />}
      {gameState === 'playing' && config && (
        <>
          <GameCanvas config={config} onGameEnd={handleGameEnd} onBackToMenu={handleBackToMenu} />
          <Scoreboard scores={scores} playerCount={config.playerCount} />
        </>
      )}
      <Toaster />
    </>
  );
}

export default App;
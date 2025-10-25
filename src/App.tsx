import { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { ConfigScreen } from '@/components/ConfigScreen';
import { GameCanvas } from '@/components/GameCanvas';
import type { GameConfig } from '@/lib/types';

function App() {
  const [gameState, setGameState] = useState<'config' | 'playing'>('config');
  const [config, setConfig] = useState<GameConfig | null>(null);

  const handleStartGame = (newConfig: GameConfig) => {
    setConfig(newConfig);
    setGameState('playing');
  };

  const handleGameEnd = () => {
    setGameState('config');
    setConfig(null);
  };

  return (
    <>
      {gameState === 'config' && <ConfigScreen onStartGame={handleStartGame} />}
      {gameState === 'playing' && config && (
        <GameCanvas config={config} onGameEnd={handleGameEnd} />
      )}
      <Toaster />
    </>
  );
}

export default App;
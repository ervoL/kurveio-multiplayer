import { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { ModeSelection } from '@/components/ModeSelection';
import { ConfigScreen } from '@/components/ConfigScreen';
import { OnlineLobby } from '@/components/OnlineLobby';
import { GameCanvas } from '@/components/GameCanvas';
import { Scoreboard } from '@/components/Scoreboard';
import type { GameConfig, GameMode } from '@/lib/types';
import type { NetworkManager } from '@/lib/network';

type AppState = 'mode-select' | 'config' | 'online-lobby' | 'playing';

function App() {
  const [appState, setAppState] = useState<AppState>('mode-select');
  const [gameMode, setGameMode] = useState<GameMode>('local');
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [scores, setScores] = useState<number[]>([0, 0, 0, 0]);
  const [networkManager, setNetworkManager] = useState<NetworkManager | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState(0);
  const [playerAssignments, setPlayerAssignments] = useState<{ peerId: string; playerId: number; playerName: string }[]>([]);

  const handleSelectMode = (mode: GameMode) => {
    setGameMode(mode);
    if (mode === 'local') {
      setAppState('config');
    } else {
      setAppState('online-lobby');
    }
  };

  const handleStartLocalGame = (newConfig: GameConfig) => {
    setConfig(newConfig);
    setAppState('playing');
  };

  const handleStartOnlineGame = (
    newConfig: GameConfig,
    manager: NetworkManager,
    host: boolean,
    playerId: number,
    assignments: { peerId: string; playerId: number; playerName: string }[]
  ) => {
    setConfig(newConfig);
    setNetworkManager(manager);
    setIsHost(host);
    setMyPlayerId(playerId);
    setPlayerAssignments(assignments);
    setAppState('playing');
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
    // Disconnect network if online mode
    if (networkManager) {
      networkManager.disconnect();
      setNetworkManager(null);
    }
    setAppState('mode-select');
    setScores([0, 0, 0, 0]);
    setGameMode('local');
  };

  const handleBackToLobby = () => {
    // For online mode, go back to lobby instead of menu
    if (gameMode === 'online') {
      setAppState('online-lobby');
    } else {
      handleBackToMenu();
    }
  };

  const handleBackFromLobby = () => {
    setAppState('mode-select');
  };

  const handleBackFromConfig = () => {
    setAppState('mode-select');
  };

  return (
    <>
      {appState === 'mode-select' && <ModeSelection onSelectMode={handleSelectMode} />}
      {appState === 'config' && (
        <ConfigScreen onStartGame={handleStartLocalGame} onBack={handleBackFromConfig} />
      )}
      {appState === 'online-lobby' && (
        <OnlineLobby 
          onStartGame={handleStartOnlineGame} 
          onBack={handleBackFromLobby}
          networkManager={networkManager}
          isHost={isHost}
          myPlayerId={myPlayerId}
        />
      )}
      {appState === 'playing' && config && (
        <>
          <GameCanvas
            config={config}
            onGameEnd={handleGameEnd}
            onBackToMenu={handleBackToMenu}
            onBackToLobby={handleBackToLobby}
            networkManager={networkManager}
            isHost={isHost}
            gameMode={gameMode}
            myPlayerId={myPlayerId}
            playerAssignments={playerAssignments}
          />
          <Scoreboard scores={scores} playerCount={config.playerCount} players={playerAssignments} />
        </>
      )}
      <Toaster />
    </>
  );
}

export default App;
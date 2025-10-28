import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Copy, ArrowLeft, Check, X } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { NetworkManager } from '@/lib/network';
import type { GameConfig, NetworkPlayer } from '@/lib/types';

interface OnlineLobbyProps {
  onStartGame: (
    config: GameConfig,
    networkManager: NetworkManager,
    isHost: boolean,
    myPlayerId: number
  ) => void;
  onBack: () => void;
}

export function OnlineLobby({ onStartGame, onBack }: OnlineLobbyProps) {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [myRoomCode, setMyRoomCode] = useState('');
  const [networkManager] = useState(() => new NetworkManager());
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInLobby, setIsInLobby] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState<NetworkPlayer[]>([]);
  const [myReady, setMyReady] = useState(false);
  const [gameConfig, setGameConfig] = useState<GameConfig>({
    playerCount: 2,
    speed: 2,
    gapInterval: 3000,
  });

  useEffect(() => {
    // Set up network message handlers
    networkManager.on('player-join', (data, peerId) => {
      if (isHost) {
        console.log('Player joined:', data);
        setPlayers((prev) => [
          ...prev,
          {
            peerId: data.peerId,
            playerName: data.playerName,
            ready: false,
          },
        ]);
        toast.success(`${data.playerName} joined the room`);
      }
    });

    networkManager.on('player-ready', (data) => {
      setPlayers((prev) =>
        prev.map((p) =>
          p.peerId === data.peerId ? { ...p, ready: data.ready } : p
        )
      );
    });

    networkManager.on('start-game', (data) => {
      if (!isHost) {
        // Client receives start game message
        const myAssignment = data.playerAssignments.find(
          (a) => a.peerId === networkManager.myPeerId
        );
        if (myAssignment) {
          onStartGame(data.config, networkManager, false, myAssignment.playerId);
        }
      }
    });

    networkManager.on('disconnect', (data) => {
      const disconnectedPeer = data.peerId;
      setPlayers((prev) => prev.filter((p) => p.peerId !== disconnectedPeer));
      
      const playerName = players.find((p) => p.peerId === disconnectedPeer)?.playerName;
      if (playerName) {
        toast.error(`${playerName} disconnected`);
      }
    });

    return () => {
      networkManager.disconnect();
    };
  }, [isHost, networkManager, onStartGame, players]);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsConnecting(true);
    try {
      const roomId = await networkManager.createRoom(playerName.trim());
      setMyRoomCode(roomId);
      setIsHost(true);
      setIsInLobby(true);
      setPlayers([
        {
          peerId: networkManager.myPeerId,
          playerName: playerName.trim(),
          ready: false,
        },
      ]);
      toast.success('Room created successfully!');
    } catch (error) {
      console.error('Failed to create room:', error);
      toast.error('Failed to create room. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!roomCode.trim()) {
      toast.error('Please enter room code');
      return;
    }

    setIsConnecting(true);
    try {
      await networkManager.joinRoom(roomCode.trim(), playerName.trim());
      setIsHost(false);
      setIsInLobby(true);
      setPlayers([
        {
          peerId: networkManager.myPeerId,
          playerName: playerName.trim(),
          ready: false,
        },
      ]);
      toast.success('Joined room successfully!');
    } catch (error) {
      console.error('Failed to join room:', error);
      toast.error('Failed to join room. Please check the code and try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(myRoomCode);
    toast.success('Room code copied to clipboard!');
  };

  const handleToggleReady = () => {
    const newReady = !myReady;
    setMyReady(newReady);
    
    // Update local player state
    setPlayers((prev) =>
      prev.map((p) =>
        p.peerId === networkManager.myPeerId ? { ...p, ready: newReady } : p
      )
    );

    // Send ready state to others
    networkManager.send({
      type: 'player-ready',
      peerId: networkManager.myPeerId,
      ready: newReady,
    });
  };

  const handleStartGame = () => {
    if (!isHost) return;

    const allReady = players.every((p) => p.ready);
    if (!allReady) {
      toast.error('All players must be ready!');
      return;
    }

    if (players.length < 2) {
      toast.error('Need at least 2 players to start!');
      return;
    }

    // Assign player IDs
    const playerAssignments = players.map((p, index) => ({
      peerId: p.peerId,
      playerId: index,
    }));

    // Send start game message to all clients
    networkManager.send({
      type: 'start-game',
      config: gameConfig,
      playerAssignments,
    });

    // Find host's player ID
    const hostAssignment = playerAssignments.find(
      (a) => a.peerId === networkManager.myPeerId
    );
    const hostPlayerId = hostAssignment ? hostAssignment.playerId : 0;

    // Start game for host
    onStartGame(gameConfig, networkManager, true, hostPlayerId);
  };

  const handleBack = () => {
    networkManager.disconnect();
    setIsInLobby(false);
    setPlayers([]);
    setMyReady(false);
    onBack();
  };

  if (isInLobby) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-8">
        <Card className="w-full max-w-lg p-8 space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="mr-2" />
              Leave
            </Button>
            {isHost && myRoomCode && (
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono bg-muted px-3 py-1 rounded">
                  {myRoomCode}
                </code>
                <Button variant="ghost" size="sm" onClick={handleCopyRoomCode}>
                  <Copy size={16} />
                </Button>
              </div>
            )}
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">
              {isHost ? 'Your Lobby' : 'Waiting Room'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isHost
                ? 'Share the room code with your friends'
                : 'Waiting for host to start the game'}
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-base">Players ({players.length}/4)</Label>
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.peerId}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        player.ready ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                    <span className="font-medium">{player.playerName}</span>
                    {player.peerId === networkManager.myPeerId && (
                      <span className="text-xs text-muted-foreground">(You)</span>
                    )}
                  </div>
                  {player.ready ? (
                    <Check className="text-green-500" size={20} />
                  ) : (
                    <X className="text-gray-400" size={20} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleToggleReady}
              variant={myReady ? 'outline' : 'default'}
              className="flex-1"
              size="lg"
            >
              {myReady ? 'Not Ready' : 'Ready'}
            </Button>
            {isHost && (
              <Button
                onClick={handleStartGame}
                className="flex-1"
                size="lg"
                disabled={!players.every((p) => p.ready) || players.length < 2}
              >
                <Play className="mr-2" weight="fill" />
                Start Game
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-8">
      <Card className="w-full max-w-lg p-8 space-y-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
          <ArrowLeft className="mr-2" />
          Back
        </Button>

        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Online Multiplayer</h2>
          <p className="text-sm text-muted-foreground">
            Create or join a game room
          </p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'create' | 'join')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Room</TabsTrigger>
            <TabsTrigger value="join">Join Room</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="create-name">Your Name</Label>
              <Input
                id="create-name"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
              />
            </div>

            <Button
              onClick={handleCreateRoom}
              className="w-full"
              size="lg"
              disabled={isConnecting}
            >
              {isConnecting ? 'Creating...' : 'Create Room'}
            </Button>
          </TabsContent>

          <TabsContent value="join" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="join-name">Your Name</Label>
              <Input
                id="join-name"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="room-code">Room Code</Label>
              <Input
                id="room-code"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="font-mono"
              />
            </div>

            <Button
              onClick={handleJoinRoom}
              className="w-full"
              size="lg"
              disabled={isConnecting}
            >
              {isConnecting ? 'Joining...' : 'Join Room'}
            </Button>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

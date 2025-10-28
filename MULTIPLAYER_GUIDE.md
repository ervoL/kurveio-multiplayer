# Online Multiplayer Guide

## How to Play Online Multiplayer

### Creating a Room (Host)

1. Click **"Online Multiplayer"** on the mode selection screen
2. Click **"Create Room"** tab
3. Enter your player name
4. Click **"Create Room"**
5. Share the room code (e.g., "KURVE-ABC123") with your friends
6. Wait for players to join
7. Click **"Ready"** when you're prepared to play
8. Once all players are ready, click **"Start Game"**

### Joining a Room (Client)

1. Click **"Online Multiplayer"** on the mode selection screen
2. Click **"Join Room"** tab  
3. Enter your player name
4. Enter the room code shared by the host
5. Click **"Join Room"**
6. Wait in the lobby for other players
7. Click **"Ready"** when you're prepared to play
8. Wait for the host to start the game

## Technical Details

### How It Works

The online multiplayer uses **WebRTC Peer-to-Peer** connections:

- **No dedicated game server required** - games run directly between players
- **Low latency** - Direct P2P connections typically have 10-50ms ping
- **Free to play** - Uses PeerJS cloud signaling (free tier)
- **Host-authoritative** - The room creator runs the game simulation
- **State synchronization** - Game state updates at ~30 Hz to all players

### Connection Requirements

- Modern browser with WebRTC support (Chrome, Firefox, Safari, Edge)
- Internet connection (works across different networks)
- Most firewalls allow WebRTC connections automatically
- If connection fails, try:
  - Disabling VPN temporarily
  - Using a different network
  - Checking firewall settings

### Limitations

- **Host dependency**: If the host leaves, the game ends for all players
- **Player limit**: 2-4 players per game (as designed)
- **Connection issues**: ~10% of networks may have NAT traversal problems
- **No reconnection**: If a player disconnects, they can't rejoin the same game

## Controls

### Host (Player 1)
- Uses the controls assigned in the lobby (typically A/D for keyboard)

### Clients (Players 2-4)
- Each player gets assigned controls automatically
- Controls are shown in the lobby before game starts

## Tips for Best Experience

1. **Good internet connection** - At least 1 Mbps upload/download
2. **Low latency** - Players on the same continent have better experience
3. **Stable connection** - Avoid mobile networks if possible
4. **Browser choice** - Chrome and Edge typically have best WebRTC performance

## Troubleshooting

### "Failed to create room"
- Refresh the page and try again
- Check your internet connection
- Try a different browser

### "Failed to join room"
- Verify the room code is correct
- Make sure the room still exists (host hasn't left)
- Check your internet connection

### "Player disconnected"
- Normal disconnect if someone closes their browser
- Check internet stability
- If it's the host, the game ends for everyone

### Laggy gameplay
- Host should have good upload bandwidth
- Try playing with fewer players
- Check for background downloads/uploads
- Try getting geographically closer players

## Future Improvements

Planned features:
- Reconnection support
- Dedicated server option for better reliability
- Matchmaking system
- Spectator mode
- Game replays
- Chat system

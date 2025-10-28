# Local Multiplayer Testing Guide

## Quick Start

1. **Start the dev server:**
   ```powershell
   npm run dev
   ```

2. **Open in multiple browsers:**
   - Chrome: `http://localhost:5000/kurveio-multiplayer/`
   - Firefox: `http://localhost:5000/kurveio-multiplayer/`
   - Edge: `http://localhost:5000/kurveio-multiplayer/`

3. **Create and join:**
   - Browser 1: Create Room → Get room code
   - Browser 2+: Join Room → Enter room code

## Troubleshooting

### Issue: "Could not connect to peer"

**Try these solutions in order:**

#### Solution 1: Use Incognito/Private Windows
Browser extensions or cached data can interfere with WebRTC:
- Chrome: Ctrl+Shift+N
- Firefox: Ctrl+Shift+P
- Edge: Ctrl+Shift+N

Open the app in 2+ incognito windows and try again.

#### Solution 2: Clear Browser Cache
1. Press F12 to open DevTools
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Try creating/joining again

#### Solution 3: Check Browser Console
Press F12 and look for:
- ✅ "Room created with ID: KURVE-XXXXXX" (host)
- ✅ "My peer ID: ..." (client)
- ✅ "Connected to host" (client)
- ❌ Any red errors about WebRTC or ICE candidates

#### Solution 4: Test with Different PeerJS Server
If the cloud server is down, you can run your own PeerJS server:

```powershell
# Install PeerJS server globally
npm install -g peer

# Run local PeerJS server
peerjs --port 9000
```

Then update `src/lib/network.ts`:
```typescript
// Change both createRoom and joinRoom to use:
this.peer = new Peer(roomCode, {  // or new Peer({ for client
  debug: 2,
  host: 'localhost',
  port: 9000,
  path: '/',
  secure: false,  // Change to false for localhost
  // ... rest of config
});
```

#### Solution 5: Use Different Network Test
Instead of same PC, try:
- Computer 1: Create room
- Phone (on same WiFi): Join room using Network URL
- This bypasses any localhost-specific issues

## Expected Console Output

### Host Browser:
```
Room created with ID: KURVE-ABC123
Incoming connection from: 0884a215-6f75-4b7c-a6dd-da811e805ace
Connection opened: 0884a215-6f75-4b7c-a6dd-da811e805ace
```

### Client Browser:
```
My peer ID: 0884a215-6f75-4b7c-a6dd-da811e805ace
Connected to host
```

## Testing Scenarios

### ✅ Checklist
- [ ] 2 browsers on same PC
- [ ] 2+ browsers in incognito mode
- [ ] Phone + PC (same WiFi)
- [ ] Different PC on same network
- [ ] Host disconnect (ends game)
- [ ] Client disconnect (others continue)
- [ ] 3-4 player game
- [ ] Game controls work for all players
- [ ] Collisions sync properly
- [ ] Scores update correctly

## Known Issues

1. **401 Unauthorized on _spark/loaded**: 
   - This is unrelated to multiplayer, safe to ignore
   
2. **favicon.ico 404**: 
   - Missing favicon, safe to ignore

3. **First connection attempt fails**:
   - Sometimes the first attempt times out
   - Try creating a new room and joining again

4. **Firewall warnings**:
   - Windows may ask to allow Node.js through firewall
   - Click "Allow" for both Private and Public networks

## Performance Tips

- **Close other tabs**: WebRTC uses CPU
- **Use production build**: `npm run build && npm run preview` for better performance
- **Limit debug output**: Set `debug: 0` in network.ts for production
- **Monitor network tab**: Check WebSocket connection in DevTools

## Alternative Testing: Production Build

For the most accurate test:

```powershell
# Build the app
npm run build

# Preview the production build
npm run preview
```

This will be faster and more stable than dev mode.

# Testing Multiplayer Locally - Quick Start Guide

## The Problem
The PeerJS cloud server (0.peerjs.com) can be unreliable and cause "Could not connect to peer" errors.

## The Solution
Run your own local PeerJS server for testing!

---

## 🚀 Quick Start (3 Steps)

### Step 1: Start the PeerJS Server
Open a **NEW terminal** and run:
```powershell
npm run peerserver
```

You should see:
```
Started PeerServer on ::, port: 9000, path: /myapp
```

**Keep this terminal running!**

### Step 2: Start Your App
In your **existing terminal** (or a new one), run:
```powershell
npm run dev
```

You should see:
```
PeerJS Config: Local Server (localhost:9000)
```

### Step 3: Test Multiplayer
Open 2+ browsers and test:

**Browser 1 (Host):**
1. Go to `http://localhost:5000/kurveio-multiplayer/`
2. Click "Online Multiplayer" → "Create Room"
3. Enter your name → Click "Create Room"
4. **Copy the room code** (e.g., KURVE-ABC123)

**Browser 2+ (Players):**
1. Go to `http://localhost:5000/kurveio-multiplayer/`
2. Click "Online Multiplayer" → "Join Room"
3. Enter your name and the room code
4. Click "Join Room"

**✅ You should now be connected!**

---

## 📱 Testing with Phone/Tablet

### Step 1: Find Your Computer's IP
The dev server shows network URLs:
```
Network: http://192.168.0.28:5000/kurveio-multiplayer/
```

### Step 2: Update .env.local
Edit `.env.local` and change:
```env
VITE_USE_LOCAL_PEERSERVER=false
```

This makes your phone use the cloud PeerJS server (since it can't reach localhost:9000).

### Step 3: Test
- **PC**: Create room (will use local server)
- **Phone** (on same WiFi): Join room using the Network URL (will use cloud server)

**Note:** This mixed setup might not work reliably. For best results, use cloud server for all devices when testing across devices.

---

## 🔧 Configuration

### Using Local PeerJS Server (Same PC Testing)
**File:** `.env.local`
```env
VITE_USE_LOCAL_PEERSERVER=true
```

**Requirements:**
- Run `npm run peerserver` in a separate terminal
- All browsers must be on the same computer
- Most reliable for development

### Using Cloud PeerJS Server (Cross-Device Testing)
**File:** `.env.local`
```env
VITE_USE_LOCAL_PEERSERVER=false
```

**Benefits:**
- Works across different devices/networks
- No need to run PeerJS server
- Best for testing phone + PC

**Drawbacks:**
- Can be unreliable (server issues)
- May have connection problems

---

## ✅ Expected Console Output

### Host Browser (Local Server)
```
PeerJS Config: Local Server (localhost:9000)
Room created with ID: KURVE-ABC123
Waiting for players to connect...
Incoming connection from: a1b2c3d4-...
```

### Client Browser (Local Server)
```
PeerJS Config: Local Server (localhost:9000)
My peer ID: a1b2c3d4-...
Attempting to connect to room: KURVE-ABC123
Connected to host
```

---

## 🐛 Troubleshooting

### Error: "Could not connect to peer"

**Using Local Server?**
1. Check that `npm run peerserver` is running
2. Verify `.env.local` has `VITE_USE_LOCAL_PEERSERVER=true`
3. Restart your dev server (`npm run dev`)
4. Hard refresh browsers (Ctrl+Shift+R)

**Using Cloud Server?**
1. Set `.env.local` to `VITE_USE_LOCAL_PEERSERVER=false`
2. Try in incognito/private windows
3. Check internet connection
4. Wait a few seconds and try again (server might be busy)

### PeerJS Server Won't Start

**Error:** `peerjs: command not found`

Run:
```powershell
npm install
```

Then try again:
```powershell
npm run peerserver
```

### Can't Connect from Phone

**Make sure:**
1. Phone and PC are on the **same WiFi network**
2. Use the **Network URL** shown in terminal (e.g., `http://192.168.0.28:5000/kurveio-multiplayer/`)
3. `.env.local` has `VITE_USE_LOCAL_PEERSERVER=false`
4. PC firewall allows connections (Windows might ask)

---

## 📊 Testing Checklist

### Local Server Testing (Same PC)
- [ ] Set `.env.local` to `VITE_USE_LOCAL_PEERSERVER=true`
- [ ] Run `npm run peerserver`
- [ ] Run `npm run dev`
- [ ] Test in Chrome + Firefox
- [ ] Test in 3-4 browsers simultaneously
- [ ] Test host disconnect
- [ ] Test client disconnect

### Cloud Server Testing (Cross-Device)
- [ ] Set `.env.local` to `VITE_USE_LOCAL_PEERSERVER=false`
- [ ] Run `npm run dev`
- [ ] Test PC + Phone
- [ ] Test PC + Tablet
- [ ] Test on mobile data (different network)
- [ ] Test with incognito windows

---

## 🎯 Best Practices

### For Development (Same PC)
✅ Use **local PeerJS server**
- Most reliable
- Fast connections
- Easy debugging

### For Testing (Real Scenarios)
✅ Use **cloud PeerJS server**
- Tests real-world conditions
- Works across networks
- Simulates production

### For Production
✅ Use **cloud PeerJS server** (or deploy your own)
- Consider upgrading to paid PeerJS hosting
- Or deploy your own PeerJS server to AWS/Heroku
- Configure production URLs in environment variables

---

## 🚨 Important Notes

1. **Always restart dev server after changing `.env.local`**
2. **Keep PeerJS server running** when using local mode
3. **Don't commit `.env.local`** - it's in .gitignore
4. **Use `.env.example`** to document configuration for team members

---

## Need Help?

Check console for:
```
PeerJS Config: Local Server (localhost:9000)
```
or
```
PeerJS Config: Cloud Server (0.peerjs.com)
```

This tells you which server you're using.

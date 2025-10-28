# 🎮 Kurve.io - Multiplayer Snake Arena

A recreation of the classic multiplayer snake game, now with **online multiplayer support**! Built entirely using **GitHub Spark** and **GitHub Copilot**.

## 🌟 About This Project

This is a test project that brings back the nostalgic fun of old-school multiplayer snake games. Players compete to be the last snake standing by avoiding trails and strategically using gaps.

**🤖 Built 100% with AI:**
- Designed and developed using **GitHub Spark**
- Code assistance and refinements by **GitHub Copilot**
- A clean, minimal Spark environment

## 🎯 Features

- **Local Multiplayer** - Gather your friends around one keyboard or one touch device (2-4 players)
- **Online Multiplayer** ⭐ NEW! - Play with friends on different devices using WebRTC P2P
  - Create or join rooms with simple room codes
  - No server costs - direct peer-to-peer connections
  - Low latency gameplay (~10-50ms)
  - Works across different networks
- **Classic Gameplay** - Simple, addictive, and fun
- **Modern Tech Stack** - Built with React, TypeScript, and Vite
- **Responsive Design** - Styled with Tailwind CSS
- **Mobile Support** - Touch controls for mobile devices

**Quick Start:**
1. Choose "Online Multiplayer" from the menu
2. Create a room (host) or join with a room code (client)
3. Wait for all players to be ready
4. Play!

**Technical Details:**
- Uses WebRTC for peer-to-peer connections
- PeerJS library for easy WebRTC setup
- Host-authoritative game simulation
- State synchronization at ~30 Hz
- Free to use (no server costs)

## 🚀 Play Online

The game is live and playable on [GitHub Pages](https://ervol.github.io/kurveio-multiplayer/)

## 💻 Development

This project uses:
- React 19
- TypeScript
- Vite
- Tailwind CSS
- PeerJS (WebRTC)
- GitHub Spark & Copilot

### Local Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎮 Controls

### Local Multiplayer
- **Player 1:** A (left) / D (right)
- **Player 2:** J (left) / L (right)
- **Player 3:** ← (left) / → (right)
- **Player 4:** Left Click (left) / Right Click (right)

## 📝 License

MIT license

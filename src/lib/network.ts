import Peer, { DataConnection } from 'peerjs';
import type { NetworkMessage, NetworkPlayer } from './types';
import { isTouchDevice } from './game';

// PeerJS server configuration
// For local testing: Set VITE_USE_LOCAL_PEERSERVER=true in .env.local
const USE_LOCAL_SERVER = import.meta.env.VITE_USE_LOCAL_PEERSERVER === 'true';

const PEER_CONFIG = USE_LOCAL_SERVER 
  ? {
      host: 'localhost',
      port: 9000,
      path: '/myapp',
      secure: false,
    }
  : {
      host: '0.peerjs.com',
      port: 443,
      path: '/',
      secure: true,
    };

export class NetworkManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private isHost: boolean = false;
  private hostConnection: DataConnection | null = null;
  private messageHandlers: Map<string, (data: any, peerId: string) => void> = new Map();
  
  public roomId: string = '';
  public myPeerId: string = '';
  public myPlayerName: string = '';
  
  constructor() {
    console.log('PeerJS Config:', USE_LOCAL_SERVER ? 'Local Server (localhost:9000)' : 'Cloud Server (0.peerjs.com)');
  }

  // Initialize as host
  async createRoom(playerName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.myPlayerName = playerName;
      this.isHost = true;
      
      // Create peer with a custom ID (room code)
      const roomCode = this.generateRoomCode();
      this.peer = new Peer(roomCode, {
        debug: 2,
        ...PEER_CONFIG,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ]
        }
      });

      this.peer.on('open', (id) => {
        this.myPeerId = id;
        this.roomId = id;
        console.log('Room created with ID:', id);
        console.log('Waiting for players to connect...');
        resolve(id);
      });

      this.peer.on('error', (error) => {
        console.error('Peer error:', error);
        reject(error);
      });

      this.peer.on('connection', (conn) => {
        this.handleIncomingConnection(conn);
      });
    });
  }

  // Initialize as client
  async joinRoom(roomId: string, playerName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.myPlayerName = playerName;
      this.isHost = false;
      this.roomId = roomId;
      
      this.peer = new Peer({
        debug: 2,
        ...PEER_CONFIG,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ]
        }
      });

      this.peer.on('open', (id) => {
        this.myPeerId = id;
        console.log('My peer ID:', id);
        console.log('Attempting to connect to room:', roomId);
        
        // Add a small delay to ensure the host is ready
        setTimeout(() => {
          // Connect to host
          const conn = this.peer!.connect(roomId, {
            reliable: true,
          });

          conn.on('open', () => {
            console.log('Connected to host');
            this.hostConnection = conn;
            this.setupConnectionHandlers(conn);
            
            // Send join message with control type
            const controlType = isTouchDevice() ? 'touch' : 'keyboard';
            this.send({
              type: 'player-join',
              playerName: this.myPlayerName,
              peerId: this.myPeerId,
              controlType: controlType,
            });
            
            resolve();
          });

          conn.on('error', (error) => {
            console.error('Connection error:', error);
            reject(error);
          });
        }, 500);
      });

      this.peer.on('error', (error) => {
        console.error('Peer error:', error);
        reject(error);
      });
    });
  }

  private handleIncomingConnection(conn: DataConnection) {
    console.log('Incoming connection from:', conn.peer);
    
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      this.setupConnectionHandlers(conn);
    });
  }

  private setupConnectionHandlers(conn: DataConnection) {
    conn.on('data', (data) => {
      this.handleMessage(data as NetworkMessage, conn.peer);
    });

    conn.on('close', () => {
      console.log('Connection closed:', conn.peer);
      this.connections.delete(conn.peer);
      this.notifyConnectionClosed(conn.peer);
    });

    conn.on('error', (error) => {
      console.error('Connection error:', error);
    });
  }

  private handleMessage(message: NetworkMessage, peerId: string) {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message, peerId);
    }
  }

  private notifyConnectionClosed(peerId: string) {
    const handler = this.messageHandlers.get('disconnect');
    if (handler) {
      handler({ peerId }, peerId);
    }
  }

  // Send message to specific peer or all peers
  send(message: NetworkMessage, toPeerId?: string) {
    if (this.isHost) {
      // Host sends to specific peer or all peers
      if (toPeerId) {
        const conn = this.connections.get(toPeerId);
        if (conn && conn.open) {
          conn.send(message);
        }
      } else {
        // Broadcast to all connections
        this.connections.forEach((conn) => {
          if (conn.open) {
            conn.send(message);
          }
        });
      }
    } else {
      // Client sends to host
      if (this.hostConnection && this.hostConnection.open) {
        this.hostConnection.send(message);
      }
    }
  }

  // Register message handler
  on(messageType: string, handler: (data: any, peerId: string) => void) {
    this.messageHandlers.set(messageType, handler);
  }

  // Get all connected peer IDs
  getConnectedPeers(): string[] {
    return Array.from(this.connections.keys());
  }

  // Check if this peer is the host
  getIsHost(): boolean {
    return this.isHost;
  }

  // Disconnect and cleanup
  disconnect() {
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();
    
    if (this.hostConnection) {
      this.hostConnection.close();
      this.hostConnection = null;
    }
    
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    
    this.messageHandlers.clear();
  }

  private generateRoomCode(): string {
    // Generate a 6-character room code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'KURVE-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

import { io, Socket } from 'socket.io-client';
import { SocketEvents, GameState, Room, PlayerInRoom } from '../types/game.types';

export class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(): Socket {
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    this.socket = io(serverUrl);

    // Set up connection event listeners
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.emit('connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.emit('disconnected');
    });

    // Set up game event listeners
    this.setupGameEventListeners();

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupGameEventListeners(): void {
    if (!this.socket) return;

    // Room events
    this.socket.on('room-joined', (data: SocketEvents['room-joined']) => {
      this.emit('room-joined', data);
    });

    this.socket.on('room-left', (data: SocketEvents['room-left']) => {
      this.emit('room-left', data);
    });

    this.socket.on('player-joined', (data: SocketEvents['player-joined']) => {
      this.emit('player-joined', data);
    });

    this.socket.on('player-left', (data: SocketEvents['player-left']) => {
      this.emit('player-left', data);
    });

    this.socket.on('room-updated', (data: SocketEvents['room-updated']) => {
      this.emit('room-updated', data);
    });

    // Game events
    this.socket.on('game-started', (data: SocketEvents['game-started']) => {
      this.emit('game-started', data);
    });

    this.socket.on('game-state-updated', (gameState: GameState) => {
      this.emit('game-state-updated', gameState);
    });

    this.socket.on('game-ended', (data: SocketEvents['game-ended']) => {
      this.emit('game-ended', data);
    });

    // Error events
    this.socket.on('error', (data: SocketEvents['error']) => {
      this.emit('error', data);
    });

    // Heartbeat mechanism
    this.socket.on('ping', () => {
      console.log('Received ping from server, sending pong');
      this.socket.emit('pong');
    });
  }

  // Emit events to server
  joinRoom(data: SocketEvents['join-room']): void {
    this.socket?.emit('join-room', data);
  }

  leaveRoom(data: SocketEvents['leave-room']): void {
    this.socket?.emit('leave-room', data);
  }

  startGame(data: SocketEvents['start-game']): void {
    this.socket?.emit('start-game', data);
  }

  gameAction(action: SocketEvents['game-action']): void {
    this.socket?.emit('game-action', action);
  }

  // Event listener management
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Singleton instance
export const socketService = new SocketService();

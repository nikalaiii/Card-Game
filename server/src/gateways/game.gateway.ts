import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { RoomService } from '../services/room.service';
import { GameService } from '../services/game.service';
import { SocketEvents, GameAction } from '../types/game.types';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('GameGateway');
  private playerRooms: Map<string, string> = new Map(); // socketId -> roomId
  private roomSockets: Map<string, Set<string>> = new Map(); // roomId -> Set of socketIds

  constructor(
    private roomService: RoomService,
    private gameService: GameService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    const roomId = this.playerRooms.get(client.id);
    if (roomId) {
      this.handlePlayerLeave(client, roomId);
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SocketEvents['join-room'],
  ) {
    try {
      const { roomId, playerName } = data;
      
      const result = await this.roomService.joinRoom({ roomId, playerName });
      
      if (result.success) {
        // Store player's room and socket
        this.playerRooms.set(client.id, roomId);
        
        if (!this.roomSockets.has(roomId)) {
          this.roomSockets.set(roomId, new Set());
        }
        this.roomSockets.get(roomId)!.add(client.id);

        // Join socket room for broadcasting
        client.join(roomId);

        // Get updated room data
        const room = await this.roomService.getRoom(roomId);
        
        // Emit success to the joining player
        client.emit('room-joined', {
          success: true,
          message: result.message,
          room,
        });

        // Notify other players in the room
        client.to(roomId).emit('player-joined', {
          player: {
            id: client.id,
            name: playerName,
            status: 'waiting',
            role: 'player',
            cards: [],
            socketId: client.id,
          },
        });

        this.logger.log(`Player ${playerName} joined room ${roomId}`);
      } else {
        client.emit('room-joined', result);
      }
    } catch (error) {
      this.logger.error('Error joining room:', error);
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SocketEvents['leave-room'],
  ) {
    try {
      const { roomId, playerId } = data;
      
      this.handlePlayerLeave(client, roomId);
      
      client.emit('room-left', {
        success: true,
        message: 'Successfully left room',
      });

      this.logger.log(`Player left room ${roomId}`);
    } catch (error) {
      this.logger.error('Error leaving room:', error);
      client.emit('error', { message: 'Failed to leave room' });
    }
  }

  @SubscribeMessage('start-game')
  async handleStartGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SocketEvents['start-game'],
  ) {
    try {
      const { roomId, playerId } = data;
      
      const room = await this.roomService.startGame(roomId, playerId);
      const gameState = await this.gameService.getGameStateByRoomId(roomId);
      
      // Broadcast game started to all players in the room
      this.server.to(roomId).emit('game-started', {
        roomId,
        gameState,
      });

      this.logger.log(`Game started in room ${roomId}`);
    } catch (error) {
      this.logger.error('Error starting game:', error);
      client.emit('error', { message: 'Failed to start game' });
    }
  }

  @SubscribeMessage('game-action')
  async handleGameAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SocketEvents['game-action'],
  ) {
    try {
      const gameState = await this.gameService.processGameAction(data);
      
      // Broadcast updated game state to all players in the room
      this.server.to(data.roomId).emit('game-state-updated', gameState);

      // Check if game ended
      if (gameState.status === 'finished') {
        this.server.to(data.roomId).emit('game-ended', {
          winner: gameState.players.find(p => p.cardsCount === 0)?.name || 'Unknown',
          gameState,
        });
      }

      this.logger.log(`Game action processed in room ${data.roomId}`);
    } catch (error) {
      this.logger.error('Error processing game action:', error);
      client.emit('error', { message: 'Failed to process game action' });
    }
  }

  private handlePlayerLeave(client: Socket, roomId: string) {
    // Remove from tracking maps
    this.playerRooms.delete(client.id);
    
    if (this.roomSockets.has(roomId)) {
      this.roomSockets.get(roomId)!.delete(client.id);
      if (this.roomSockets.get(roomId)!.size === 0) {
        this.roomSockets.delete(roomId);
      }
    }

    // Leave socket room
    client.leave(roomId);

    // Notify other players
    client.to(roomId).emit('player-left', {
      playerId: client.id,
    });
  }

  // Helper method to broadcast to all players in a room
  broadcastToRoom(roomId: string, event: string, data: any) {
    this.server.to(roomId).emit(event, data);
  }

  // Helper method to get all sockets in a room
  getRoomSockets(roomId: string): string[] {
    return Array.from(this.roomSockets.get(roomId) || []);
  }
}

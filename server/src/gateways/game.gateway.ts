import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
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
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('GameGateway');
  private playerRooms: Map<string, string> = new Map(); // socketId -> roomId
  private roomSockets: Map<string, Set<string>> = new Map(); // roomId -> Set of socketIds
  private connectionTimestamps: Map<string, number> = new Map(); // socketId -> lastSeen timestamp

  constructor(
    private roomService: RoomService,
    private gameService: GameService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('GameGateway initialized');

    // Clear any stale connections from previous server instances
    this.clearStaleConnections();

    // Set up connection timeout to handle stale connections
    this.setupConnectionTimeout();

    // Start periodic cleanup of stale connections
    this.startPeriodicCleanup();
  }

  private clearStaleConnections() {
    this.logger.log('Clearing stale connections...');

    // Clear all tracking maps
    this.playerRooms.clear();
    this.roomSockets.clear();
    this.connectionTimestamps.clear();

    // Disconnect all existing connections
    if (this.server) {
      this.server.disconnectSockets(true);
      this.logger.log('All existing connections cleared');
    }
  }

  private setupConnectionTimeout() {
    // Set up connection timeout and cleanup
    this.server.engine.generateId = (req) => {
      // Generate a new ID for each connection
      return Math.random().toString(36).substring(2, 15);
    };

    // Handle server restart - disconnect all clients
    this.server.on('disconnect', () => {
      this.logger.log('Server disconnecting all clients');
    });
  }

  // Method to manually clear all connections (can be called on server restart)
  public clearAllConnections() {
    this.logger.log('Manually clearing all connections...');
    this.clearStaleConnections();
  }

  private startPeriodicCleanup() {
    // Disabled aggressive cleanup - let connections stay alive during games
    // Only cleanup on actual disconnection events
    this.logger.log(
      'Periodic cleanup disabled - using event-based cleanup only',
    );
  }

  private cleanupStaleConnections() {
    const now = Date.now();
    const staleTimeout = 300000; // 5 minutes - much longer timeout

    for (const [socketId, lastSeen] of this.connectionTimestamps.entries()) {
      if (now - lastSeen > staleTimeout) {
        const roomId = this.playerRooms.get(socketId);

        // Check if the room has an active game before disconnecting
        if (roomId) {
          this.roomService.getRoom(roomId).then((room) => {
            if (room && room.currentGameStatus === 'playing') {
              this.logger.log(
                `Skipping cleanup of ${socketId} - game in progress`,
              );
              return;
            }

            // Only cleanup if game is not in progress
            this.logger.log(`Cleaning up stale connection: ${socketId}`);

            const socket = this.server.sockets.sockets.get(socketId);
            if (socket) {
              socket.disconnect(true);
            }

            // Clean up tracking data
            this.playerRooms.delete(socketId);
            this.connectionTimestamps.delete(socketId);
          });
        }
      }
    }
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // Track connection timestamp
    this.connectionTimestamps.set(client.id, Date.now());

    // Set up heartbeat for this connection
    this.setupHeartbeat(client);

    // Remove the aggressive timeout - let the heartbeat system handle stale connections
    // The periodic cleanup will handle truly stale connections
  }

  private setupHeartbeat(client: Socket) {
    // Simple connection tracking without aggressive ping-pong
    this.connectionTimestamps.set(client.id, Date.now());

    // Clean up on disconnect
    client.on('disconnect', () => {
      this.connectionTimestamps.delete(client.id);
      this.logger.log(`Cleaned up connection tracking for ${client.id}`);
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    const roomId = this.playerRooms.get(client.id);
    if (roomId) {
      // Check if the game is in progress before resetting player status
      this.roomService.getRoom(roomId).then((room) => {
        const player = room.players.find((p) => p.socketId === client.id);
        if (player) {
          // Only reset status if game is not in progress
          if (room.currentGameStatus === 'waiting') {
            this.roomService.updatePlayerStatus(roomId, player.name, 'waiting');
            this.logger.log(
              `Player ${player.name} disconnected during waiting - status reset to waiting`,
            );
          } else {
            // During active game, just mark as disconnected but keep game state
            this.logger.log(
              `Player ${player.name} disconnected during active game - keeping game state`,
            );
          }

          // Notify other players about the disconnection
          this.server.to(roomId).emit('player-disconnected', {
            playerId: player.id,
            playerName: player.name,
            gameInProgress: room.currentGameStatus === 'playing',
          });
        }
      });

      // Clean up connection tracking but don't reset game state
      this.cleanupConnectionTracking(client, roomId);
    }
  }

  private cleanupConnectionTracking(client: Socket, roomId: string) {
    // Remove from tracking maps
    this.playerRooms.delete(client.id);

    if (this.roomSockets.has(roomId)) {
      this.roomSockets.get(roomId)!.delete(client.id);
      if (this.roomSockets.get(roomId)!.size === 0) {
        this.roomSockets.delete(roomId);
      }
    }

    // Leave socket room - only if client has leave method (real Socket object)
    if (client && typeof client.leave === 'function') {
      client.leave(roomId);
    }

    this.logger.log(
      `Cleaned up connection tracking for ${client.id} in room ${roomId}`,
    );
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SocketEvents['join-room'],
  ) {
    try {
      const { roomId, playerName } = data;
      this.logger.log(
        `[JOIN-ROOM] Player ${playerName} attempting to join room ${roomId}`,
      );

      const result = await this.roomService.joinRoom({ roomId, playerName });
      this.logger.log(`[JOIN-ROOM] Join result: ${JSON.stringify(result)}`);

      if (result.success) {
        // Store player's room and socket
        this.playerRooms.set(client.id, roomId);

        if (!this.roomSockets.has(roomId)) {
          this.roomSockets.set(roomId, new Set());
        }
        this.roomSockets.get(roomId)!.add(client.id);

        // Join socket room for broadcasting
        client.join(roomId);

        // Update player's socketId and status in database
        await this.roomService.updatePlayerSocketId(
          roomId,
          playerName,
          client.id,
        );

        // Check if game is in progress - if so, don't reset status
        let room = await this.roomService.getRoom(roomId);
        if (room.currentGameStatus === 'playing') {
          // Player is reconnecting to an active game - keep their game status
          this.logger.log(
            `Player ${playerName} reconnected to active game - keeping game status`,
          );
        } else {
          // Game is not in progress - set to active
          await this.roomService.updatePlayerStatus(
            roomId,
            playerName,
            'active',
          );
          // Get updated room data
          room = await this.roomService.getRoom(roomId);
        }
        this.logger.log(
          `[JOIN-ROOM] Updated room data: ${JSON.stringify({
            id: room.id,
            players: room.players.map((p) => ({
              id: p.id,
              name: p.name,
              status: p.status,
              socketId: p.socketId,
            })),
            currentGameStatus: room.currentGameStatus,
            currentAttacker: room.currentAttacker,
            currentDefender: room.currentDefender,
          })}`,
        );

        // Emit success to the joining player
        client.emit('room-joined', {
          success: true,
          message: result.message,
          room,
        });

        // Notify all players in the room about the updated room state
        this.server.to(roomId).emit('room-updated', {
          room,
        });

        // Only notify other players for new joins, not rejoins
        const isRejoin = result.message === 'Rejoined room';
        if (!isRejoin) {
          client.to(roomId).emit('player-joined', {
            player: {
              id: client.id,
              name: playerName,
              status: 'active',
              role: 'player',
              cards: [],
              socketId: client.id,
            },
          });
        }

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
      this.logger.log(
        `[START-GAME] Player ${playerId} starting game in room ${roomId}`,
      );

      const room = await this.roomService.startGame(roomId, playerId);
      this.logger.log(
        `[START-GAME] Room after start: ${JSON.stringify({
          id: room?.id,
          currentGameStatus: room?.currentGameStatus,
          currentAttacker: room?.currentAttacker,
          currentDefender: room?.currentDefender,
          players:
            room?.players?.map((p) => ({
              id: p.id,
              name: p.name,
              status: p.status,
            })) || [],
        })}`,
      );

      const gameState = await this.gameService.getGameStateByRoomId(roomId);
      this.logger.log(
        `[START-GAME] Game state: ${JSON.stringify({
          roomId: gameState.roomId,
          status: gameState.status,
          currentAttacker: gameState.currentAttacker,
          currentDefender: gameState.currentDefender,
          players: gameState.players.map((p) => ({
            id: p.id,
            name: p.name,
            status: p.status,
            cardsCount: p.cardsCount,
          })),
        })}`,
      );

      // Get updated room data with players
      const updatedRoom = await this.roomService.getRoom(roomId);

      // Broadcast game started to all players in the room
      this.server.to(roomId).emit('game-started', {
        roomId,
        gameState,
        room: updatedRoom,
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
      this.logger.log(
        `[GAME-ACTION] Received action: ${JSON.stringify({
          type: data.type,
          roomId: data.roomId,
          playerId: data.playerId,
          card: data.card,
          defendingCard: data.defendingCard,
        })}`,
      );

      const gameState = await this.gameService.processGameAction(data);
      this.logger.log(
        `[GAME-ACTION] Game state after action: ${JSON.stringify({
          roomId: gameState.roomId,
          status: gameState.status,
          currentAttacker: gameState.currentAttacker,
          currentDefender: gameState.currentDefender,
          activeCards: gameState.activeCards,
          players: gameState.players.map((p) => ({
            id: p.id,
            name: p.name,
            status: p.status,
            cardsCount: p.cardsCount,
          })),
        })}`,
      );

      // Broadcast updated game state to all players in the room
      this.server.to(data.roomId).emit('game-state-updated', gameState);

      // Check if game ended
      if (gameState.status === 'finished') {
        this.logger.log(`[GAME-ACTION] Game finished in room ${data.roomId}`);

        // Find the winner (player with no cards or the last remaining player)
        const winner =
          gameState.players.find((p) => p.cardsCount === 0)?.name ||
          (gameState.players.length === 1
            ? gameState.players[0].name
            : 'Unknown');

        this.server.to(data.roomId).emit('game-ended', {
          winner,
          gameState,
        });
      }

      this.logger.log(
        `[GAME-ACTION] Action processed successfully in room ${data.roomId}`,
      );
    } catch (error) {
      this.logger.error(
        `[GAME-ACTION] Error processing game action: ${error.message}`,
      );
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

    // Leave socket room - only if client has leave method (real Socket object)
    if (client && typeof client.leave === 'function') {
      client.leave(roomId);
    }

    // Notify other players - only if client has to method (real Socket object)
    if (client && typeof client.to === 'function') {
      client.to(roomId).emit('player-left', {
        playerId: client.id,
      });
    } else {
      // If it's a fake client object, broadcast to the room directly
      this.server.to(roomId).emit('player-left', {
        playerId: client.id,
      });
    }
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

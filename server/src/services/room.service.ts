import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Room } from '../entities/room.entity';
import { Player } from '../entities/player.entity';
import { CreateRoomRequest, JoinRoomRequest } from '../types/game.types';
import { CardUtils } from '../utils/card.utils';

@Injectable()
export class RoomService {
  constructor(
    @InjectModel(Room)
    private roomModel: typeof Room,
    @InjectModel(Player)
    private playerModel: typeof Player,
  ) {}

  async createRoom(createRoomRequest: CreateRoomRequest): Promise<Room> {
    const { name, playerLimit, playerNames, owner } = createRoomRequest;

    // Validate player limit
    if (playerLimit < 2 || playerLimit > 6) {
      throw new BadRequestException('Player limit must be between 2 and 6');
    }

    // Validate player names
    if (playerNames.length > playerLimit) {
      throw new BadRequestException('Too many player names for the room limit');
    }

    // Create room
    const room = await this.roomModel.create({
      name,
      owner,
      playerLimit,
      playerNames,
      deck: CardUtils.createDeck(),
      activeCards: [],
      currentGameStatus: 'waiting',
    } as any);

    // Create players for the room
    for (const playerName of playerNames) {
      await this.playerModel.create({
        name: playerName,
        roomId: room.id,
        role: playerName === owner ? 'owner' : 'player',
        cards: [],
        status: 'waiting',
      } as any);
    }

    return room;
  }

  async joinRoom(
    joinRoomRequest: JoinRoomRequest,
  ): Promise<{ success: boolean; message: string; room?: Room }> {
    const { roomId, playerName } = joinRoomRequest;

    const room = await this.roomModel.findByPk(roomId, {
      include: [Player],
    });

    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    if (room.currentGameStatus !== 'waiting') {
      return { success: false, message: 'Game is already in progress' };
    }

    if (room.playerNames.includes(playerName)) {
      // Check if player already exists in the room
      const existingPlayer = await this.playerModel.findOne({
        where: { roomId, name: playerName },
      });

      if (existingPlayer) {
        return { success: false, message: 'Player already in room' };
      }

      // Add player to room
      await this.playerModel.create({
        name: playerName,
        roomId: room.id,
        role: 'player',
        cards: [],
        status: 'waiting',
      } as any);

      return { success: true, message: 'Successfully joined room', room };
    } else {
      return { success: false, message: 'Player name not in allowed list' };
    }
  }

  async getRoom(roomId: string): Promise<Room> {
    const room = await this.roomModel.findByPk(roomId, {
      include: [Player],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }

  async getAllRooms(): Promise<Room[]> {
    return this.roomModel.findAll({
      include: [Player],
      order: [['createdAt', 'DESC']],
    });
  }

  async updateRoom(roomId: string, updateData: Partial<Room>): Promise<Room> {
    const room = await this.roomModel.findByPk(roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    await room.update(updateData);
    return room;
  }

  async deleteRoom(roomId: string): Promise<void> {
    const room = await this.roomModel.findByPk(roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Delete all players in the room
    await this.playerModel.destroy({
      where: { roomId },
    });

    // Delete the room
    await room.destroy();
  }

  async startGame(roomId: string, ownerId: string): Promise<Room> {
    const room = await this.roomModel.findByPk(roomId, {
      include: [Player],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Check if the requester is the owner
    const owner = room.players.find(p => p.id === ownerId);
    if (!owner || owner.role !== 'owner') {
      throw new BadRequestException('Only room owner can start the game');
    }

    if (room.currentGameStatus !== 'waiting') {
      throw new BadRequestException('Game is already in progress');
    }

    if (room.players.length < 2) {
      throw new BadRequestException(
        'Need at least 2 players to start the game',
      );
    }

    // Deal cards to players
    const deck = CardUtils.createDeck();
    const trumpSuit = deck[deck.length - 1].suit;
    const hands = CardUtils.dealCards(deck, room.players.length);

    console.log('Dealing cards:', {
      playersCount: room.players.length,
      handsPerPlayer: hands.map(hand => hand.length),
      trumpSuit
    });

    // Update players with their cards
    for (let i = 0; i < room.players.length; i++) {
      await room.players[i].update({
        cards: hands[i],
        status: i === 0 ? 'attacker' : 'waiting',
      });
      console.log(`Player ${i} (${room.players[i].name}) got cards:`, hands[i].map(card => card.shortName));
    }

    // Update room
    await room.update({
      currentGameStatus: 'playing',
      currentAttacker: room.players[0].id,
      currentDefender: room.players[1]?.id,
      deck: deck.slice(hands.reduce((sum, hand) => sum + hand.length, 0)),
      trumpSuit,
    });

    // Refresh room with updated players data
    const updatedRoom = await this.roomModel.findByPk(roomId, {
      include: [
        {
          model: Player,
          as: 'players'
        }
      ],
    });

    // Debug: Check if players and cards are loaded
    console.log('Updated room players:', updatedRoom?.players?.map(p => ({
      id: p.id,
      name: p.name,
      cardsCount: p.cards?.length || 0,
      cards: p.cards
    })));

    return updatedRoom;
  }

  // Debug method to check database structure
  async debugDatabaseStructure(roomId: string) {
    console.log('=== DATABASE DEBUG ===');
    
    // Check if room exists
    const room = await this.roomModel.findByPk(roomId);
    console.log('Room exists:', !!room);
    if (room) {
      console.log('Room data:', {
        id: room.id,
        name: room.name,
        currentGameStatus: room.currentGameStatus,
        trumpSuit: room.trumpSuit
      });
    }

    // Check players directly
    const players = await this.playerModel.findAll({
      where: { roomId: roomId }
    });
    console.log('Players found:', players.length);
    players.forEach((player, index) => {
      console.log(`Player ${index}:`, {
        id: player.id,
        name: player.name,
        cardsType: typeof player.cards,
        cardsLength: Array.isArray(player.cards) ? player.cards.length : 'not array',
        cards: player.cards
      });
    });

    // Check with relationship
    const roomWithPlayers = await this.roomModel.findByPk(roomId, {
      include: [
        {
          model: Player,
          as: 'players'
        }
      ],
    });
    console.log('Room with players relationship:', {
      hasPlayers: !!roomWithPlayers?.players,
      playersCount: roomWithPlayers?.players?.length || 0
    });

    console.log('=== END DEBUG ===');
  }
}

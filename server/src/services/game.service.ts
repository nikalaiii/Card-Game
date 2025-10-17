import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Room } from '../entities/room.entity';
import { Player } from '../entities/player.entity';
import { GameAction, GameState } from '../types/game.types';
import { CardUtils } from '../utils/card.utils';
import { GameUtils } from '../utils/game.utils';

@Injectable()
export class GameService {
  constructor(
    @InjectModel(Room)
    private roomModel: typeof Room,
    @InjectModel(Player)
    private playerModel: typeof Player,
  ) {}

  async processGameAction(action: GameAction): Promise<GameState> {
    const room = await this.roomModel.findByPk(action.roomId, {
      include: [Player],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.currentGameStatus !== 'playing') {
      throw new BadRequestException('Game is not in progress');
    }

    const player = room.players.find((p) => p.id === action.playerId);
    if (!player) {
      throw new NotFoundException('Player not found in room');
    }

    // Validate the action
    const validation = GameUtils.validateGameAction(
      action.type,
      player.cards,
      room.activeCards,
      action.card,
      action.defendingCard,
      room.trumpSuit,
    );

    if (!validation.valid) {
      throw new BadRequestException(validation.message);
    }

    // Process the action
    switch (action.type) {
      case 'attack':
        return this.handleAttack(room, player, action.card!);
      case 'defend':
        return this.handleDefend(
          room,
          player,
          action.card!,
          action.defendingCard!,
        );
      case 'pass':
        return this.handlePass(room, player);
      case 'take_cards':
        return this.handleTakeCards(room, player);
      case 'throw_cards':
        return this.handleThrowCards(room, player, action.card!);
      default:
        throw new BadRequestException('Invalid action type');
    }
  }

  private async handleAttack(
    room: Room,
    player: Player,
    attackingCard: any,
  ): Promise<GameState> {
    if (player.id !== room.currentAttacker) {
      throw new BadRequestException('Not your turn to attack');
    }

    // Remove card from player's hand
    const updatedCards = player.cards.filter(
      (card) => card.shortName !== attackingCard.shortName,
    );
    await player.update({ cards: updatedCards });

    // Add card to active cards
    const newActiveCard = { attackingCard, defendingCard: null };
    const updatedActiveCards = [...room.activeCards, newActiveCard];

    await room.update({ activeCards: updatedActiveCards });

    return this.getGameState(room);
  }

  private async handleDefend(
    room: Room,
    player: Player,
    attackingCard: any,
    defendingCard: any,
  ): Promise<GameState> {
    if (player.id !== room.currentDefender) {
      throw new BadRequestException('Not your turn to defend');
    }

    // Find the attacking card in active cards
    const cardPairIndex = room.activeCards.findIndex(
      (pair) =>
        pair.attackingCard.shortName === attackingCard.shortName &&
        !pair.defendingCard,
    );

    if (cardPairIndex === -1) {
      throw new BadRequestException(
        'Attacking card not found or already defended',
      );
    }

    // Remove defending card from player's hand
    const updatedCards = player.cards.filter(
      (card) => card.shortName !== defendingCard.shortName,
    );
    await player.update({ cards: updatedCards });

    // Update the card pair with defending card
    const updatedActiveCards = [...room.activeCards];
    updatedActiveCards[cardPairIndex].defendingCard = defendingCard;

    await room.update({ activeCards: updatedActiveCards });

    return this.getGameState(room);
  }

  private async handlePass(room: Room, player: Player): Promise<GameState> {
    if (player.id !== room.currentAttacker) {
      throw new BadRequestException('Not your turn to pass');
    }

    // Check if all active cards are defended
    const allDefended = room.activeCards.every((pair) => pair.defendingCard);

    if (!allDefended) {
      throw new BadRequestException('Cannot pass - not all cards are defended');
    }

    // Clear active cards and move to next round
    await room.update({ activeCards: [] });

    // Check if game should continue
    const winner = GameUtils.checkGameEnd(
      room.players.map((p) => ({
        cards: p.cards,
        status: p.status,
        name: p.name,
      })),
    );
    if (winner) {
      await room.update({ currentGameStatus: 'finished' });
      return this.getGameState(room);
    }

    // Move to next attacker/defender
    const currentAttackerIndex = room.players.findIndex(
      (p) => p.id === room.currentAttacker,
    );
    const nextAttackerIndex = GameUtils.getNextPlayer(
      currentAttackerIndex,
      room.players.length,
    );
    const nextDefenderIndex = GameUtils.getNextPlayer(
      nextAttackerIndex,
      room.players.length,
    );

    await room.update({
      currentAttacker: room.players[nextAttackerIndex].id,
      currentDefender: room.players[nextDefenderIndex].id,
    });

    return this.getGameState(room);
  }

  private async handleTakeCards(
    room: Room,
    player: Player,
  ): Promise<GameState> {
    if (player.id !== room.currentDefender) {
      throw new BadRequestException('Not your turn to take cards');
    }

    // Add all active cards to player's hand
    const allActiveCards = room.activeCards.flatMap((pair) => [
      pair.attackingCard,
      ...(pair.defendingCard ? [pair.defendingCard] : []),
    ]);

    const updatedCards = [...player.cards, ...allActiveCards];
    await player.update({ cards: updatedCards });

    // Clear active cards
    await room.update({ activeCards: [] });

    // Move to next attacker/defender
    const currentDefenderIndex = room.players.findIndex(
      (p) => p.id === room.currentDefender,
    );
    const nextAttackerIndex = GameUtils.getNextPlayer(
      currentDefenderIndex,
      room.players.length,
    );
    const nextDefenderIndex = GameUtils.getNextPlayer(
      nextAttackerIndex,
      room.players.length,
    );

    await room.update({
      currentAttacker: room.players[nextAttackerIndex].id,
      currentDefender: room.players[nextDefenderIndex].id,
    });

    return this.getGameState(room);
  }

  private async handleThrowCards(
    room: Room,
    player: Player,
    throwingCard: any,
  ): Promise<GameState> {
    // Check if player can throw this card
    if (
      !GameUtils.canPlayerThrowCards([throwingCard], room.activeCards).length
    ) {
      throw new BadRequestException('Cannot throw this card');
    }

    // Remove card from player's hand
    const updatedCards = player.cards.filter(
      (card) => card.shortName !== throwingCard.shortName,
    );
    await player.update({ cards: updatedCards });

    // Add card to active cards as attacking card
    const newActiveCard = { attackingCard: throwingCard, defendingCard: null };
    const updatedActiveCards = [...room.activeCards, newActiveCard];

    await room.update({ activeCards: updatedActiveCards });

    return this.getGameState(room);
  }

  private getGameState(room: Room): GameState {
    return {
      roomId: room.id,
      status: room.currentGameStatus,
      currentAttacker: room.currentAttacker,
      currentDefender: room.currentDefender,
      activeCards: room.activeCards || [],
      deck: room.deck || [],
      trumpSuit: room.trumpSuit,
      players: (room.players || []).map((player) => ({
        id: player.id,
        name: player.name,
        status: player.status,
        cards: player.cards || [],
        cardsCount: (player.cards || []).length,
      })),
    };
  }

  async getGameStateByRoomId(roomId: string): Promise<GameState> {
    const room = await this.roomModel.findByPk(roomId, {
      include: [
        {
          model: Player,
          as: 'players'
        }
      ],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // If players are not loaded via relationship, fetch them manually
    if (!room.players || room.players.length === 0) {
      const players = await this.playerModel.findAll({
        where: { roomId: roomId }
      });
      room.players = players;
    }

    // Debug logging to understand the room structure
    console.log('Room found:', {
      id: room.id,
      playersCount: room.players?.length || 0,
      players: room.players ? room.players.map(p => ({ id: p.id, name: p.name })) : 'undefined'
    });

    return this.getGameState(room);
  }
}

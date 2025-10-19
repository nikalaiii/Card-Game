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
    console.log(`[GAME-SERVICE] Processing action: ${JSON.stringify({
      type: action.type,
      roomId: action.roomId,
      playerId: action.playerId,
      card: action.card,
      defendingCard: action.defendingCard
    })}`);

    const room = await this.roomModel.findByPk(action.roomId, {
      include: [Player],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    console.log(`[GAME-SERVICE] Room before action: ${JSON.stringify({
      id: room.id,
      currentGameStatus: room.currentGameStatus,
      currentAttacker: room.currentAttacker,
      currentDefender: room.currentDefender,
      players: room.players.map(p => ({ id: p.id, name: p.name, status: p.status, cardsCount: p.cards.length }))
    })}`);

    if (room.currentGameStatus !== 'playing') {
      throw new BadRequestException('Game is not in progress');
    }

    const player = room.players.find((p) => p.id === action.playerId);
    if (!player) {
      throw new NotFoundException('Player not found in room');
    }

    console.log(`[GAME-SERVICE] Player performing action: ${JSON.stringify({
      id: player.id,
      name: player.name,
      status: player.status,
      cardsCount: player.cards.length
    })}`);

    // Deal cards to players before processing action
    await this.dealCardsToPlayers(room);
    
    // Get fresh room data again after dealing cards
    const freshRoom = await this.roomModel.findByPk(action.roomId, {
      include: [Player],
    });
    
    if (!freshRoom) {
      throw new NotFoundException('Room not found after dealing cards');
    }
    
    const freshPlayer = freshRoom.players.find((p) => p.id === action.playerId);
    if (!freshPlayer) {
      throw new NotFoundException('Player not found after dealing cards');
    }

    // Validate the action
    const validation = GameUtils.validateGameAction(
      action.type,
      freshPlayer.cards,
      freshRoom.activeCards,
      action.card,
      action.defendingCard,
      freshRoom.trumpSuit,
    );

    if (!validation.valid) {
      throw new BadRequestException(validation.message);
    }

    console.log(`[GAME-SERVICE] Processing ${action.type} action for player ${freshPlayer.name}`);
    
    // Process the action
    let result: GameState;
    switch (action.type) {
      case 'attack':
        result = await this.handleAttack(freshRoom, freshPlayer, action.card!);
        break;
      case 'defend':
        result = await this.handleDefend(
          freshRoom,
          freshPlayer,
          action.card!,
          action.defendingCard!,
        );
        break;
      case 'pass':
        result = await this.handlePass(freshRoom, freshPlayer);
        break;
      case 'take_cards':
        result = await this.handleTakeCards(freshRoom, freshPlayer);
        break;
      case 'throw_cards':
        result = await this.handleThrowCards(freshRoom, freshPlayer, action.card!);
        break;
      default:
        throw new BadRequestException('Invalid action type');
    }

    console.log(`[GAME-SERVICE] Action result: ${JSON.stringify({
      roomId: result.roomId,
      status: result.status,
      currentAttacker: result.currentAttacker,
      currentDefender: result.currentDefender,
      players: result.players.map(p => ({ id: p.id, name: p.name, status: p.status, cardsCount: p.cardsCount }))
    })}`);

    return result;
  }

  private async handleAttack(
    room: Room,
    player: Player,
    attackingCard: any,
  ): Promise<GameState> {
    console.log(`[HANDLE-ATTACK] Player ${player.name} attacking with ${attackingCard.shortName}`);
    console.log(`[HANDLE-ATTACK] Current attacker: ${room.currentAttacker}, Player ID: ${player.id}`);
    
    if (player.id !== room.currentAttacker) {
      throw new BadRequestException('Not your turn to attack');
    }

    // Remove card from player's hand
    const updatedCards = player.cards.filter(
      (card) => card.shortName !== attackingCard.shortName,
    );
    await player.update({ cards: updatedCards });
    console.log(`[HANDLE-ATTACK] Player ${player.name} cards after attack: ${updatedCards.length}`);

    // Add card to active cards
    const newActiveCard = { attackingCard, defendingCard: null };
    const updatedActiveCards = [...room.activeCards, newActiveCard];

    await room.update({ activeCards: updatedActiveCards });
    console.log(`[HANDLE-ATTACK] Active cards after attack: ${updatedActiveCards.length}`);

    // Force reload the room instance to get fresh data
    await room.reload();
    console.log(`[HANDLE-ATTACK] Room after reload: ${JSON.stringify({
      activeCards: room.activeCards,
      id: room.id
    })}`);

    // Get fresh room data from database to ensure we have the latest state
    const freshRoom = await this.roomModel.findByPk(room.id, {
      include: [Player],
    });

    if (!freshRoom) {
      throw new NotFoundException('Room not found after attack action');
    }

    console.log(`[HANDLE-ATTACK] Fresh room data: ${JSON.stringify({
      activeCards: freshRoom.activeCards,
      currentAttacker: freshRoom.currentAttacker,
      currentDefender: freshRoom.currentDefender
    })}`);
    
    console.log(`[HANDLE-ATTACK] Active cards details: ${JSON.stringify(
      freshRoom.activeCards.map((pair, index) => ({
        index,
        attackingCard: pair.attackingCard.shortName,
        defendingCard: pair.defendingCard?.shortName || null,
        isDefended: !!pair.defendingCard
      }))
    )}`);

    // Check if game should end after attack
    const winner = GameUtils.checkGameEnd(
      freshRoom.players.map((p) => ({
        cards: p.cards,
        status: p.status,
        name: p.name,
      })),
    );
    if (winner) {
      await freshRoom.update({ currentGameStatus: 'finished' });
    }

    const gameState = this.getGameState(freshRoom);
    console.log(`[HANDLE-ATTACK] Game state after attack: ${JSON.stringify({
      currentAttacker: gameState.currentAttacker,
      currentDefender: gameState.currentDefender,
      players: gameState.players.map(p => ({ id: p.id, name: p.name, status: p.status, cardsCount: p.cardsCount }))
    })}`);

    return gameState;
  }

  private async handleDefend(
    room: Room,
    player: Player,
    attackingCard: any,
    defendingCard: any,
  ): Promise<GameState> {
    console.log(`[HANDLE-DEFEND] Player ${player.name} defending ${attackingCard.shortName} with ${defendingCard.shortName}`);
    console.log(`[HANDLE-DEFEND] Current defender: ${room.currentDefender}, Player ID: ${player.id}`);
    
    if (player.id !== room.currentDefender) {
      throw new BadRequestException('Not your turn to defend');
    }

    // Find the attacking card in active cards
    console.log(`[HANDLE-DEFEND] Looking for attacking card: ${attackingCard.shortName}`);
    console.log(`[HANDLE-DEFEND] Current active cards: ${JSON.stringify(
      room.activeCards.map((pair, index) => ({
        index,
        attackingCard: pair.attackingCard.shortName,
        defendingCard: pair.defendingCard?.shortName || null,
        isDefended: !!pair.defendingCard
      }))
    )}`);

    const cardPairIndex = room.activeCards.findIndex(
      (pair) =>
        pair.attackingCard.shortName === attackingCard.shortName &&
        !pair.defendingCard,
    );

    console.log(`[HANDLE-DEFEND] Found card pair at index: ${cardPairIndex}`);

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
    console.log(`[HANDLE-DEFEND] Player ${player.name} cards after defend: ${updatedCards.length}`);

    // Update the card pair with defending card
    const updatedActiveCards = [...room.activeCards];
    updatedActiveCards[cardPairIndex].defendingCard = defendingCard;

    console.log(`[HANDLE-DEFEND] Before database update - updatedActiveCards: ${JSON.stringify(
      updatedActiveCards.map((pair, index) => ({
        index,
        attackingCard: pair.attackingCard.shortName,
        defendingCard: pair.defendingCard?.shortName || null,
        isDefended: !!pair.defendingCard
      }))
    )}`);

    // Update the room with the modified activeCards array
    const updateResult = await this.roomModel.update(
      { activeCards: updatedActiveCards },
      { where: { id: room.id } }
    );
    
    console.log(`[HANDLE-DEFEND] Database update result: ${JSON.stringify(updateResult)}`);
    
    // Update the defender's status to 'defender'
    await player.update({ status: 'defender' });
    console.log(`[HANDLE-DEFEND] Updated defender status to 'defender' for player ${player.name}`);
    
    // Force reload the room instance to get fresh data
    await room.reload();
    
    console.log(`[HANDLE-DEFEND] Room after reload: ${JSON.stringify({
      activeCards: room.activeCards,
      id: room.id
    })}`);
    console.log(`[HANDLE-DEFEND] Active cards after defend: ${updatedActiveCards.length}`);

    // Get fresh room data from database to ensure we have the latest state
    const freshRoom = await this.roomModel.findByPk(room.id, {
      include: [Player],
    });

    if (!freshRoom) {
      throw new NotFoundException('Room not found after defend action');
    }

    console.log(`[HANDLE-DEFEND] Database verification - fresh room activeCards: ${JSON.stringify(
      freshRoom.activeCards.map((pair, index) => ({
        index,
        attackingCard: pair.attackingCard.shortName,
        defendingCard: pair.defendingCard?.shortName || null,
        isDefended: !!pair.defendingCard
      }))
    )}`);

    console.log(`[HANDLE-DEFEND] Fresh room data: ${JSON.stringify({
      activeCards: freshRoom.activeCards,
      currentAttacker: freshRoom.currentAttacker,
      currentDefender: freshRoom.currentDefender
    })}`);
    
    console.log(`[HANDLE-DEFEND] Active cards details: ${JSON.stringify(
      freshRoom.activeCards.map((pair, index) => ({
        index,
        attackingCard: pair.attackingCard.shortName,
        defendingCard: pair.defendingCard?.shortName || null,
        isDefended: !!pair.defendingCard
      }))
    )}`);

    // Check if game should end after defend
    const winner = GameUtils.checkGameEnd(
      freshRoom.players.map((p) => ({
        cards: p.cards,
        status: p.status,
        name: p.name,
      })),
    );
    if (winner) {
      await freshRoom.update({ currentGameStatus: 'finished' });
    }

    const gameState = this.getGameState(freshRoom);
    console.log(`[HANDLE-DEFEND] Game state after defend: ${JSON.stringify({
      currentAttacker: gameState.currentAttacker,
      currentDefender: gameState.currentDefender,
      players: gameState.players.map(p => ({ id: p.id, name: p.name, status: p.status, cardsCount: p.cardsCount }))
    })}`);

    return gameState;
  }

  private async handlePass(room: Room, player: Player): Promise<GameState> {
    console.log(`[HANDLE-PASS] Player ${player.name} attempting to pass`);
    
    if (player.id !== room.currentAttacker) {
      throw new BadRequestException('Not your turn to pass');
    }

    // Check if all active cards are defended
    const allDefended = room.activeCards.every((pair) => pair.defendingCard);

    console.log(`[HANDLE-PASS] All cards defended: ${allDefended}, Active cards count: ${room.activeCards.length}`);

    if (!allDefended) {
      throw new BadRequestException('Cannot pass - not all cards are defended');
    }

    console.log(`[HANDLE-PASS] Clearing active cards`);
    // Clear active cards and deal cards to players
    await room.update({ activeCards: [] });

    // Deal cards to players who have fewer than 6 cards
    await this.dealCardsToPlayers(room);

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

    // Update player statuses
    await room.players[nextAttackerIndex].update({ status: 'attacker' });
    await room.players[nextDefenderIndex].update({ status: 'defender' });
    
    // Set other players to 'active' status
    for (const player of room.players) {
      if (player.id !== room.players[nextAttackerIndex].id && player.id !== room.players[nextDefenderIndex].id) {
        await player.update({ status: 'active' });
      }
    }

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

    // Clear active cards and deal cards to players
    await room.update({ activeCards: [] });

    // Deal cards to players who have fewer than 6 cards
    await this.dealCardsToPlayers(room);

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

    // Update player statuses
    await room.players[nextAttackerIndex].update({ status: 'attacker' });
    await room.players[nextDefenderIndex].update({ status: 'defender' });
    
    // Set other players to 'active' status
    for (const player of room.players) {
      if (player.id !== room.players[nextAttackerIndex].id && player.id !== room.players[nextDefenderIndex].id) {
        await player.update({ status: 'active' });
      }
    }

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

  private async dealCardsToPlayers(room: Room): Promise<void> {
    // Get fresh room data with players
    const freshRoom = await this.roomModel.findByPk(room.id, {
      include: [Player],
    });

    if (!freshRoom) return;

    let deck = [...(freshRoom.deck || [])]; // Create a copy of the deck
    
    // Deal cards to players who have fewer than 6 cards
    for (const player of freshRoom.players) {
      while (player.cards.length < 6 && deck.length > 0) {
        const card = deck.shift(); // Take first card from deck
        if (card) {
          player.cards.push(card);
        }
      }
      
      // Update player with new cards
      await player.update({ cards: player.cards });
    }

    // Update room with remaining deck
    await freshRoom.update({ deck });
    
    console.log('Dealt cards to players. Remaining deck size:', deck.length);
  }

  private getGameState(room: Room): GameState {
    console.log(`[GET-GAME-STATE] Room data: ${JSON.stringify({
      id: room.id,
      currentGameStatus: room.currentGameStatus,
      currentAttacker: room.currentAttacker,
      currentDefender: room.currentDefender,
      activeCards: room.activeCards,
      players: room.players.map(p => ({ id: p.id, name: p.name, status: p.status, cardsCount: p.cards.length }))
    })}`);

    const gameState = {
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

    console.log(`[GET-GAME-STATE] Generated GameState: ${JSON.stringify({
      roomId: gameState.roomId,
      status: gameState.status,
      currentAttacker: gameState.currentAttacker,
      currentDefender: gameState.currentDefender,
      activeCards: gameState.activeCards,
      playersCount: gameState.players.length,
      players: gameState.players.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        cardsCount: p.cardsCount,
        cards: p.cards
      }))
    })}`);
    
    console.log(`[GET-GAME-STATE] Active cards being sent to frontend: ${JSON.stringify(
      gameState.activeCards.map((pair, index) => ({
        index,
        attackingCard: pair.attackingCard.shortName,
        defendingCard: pair.defendingCard?.shortName || null,
        isDefended: !!pair.defendingCard
      }))
    )}`);

    return gameState;
  }

  async getGameStateByRoomId(roomId: string): Promise<GameState> {
    const room = await this.roomModel.findByPk(roomId, {
      include: [
        {
          model: Player,
          as: 'players',
        },
      ],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // If players are not loaded via relationship, fetch them manually
    if (!room.players || room.players.length === 0) {
      const players = await this.playerModel.findAll({
        where: { roomId: roomId },
      });
      room.players = players;
    }

    // Debug logging to understand the room structure
    console.log('Room found:', {
      id: room.id,
      playersCount: room.players?.length || 0,
      players: room.players
        ? room.players.map((p) => ({ 
            id: p.id, 
            name: p.name, 
            cardsCount: p.cards?.length || 0,
            cards: p.cards
          }))
        : 'undefined',
    });

    return this.getGameState(room);
  }
}

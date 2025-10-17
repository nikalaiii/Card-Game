import { Card, CardOnTable, GameStatus, PlayerStatus } from '../types/card.types';
import { CardUtils } from './card.utils';

export class GameUtils {
  static determineTrumpSuit(deck: Card[]): string {
    // The trump suit is determined by the last card in the deck
    if (deck.length === 0) return 'S'; // Default to Spades
    return deck[deck.length - 1].suit;
  }

  static getNextPlayer(currentPlayerIndex: number, totalPlayers: number): number {
    return (currentPlayerIndex + 1) % totalPlayers;
  }

  static getPreviousPlayer(currentPlayerIndex: number, totalPlayers: number): number {
    return currentPlayerIndex === 0 ? totalPlayers - 1 : currentPlayerIndex - 1;
  }

  static canPlayerAttack(playerCards: Card[], activeCards: CardOnTable[]): boolean {
    if (activeCards.length === 0) return true; // First attack
    
    // Player can attack if they have cards matching ranks of active cards
    for (const cardPair of activeCards) {
      for (const playerCard of playerCards) {
        if (playerCard.rank === cardPair.attackingCard.rank) {
          return true;
        }
        if (cardPair.defendingCard && playerCard.rank === cardPair.defendingCard.rank) {
          return true;
        }
      }
    }
    return false;
  }

  static canPlayerDefend(playerCards: Card[], attackingCard: Card, trumpSuit?: string): Card[] {
    const possibleDefendingCards: Card[] = [];
    
    for (const playerCard of playerCards) {
      if (CardUtils.canDefend(attackingCard, playerCard, trumpSuit as any)) {
        possibleDefendingCards.push(playerCard);
      }
    }
    
    return possibleDefendingCards;
  }

  static canPlayerThrowCards(playerCards: Card[], activeCards: CardOnTable[]): Card[] {
    const possibleThrowingCards: Card[] = [];
    
    for (const playerCard of playerCards) {
      if (CardUtils.canThrowCard(playerCard, activeCards)) {
        possibleThrowingCards.push(playerCard);
      }
    }
    
    return possibleThrowingCards;
  }

  static checkWinCondition(playerCards: Card[]): boolean {
    return playerCards.length === 0;
  }

  static checkGameEnd(players: { cards: Card[]; status: PlayerStatus; name: string }[]): string | null {
    const activePlayers = players.filter(p => p.status !== 'eliminated');
    
    if (activePlayers.length === 1) {
      return activePlayers[0].name; // Winner is the last player with cards
    }
    
    return null;
  }

  static calculateHandValue(cards: Card[], trumpSuit?: string): number {
    let value = 0;
    
    for (const card of cards) {
      let cardValue = CardUtils.getCardValue(card);
      
      // Trump cards are worth more
      if (trumpSuit && card.suit === trumpSuit) {
        cardValue += 20;
      }
      
      value += cardValue;
    }
    
    return value;
  }

  static getBestDefendingCard(possibleCards: Card[], attackingCard: Card, trumpSuit?: string): Card | null {
    if (possibleCards.length === 0) return null;
    
    // Sort by value, preferring trump cards
    const sortedCards = possibleCards.sort((a, b) => {
      const aValue = CardUtils.getCardValue(a) + (a.suit === trumpSuit ? 20 : 0);
      const bValue = CardUtils.getCardValue(b) + (b.suit === trumpSuit ? 20 : 0);
      return aValue - bValue;
    });
    
    return sortedCards[0];
  }

  static validateGameAction(
    action: 'attack' | 'defend' | 'pass' | 'take_cards' | 'throw_cards',
    playerCards: Card[],
    activeCards: CardOnTable[],
    attackingCard?: Card,
    defendingCard?: Card,
    trumpSuit?: string
  ): { valid: boolean; message?: string } {
    switch (action) {
      case 'attack':
        if (!attackingCard) {
          return { valid: false, message: 'No attacking card provided' };
        }
        if (!playerCards.some(card => card.shortName === attackingCard.shortName)) {
          return { valid: false, message: 'Player does not have this card' };
        }
        if (activeCards.length > 0 && !CardUtils.canThrowCard(attackingCard, activeCards)) {
          return { valid: false, message: 'Cannot attack with this card' };
        }
        break;
        
      case 'defend':
        if (!attackingCard || !defendingCard) {
          return { valid: false, message: 'Both attacking and defending cards required' };
        }
        if (!playerCards.some(card => card.shortName === defendingCard.shortName)) {
          return { valid: false, message: 'Player does not have this card' };
        }
        if (!CardUtils.canDefend(attackingCard, defendingCard, trumpSuit as any)) {
          return { valid: false, message: 'Cannot defend with this card' };
        }
        break;
        
      case 'throw_cards':
        if (!attackingCard) {
          return { valid: false, message: 'No attacking card provided' };
        }
        if (!playerCards.some(card => card.shortName === attackingCard.shortName)) {
          return { valid: false, message: 'Player does not have this card' };
        }
        if (!CardUtils.canThrowCard(attackingCard, activeCards)) {
          return { valid: false, message: 'Cannot throw this card' };
        }
        break;
    }
    
    return { valid: true };
  }
}

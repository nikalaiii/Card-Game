import { Card, CardSuit, CardRank } from '../types/card.types';

export class CardUtils {
  private static readonly SUITS: CardSuit[] = ['S', 'H', 'D', 'C'];
  private static readonly RANKS: CardRank[] = ['7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

  static createDeck(): Card[] {
    const deck: Card[] = [];
    
    for (const suit of this.SUITS) {
      for (const rank of this.RANKS) {
        deck.push({
          suit,
          rank,
          shortName: `${rank}${suit}`
        });
      }
    }
    
    return this.shuffleDeck(deck);
  }

  static shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static dealCards(deck: Card[], playerCount: number): Card[][] {
    const hands: Card[][] = Array(playerCount).fill(null).map(() => []);
    let cardIndex = 0;
    
    // Deal 6 cards to each player
    for (let round = 0; round < 6; round++) {
      for (let player = 0; player < playerCount; player++) {
        if (cardIndex < deck.length) {
          hands[player].push(deck[cardIndex]);
          cardIndex++;
        }
      }
    }
    
    return hands;
  }

  static canDefend(attackingCard: Card, defendingCard: Card, trumpSuit?: CardSuit): boolean {
    // If defending card is trump and attacking card is not trump
    if (defendingCard.suit === trumpSuit && attackingCard.suit !== trumpSuit) {
      return true;
    }
    
    // If attacking card is trump and defending card is trump
    if (attackingCard.suit === trumpSuit && defendingCard.suit === trumpSuit) {
      return this.getCardValue(defendingCard) > this.getCardValue(attackingCard);
    }
    
    // If both cards are same suit
    if (attackingCard.suit === defendingCard.suit) {
      return this.getCardValue(defendingCard) > this.getCardValue(attackingCard);
    }
    
    return false;
  }

  static canThrowCard(throwingCard: Card, activeCards: { attackingCard: Card; defendingCard?: Card }[]): boolean {
    // Can throw card if it matches rank of any attacking or defending card
    for (const cardPair of activeCards) {
      if (throwingCard.rank === cardPair.attackingCard.rank) {
        return true;
      }
      if (cardPair.defendingCard && throwingCard.rank === cardPair.defendingCard.rank) {
        return true;
      }
    }
    return false;
  }

  static getCardValue(card: Card): number {
    const values: { [key in CardRank]: number } = {
      '7': 7, '8': 8, '9': 9, 'T': 10,
      'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };
    return values[card.rank];
  }

  static getCardName(card: Card): string {
    const suitNames: { [key in CardSuit]: string } = {
      'S': 'Spades', 'H': 'Hearts', 'D': 'Diamonds', 'C': 'Clubs'
    };
    const rankNames: { [key in CardRank]: string } = {
      '7': 'Seven', '8': 'Eight', '9': 'Nine', 'T': 'Ten',
      'J': 'Jack', 'Q': 'Queen', 'K': 'King', 'A': 'Ace'
    };
    
    return `${rankNames[card.rank]} of ${suitNames[card.suit]}`;
  }

  static parseCard(shortName: string): Card | null {
    if (shortName.length !== 2) return null;
    
    const rank = shortName[0] as CardRank;
    const suit = shortName[1] as CardSuit;
    
    if (!this.RANKS.includes(rank) || !this.SUITS.includes(suit)) {
      return null;
    }
    
    return { suit, rank, shortName };
  }
}

// Card naming convention: "King of Spades" = "KS"
export type CardSuit = 'S' | 'H' | 'D' | 'C'; // Spades, Hearts, Diamonds, Clubs
export type CardRank = '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A'; // T = 10

export interface Card {
  suit: CardSuit;
  rank: CardRank;
  shortName: string; // e.g., "KS", "7H", "AD"
}

export interface CardOnTable {
  attackingCard: Card;
  defendingCard?: Card;
}

export type GameStatus = 'waiting' | 'playing' | 'finished';
export type PlayerStatus = 'waiting' | 'active' | 'attacker' | 'defender' | 'spectator' | 'eliminated';
export type PlayerRole = 'owner' | 'player';

export interface PlayerInRoom {
  id: string;
  name: string;
  status: PlayerStatus;
  role: PlayerRole;
  cards: Card[];
  socketId?: string;
  characterType?: string;
  avatar?: string;
  characterTeam?: string;
  avatarNumber?: number;
  visibleCards?: Card[];
  abilityUsed?: boolean;
}

export interface Room {
  id: string;
  name: string;
  owner: string;
  playerLimit: number;
  players: PlayerInRoom[];
  activeCards: CardOnTable[];
  currentGameStatus: GameStatus;
  currentAttacker?: string;
  currentDefender?: string;
  deck: Card[];
  trumpSuit?: CardSuit;
  createdAt: Date;
  updatedAt: Date;
}

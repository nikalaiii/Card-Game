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
export type CharacterType = 'peaks' | 'crosses' | 'hearts' | 'diamonds';

export interface CharacterInfo {
  type: CharacterType;
  name: string;
  description: string;
  image: string;
}

export interface PlayerCharacter {
  username: string;
  characterType: CharacterType;
  avatar: string;
  characterTeam?: string;
  avatarNumber?: number;
}

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
  visibleCards?: Card[]; // Cards visible to Peaks King
  abilityUsed?: boolean; // Track if ability was used this round
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

export interface CreateRoomRequest {
  name: string;
  playerLimit: number;
  playerNames: string[];
  owner: string;
  character?: PlayerCharacter;
}

export interface JoinRoomRequest {
  roomId: string;
  playerName: string;
  character?: {
    username: string;
    characterType?: string;
    avatar?: string;
    characterTeam?: string;
    avatarNumber?: number;
  };
}

export interface GameAction {
  type: 'attack' | 'defend' | 'pass' | 'take_cards' | 'throw_cards' | 'use_ability' | 'reveal_card';
  card?: Card;
  defendingCard?: Card;
  roomId: string;
  playerId: string;
  abilityType?: 'peaks_vision' | 'crosses_throw' | 'hearts_defend';
  targetPlayerId?: string; // For Peaks King to see specific player's card
}

export interface GameState {
  roomId: string;
  status: GameStatus;
  currentAttacker?: string;
  currentDefender?: string;
  activeCards: CardOnTable[];
  deck: Card[];
  trumpSuit?: string;
  players: {
    id: string;
    name: string;
    status: PlayerStatus;
    cards: Card[];
    cardsCount: number;
  }[];
}

export interface SocketEvents {
  // Client to Server
  'join-room': { roomId: string; playerName: string };
  'leave-room': { roomId: string; playerId: string };
  'game-action': GameAction;
  'start-game': { roomId: string; playerId: string };

  // Server to Client
  'room-joined': { success: boolean; message: string; room?: Room };
  'room-left': { success: boolean; message: string };
  'room-updated': { room: Room };
  'game-state-updated': GameState;
  'player-joined': { player: PlayerInRoom };
  'player-left': { playerId: string };
  'player-disconnected': { playerId: string; playerName: string; gameInProgress: boolean };
  'game-started': { roomId: string; gameState: GameState };
  'game-ended': { winner: string; gameState: GameState };
  error: { message: string; code?: string };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  room?: Room;
  rooms?: Room[];
  gameState?: GameState;
}


import { Card, CardOnTable, GameStatus, PlayerStatus, PlayerRole } from './card.types';

export interface CreateRoomRequest {
  name: string;
  playerLimit: number;
  playerNames: string[];
  owner: string;
}

export interface JoinRoomRequest {
  roomId: string;
  playerName: string;
}

export interface GameAction {
  type: 'attack' | 'defend' | 'pass' | 'take_cards' | 'throw_cards';
  card?: Card;
  defendingCard?: Card;
  roomId: string;
  playerId: string;
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
  'game-state-updated': GameState;
  'player-joined': { player: PlayerInRoom };
  'player-left': { playerId: string };
  'game-started': { roomId: string; gameState: GameState };
  'game-ended': { winner: string; gameState: GameState };
  'error': { message: string; code?: string };
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
  trumpSuit?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerInRoom {
  id: string;
  name: string;
  status: PlayerStatus;
  role: PlayerRole;
  cards: Card[];
  socketId?: string;
}

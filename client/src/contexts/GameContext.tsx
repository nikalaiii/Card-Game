'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { socketService } from '../services/socket.service';
import { ApiService } from '../services/api.service';
import {
  Room,
  GameState,
  PlayerInRoom,
  Card,
  GameAction,
  CreateRoomRequest,
  JoinRoomRequest,
} from '../types/game.types';

interface GameContextType {
  // Connection state
  isConnected: boolean;
  currentRoom: Room | null;
  gameState: GameState | null;
  currentPlayer: PlayerInRoom | null;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  createRoom: (data: CreateRoomRequest) => Promise<Room>;
  joinRoom: (data: JoinRoomRequest) => Promise<Room>;
  startGame: () => void;
  leaveRoom: () => void;
  gameAction: (action: Omit<GameAction, 'roomId' | 'playerId'>) => void;
  hydrateRoom: (room: Room) => void;
  
  // Loading states
  loading: boolean;
  error: string | null;
}

type GameActionType =
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CURRENT_ROOM'; payload: Room | null }
  | { type: 'SET_GAME_STATE'; payload: GameState | null }
  | { type: 'SET_CURRENT_PLAYER'; payload: PlayerInRoom | null }
  | { type: 'UPDATE_ROOM'; payload: Room }
  | { type: 'UPDATE_GAME_STATE'; payload: GameState }
  | { type: 'HYDRATE_ROOM'; payload: Room }
  | { type: 'CLEAR_GAME_DATA' };

interface GameStateType {
  isConnected: boolean;
  loading: boolean;
  error: string | null;
  currentRoom: Room | null;
  gameState: GameState | null;
  currentPlayer: PlayerInRoom | null;
}

const initialState: GameStateType = {
  isConnected: false,
  loading: false,
  error: null,
  currentRoom: null,
  gameState: null,
  currentPlayer: null,
};

function gameReducer(state: GameStateType, action: GameActionType): GameStateType {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_CURRENT_ROOM':
      return { ...state, currentRoom: action.payload };
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.payload };
    case 'SET_CURRENT_PLAYER':
      return { ...state, currentPlayer: action.payload };
    case 'UPDATE_ROOM':
      return { ...state, currentRoom: action.payload };
    case 'UPDATE_GAME_STATE':
      return { ...state, gameState: action.payload };
    case 'HYDRATE_ROOM':
      return { ...state, currentRoom: action.payload };
    case 'CLEAR_GAME_DATA':
      return {
        ...state,
        currentRoom: null,
        gameState: null,
        currentPlayer: null,
      };
    default:
      return state;
  }
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Helper function to get saved player ID from room-scoped storage
  const getSavedPlayerId = (): string | null => {
    const roomId = state.currentRoom?.id;
    if (!roomId) return null;
    const key = `cg:room:${roomId}:player`;
    const raw = sessionStorage.getItem(key) ?? localStorage.getItem(key);
    try { 
      return raw ? JSON.parse(raw).id : null; 
    } catch { 
      return null; 
    }
  };

  // Socket connection management
  const connect = () => {
    socketService.connect();
    
    // Cleanup old global storage keys
    const oldKey = 'currentPlayerName';
    if (localStorage.getItem(oldKey)) {
      localStorage.removeItem(oldKey);
      console.log('Cleaned up old global storage key:', oldKey);
    }
  };

  const disconnect = () => {
    socketService.disconnect();
    dispatch({ type: 'SET_CONNECTED', payload: false });
    dispatch({ type: 'CLEAR_GAME_DATA' });
  };

  // Room management
  const createRoom = async (data: CreateRoomRequest): Promise<Room> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await ApiService.createRoom(data);
      
      if (response.success && response.room) {
        dispatch({ type: 'SET_CURRENT_ROOM', payload: response.room });

        console.log('Created room:', response);
        
        // Find current player
        const currentPlayer = response.room.players.find(p => p.name === data.owner);
        if (currentPlayer) {
          dispatch({ type: 'SET_CURRENT_PLAYER', payload: currentPlayer });
          
          // Store player data in room-scoped storage
          const storageKey = `cg:room:${response.room.id}:player`;
          const payload = JSON.stringify({ id: currentPlayer.id, name: currentPlayer.name });
          sessionStorage.setItem(storageKey, payload); // tab scope
          localStorage.setItem(storageKey, payload); // fallback for refresh
        }
        
        // Join via WebSocket with character data
        socketService.joinRoom({
          roomId: response.room.id,
          playerName: data.owner,
          character: data.character,
        });

        return response.room;
      } else {
        throw new Error(response.message || 'Failed to create room');
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const joinRoom = async (data: JoinRoomRequest): Promise<Room> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await ApiService.joinRoom(data);
      if (response.success && response.room) {
        dispatch({ type: 'SET_CURRENT_ROOM', payload: response.room });
        
        // Find current player
        const currentPlayer = response.room.players.find(p => p.name === data.playerName);
        if (currentPlayer) {
          dispatch({ type: 'SET_CURRENT_PLAYER', payload: currentPlayer });
          
          // Store player data in room-scoped storage
          const storageKey = `cg:room:${data.roomId}:player`;
          const payload = JSON.stringify({ id: currentPlayer.id, name: currentPlayer.name });
          sessionStorage.setItem(storageKey, payload); // tab scope
          localStorage.setItem(storageKey, payload); // fallback for refresh
        }
        
        // Join via WebSocket with character data
        socketService.joinRoom({
          roomId: data.roomId,
          playerName: data.playerName,
          character: data.character,
        });

        return response.room;
      } else {
        throw new Error(response.message || 'Failed to join room');
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const startGame = () => {
    const roomId = state.currentRoom?.id;
    const playerId = state.currentPlayer?.id ?? getSavedPlayerId();
    
    if (roomId && playerId) {
      socketService.startGame({ roomId, playerId });
    } else {
      dispatch({ type: 'SET_ERROR', payload: 'No current player/room to start the game' });
    }
  };

  const leaveRoom = () => {
    const roomId = state.currentRoom?.id;
    const playerId = state.currentPlayer?.id ?? getSavedPlayerId();
    
    if (roomId && playerId) {
      socketService.leaveRoom({ roomId, playerId });
    }
    dispatch({ type: 'CLEAR_GAME_DATA' });
  };

  const gameAction = (action: Omit<GameAction, 'roomId' | 'playerId'>) => {
    const roomId = state.currentRoom?.id;
    const playerId = state.currentPlayer?.id ?? getSavedPlayerId();
    
    if (roomId && playerId) {
      socketService.gameAction({ ...action, roomId, playerId });
    }
  };

  const hydrateRoom = (room: Room) => {
    dispatch({ type: 'HYDRATE_ROOM', payload: room });
  };


  // Restore currentPlayer from room-scoped storage when room is present
  useEffect(() => {
    const roomId = state.currentRoom?.id;
    if (!roomId) return;

    const key = `cg:room:${roomId}:player`;
    const raw = sessionStorage.getItem(key) ?? localStorage.getItem(key);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw) as { id: string; name: string };
      const me =
        state.currentRoom.players?.find(p => p.id === saved.id) ||
        state.currentRoom.players?.find(p => p.name === saved.name) ||
        null;
      dispatch({ type: 'SET_CURRENT_PLAYER', payload: me });
    } catch (error) {
      console.error('Failed to parse saved player data:', error);
    }
  }, [state.currentRoom?.id]);

  // Socket event handlers
  useEffect(() => {
    const handleConnected = () => {
      dispatch({ type: 'SET_CONNECTED', payload: true });
    };

    const handleDisconnected = () => {
      dispatch({ type: 'SET_CONNECTED', payload: false });
      dispatch({ type: 'CLEAR_GAME_DATA' });
    };

    const handleRoomJoined = (data: any) => {
      if (data.success && data.room) {
        dispatch({ type: 'UPDATE_ROOM', payload: data.room });
        
        // Update current player if found
        if (state.currentPlayer) {
          const updatedPlayer = data.room.players.find((p: PlayerInRoom) => p.id === state.currentPlayer?.id);
          if (updatedPlayer) {
            dispatch({ type: 'SET_CURRENT_PLAYER', payload: updatedPlayer });
          }
        }
      }
    };

    const handleGameStarted = (data: any) => {
      dispatch({ type: 'SET_GAME_STATE', payload: data.gameState });
      
      // Update room data if provided
      if (data.room) {
        dispatch({ type: 'UPDATE_ROOM', payload: data.room });
      }
      
      // Don't update currentPlayer here - let the room page handle it locally
      // This prevents cross-contamination between different player sessions
    };

    const handleGameStateUpdated = (gameState: GameState) => {
      dispatch({ type: 'UPDATE_GAME_STATE', payload: gameState });
      
      // Don't update currentPlayer here - let the room page handle it locally
      // This prevents cross-contamination between different player sessions
    };

    const handleGameEnded = (data: any) => {
      dispatch({ type: 'UPDATE_GAME_STATE', payload: data.gameState });
    };

    const handleRoomUpdated = (data: any) => {
      if (data.room) {
        dispatch({ type: 'UPDATE_ROOM', payload: data.room });
      }
    };

    const handlePlayerDisconnected = (data: any) => {
      console.log(`Player ${data.playerName} disconnected (game in progress: ${data.gameInProgress})`);
      // Don't update state for disconnections during active games
      if (!data.gameInProgress) {
        dispatch({ type: 'SET_ERROR', payload: `${data.playerName} left the room` });
      }
    };

    const handleError = (data: any) => {
      dispatch({ type: 'SET_ERROR', payload: data.message });
    };

    // Register event listeners
    socketService.on('connected', handleConnected);
    socketService.on('disconnected', handleDisconnected);
    socketService.on('room-joined', handleRoomJoined);
    socketService.on('room-updated', handleRoomUpdated);
    socketService.on('player-disconnected', handlePlayerDisconnected);
    socketService.on('game-started', handleGameStarted);
    socketService.on('game-state-updated', handleGameStateUpdated);
    socketService.on('game-ended', handleGameEnded);
    socketService.on('error', handleError);

    // Cleanup
    return () => {
      socketService.off('connected', handleConnected);
      socketService.off('disconnected', handleDisconnected);
      socketService.off('room-joined', handleRoomJoined);
      socketService.off('room-updated', handleRoomUpdated);
      socketService.off('player-disconnected', handlePlayerDisconnected);
      socketService.off('game-started', handleGameStarted);
      socketService.off('game-state-updated', handleGameStateUpdated);
      socketService.off('game-ended', handleGameEnded);
      socketService.off('error', handleError);
    };
  }, [state.currentPlayer]);

  const contextValue: GameContextType = {
    isConnected: state.isConnected,
    currentRoom: state.currentRoom,
    gameState: state.gameState,
    currentPlayer: state.currentPlayer,
    connect,
    disconnect,
    createRoom,
    joinRoom,
    startGame,
    leaveRoom,
    gameAction,
    hydrateRoom,
    loading: state.loading,
    error: state.error,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

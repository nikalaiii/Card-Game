import axios from 'axios';
import {
  CreateRoomRequest,
  JoinRoomRequest,
  GameAction,
  ApiResponse,
  Room,
  GameState,
  PlayerCharacter,
} from '../types/game.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export class ApiService {
  // Room endpoints
  static async createRoom(data: CreateRoomRequest): Promise<ApiResponse<Room>> {
    try {
      const response = await apiClient.post('/rooms', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create room');
    }
  }

  static async joinRoom(data: JoinRoomRequest): Promise<ApiResponse<Room>> {
    try {
      const response = await apiClient.post('/rooms/join', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to join room');
    }
  }

  static async getAllRooms(): Promise<ApiResponse<Room[]>> {
    try {
      const response = await apiClient.get('/rooms');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get rooms');
    }
  }

  static async getRoom(roomId: string): Promise<ApiResponse<Room>> {
    try {
      const response = await apiClient.get(`/rooms/${roomId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get room');
    }
  }

  static async startGame(roomId: string, ownerId: string): Promise<ApiResponse<Room>> {
    try {
      const response = await apiClient.post(`/rooms/${roomId}/start`, {
        ownerId,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to start game');
    }
  }

  // Game endpoints
  static async processGameAction(action: GameAction): Promise<ApiResponse<GameState>> {
    try {
      const response = await apiClient.post('/game/action', action);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to process game action');
    }
  }

  static async getGameState(roomId: string): Promise<ApiResponse<GameState>> {
    try {
      const response = await apiClient.get('/game/state', {
        data: { roomId },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get game state');
    }
  }

  // Character endpoints
  static async createCharacter(character: PlayerCharacter): Promise<ApiResponse<PlayerCharacter>> {
    try {
      const response = await apiClient.post('/characters', character);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create character');
    }
  }

  static async getCharacter(username: string): Promise<ApiResponse<PlayerCharacter>> {
    try {
      const response = await apiClient.get(`/characters/${username}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get character');
    }
  }

  static async updateCharacter(
    username: string,
    character: Partial<PlayerCharacter>
  ): Promise<ApiResponse<PlayerCharacter>> {
    try {
      const response = await apiClient.post(`/characters/${username}/update`, character);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update character');
    }
  }
}


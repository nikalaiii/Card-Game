import { Controller, Post, Body, HttpException, HttpStatus, Get } from '@nestjs/common';
import { GameService } from '../services/game.service';
import type { GameAction } from '../types/game.types';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('action')
  async processGameAction(@Body() action: GameAction) {
    try {
      const gameState = await this.gameService.processGameAction(action);
      return {
        success: true,
        gameState,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('state')
  async getGameState(@Body() body: { roomId: string }) {
    try {
      const gameState = await this.gameService.getGameStateByRoomId(body.roomId);
      return {
        success: true,
        gameState,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }
}

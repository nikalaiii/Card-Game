import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RoomService } from '../services/room.service';
import type { CreateRoomRequest, JoinRoomRequest } from '../types/game.types';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  async createRoom(@Body() createRoomRequest: CreateRoomRequest) {
    try {
      const room = await this.roomService.createRoom(createRoomRequest);
      return {
        success: true,
        room,
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

  @Post('join')
  async joinRoom(@Body() joinRoomRequest: JoinRoomRequest) {
    try {
      const result = await this.roomService.joinRoom(joinRoomRequest);
      return result;
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

  @Get()
  async getAllRooms() {
    try {
      const rooms = await this.roomService.getAllRooms();
      return {
        success: true,
        rooms,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getRoom(@Param('id') id: string) {
    try {
      const room = await this.roomService.getRoom(id);
      return {
        success: true,
        room,
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

  @Post(':id/start')
  async startGame(
    @Param('id') roomId: string,
    @Body() body: { ownerId: string },
  ) {
    try {
      const room = await this.roomService.startGame(roomId, body.ownerId);
      return {
        success: true,
        room,
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

  @Get(':id/debug')
  async debugRoom(@Param('id') roomId: string) {
    try {
      await this.roomService.debugDatabaseStructure(roomId);
      return {
        success: true,
        message: 'Debug information logged to console',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

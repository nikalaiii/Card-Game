import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CharacterService } from '../services/character.service';
import type { PlayerCharacter } from '../types/game.types';

@Controller('characters')
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  @Post()
  async createCharacter(@Body() characterData: PlayerCharacter) {
    try {
      const character = await this.characterService.createCharacter(characterData);
      return {
        success: true,
        character,
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

  @Get(':username')
  async getCharacter(@Param('username') username: string) {
    try {
      const character = await this.characterService.getCharacter(username);
      return {
        success: true,
        character,
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

  @Post(':username/update')
  async updateCharacter(
    @Param('username') username: string,
    @Body() characterData: Partial<PlayerCharacter>
  ) {
    try {
      const character = await this.characterService.updateCharacter(username, characterData);
      return {
        success: true,
        character,
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
}


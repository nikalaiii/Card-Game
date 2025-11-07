import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Player } from '../entities/player.entity';
import { PlayerCharacter } from '../types/game.types';

@Injectable()
export class CharacterService {
  constructor(
    @InjectModel(Player)
    private playerModel: typeof Player,
  ) {}

  async createCharacter(characterData: PlayerCharacter): Promise<PlayerCharacter> {
    const { username, characterType, avatar, characterTeam, avatarNumber } = characterData;

    // Check if character already exists
    const existingCharacter = await this.playerModel.findOne({
      where: { name: username },
    });

    if (existingCharacter) {
      // Update existing character
      await existingCharacter.update({
        characterType,
        avatar,
        characterTeam,
        avatarNumber,
      });
      
      return {
        username: existingCharacter.name,
        characterType: existingCharacter.characterType || characterType,
        avatar: existingCharacter.avatar || avatar,
        characterTeam: existingCharacter.characterTeam,
        avatarNumber: existingCharacter.avatarNumber,
      };
    }

    // Create new character (without roomId - this is a global character)
    const character = await this.playerModel.create({
      name: username,
      characterType,
      avatar,
      characterTeam,
      avatarNumber,
      role: 'player',
      status: 'waiting',
      cards: [],
      roomId: null, // Explicitly set to null for global characters
    } as any);

    return {
      username: character.name,
      characterType: character.characterType || characterType,
      avatar: character.avatar || avatar,
      characterTeam: character.characterTeam,
      avatarNumber: character.avatarNumber,
    };
  }

  async getCharacter(username: string): Promise<PlayerCharacter> {
    const character = await this.playerModel.findOne({
      where: { name: username },
    });

    if (!character) {
      throw new NotFoundException('Character not found');
    }

    return {
      username: character.name,
      characterType: character.characterType || 'peaks',
      avatar: character.avatar || '👤',
      characterTeam: character.characterTeam,
      avatarNumber: character.avatarNumber,
    };
  }

  async updateCharacter(
    username: string,
    updateData: Partial<PlayerCharacter>
  ): Promise<PlayerCharacter> {
    const character = await this.playerModel.findOne({
      where: { name: username },
    });

    if (!character) {
      throw new NotFoundException('Character not found');
    }

    await character.update({
      characterType: updateData.characterType || character.characterType,
      avatar: updateData.avatar || character.avatar,
      characterTeam: updateData.characterTeam || character.characterTeam,
      avatarNumber: updateData.avatarNumber || character.avatarNumber,
    });

    return {
      username: character.name,
      characterType: character.characterType || 'peaks',
      avatar: character.avatar || '👤',
      characterTeam: character.characterTeam,
      avatarNumber: character.avatarNumber,
    };
  }

  async getAllCharacters(): Promise<PlayerCharacter[]> {
    const characters = await this.playerModel.findAll({
      where: { 
        roomId: { [Op.is]: null } 
      }, // Only global characters (not in any room)
    });

    return characters.map(char => ({
      username: char.name,
      characterType: char.characterType || 'peaks',
      avatar: char.avatar || '👤',
      characterTeam: char.characterTeam,
      avatarNumber: char.avatarNumber,
    }));
  }
}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoomController } from './controllers/room.controller';
import { GameController } from './controllers/game.controller';
import { CharacterController } from './controllers/character.controller';
import { RoomService } from './services/room.service';
import { GameService } from './services/game.service';
import { CharacterService } from './services/character.service';
import { GameGateway } from './gateways/game.gateway';
import { Room, Player } from './entities';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SequelizeModule.forRoot(databaseConfig),
    SequelizeModule.forFeature([Room, Player]),
  ],
  controllers: [AppController, RoomController, GameController, CharacterController],
  providers: [AppService, RoomService, GameService, CharacterService, GameGateway],
})
export class AppModule {}

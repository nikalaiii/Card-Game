import { Table, Column, Model, DataType, HasMany, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { Player } from './player.entity';

@Table({
  tableName: 'rooms',
  timestamps: true,
})
export class Room extends Model<Room> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare owner: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 4,
  })
  declare playerLimit: number;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue: [],
  })
  declare playerNames: string[];

  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue: [],
  })
  declare activeCards: any[];

  @Column({
    type: DataType.ENUM('waiting', 'playing', 'finished'),
    allowNull: false,
    defaultValue: 'waiting',
  })
  declare currentGameStatus: 'waiting' | 'playing' | 'finished';

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare currentAttacker: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare currentDefender: string;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue: [],
  })
  declare deck: any[];

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare trumpSuit: string;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @HasMany(() => Player, 'roomId')
  declare players: Player[];
}

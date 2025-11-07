import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Room } from './room.entity';

@Table({
  tableName: 'players',
  timestamps: true,
})
export class Player extends Model<Player> {
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
    type: DataType.ENUM(
      'waiting',
      'active',
      'attacker',
      'defender',
      'spectator',
      'eliminated',
    ),
    allowNull: false,
    defaultValue: 'waiting',
  })
  declare status:
    | 'waiting'
    | 'active'
    | 'attacker'
    | 'defender'
    | 'spectator'
    | 'eliminated';

  @Column({
    type: DataType.ENUM('owner', 'player'),
    allowNull: false,
    defaultValue: 'player',
  })
  declare role: 'owner' | 'player';

  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue: [],
  })
  declare cards: any[];

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare socketId: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare characterType: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare avatar: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare characterTeam: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare avatarNumber: number;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    defaultValue: [],
  })
  declare visibleCards: any[];

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare abilityUsed: boolean;

  @ForeignKey(() => Room)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare roomId: string | null;

  @BelongsTo(() => Room, {
    foreignKey: 'roomId',
    constraints: false, // Allow null foreign key
  })
  room: Room;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}

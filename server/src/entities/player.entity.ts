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

  @ForeignKey(() => Room)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare roomId: string;

  @BelongsTo(() => Room)
  room: Room;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}

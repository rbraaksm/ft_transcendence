import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '../user/user.entity';

@Entity()
export class HistoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, (userEntity) => userEntity.host)
  playerOne: UserEntity;

  @ManyToOne(
    () => UserEntity,
    (userEntity) => userEntity.opponent,
  )
  playerTwo: UserEntity;

  @Column()
  playerOneScore: number;

  @Column()
  playerTwoScore: number;


  @Column()
  game: string;


  @Column()
  date: Date;
}
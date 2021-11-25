import { UserEntity } from 'src/user/model/user.entity';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column({ nullable: true })
  playerOneScore: number;

  @Column({ nullable: true })
  playerTwoScore: number;

  @Column({ nullable: true })
  game: string;

  @CreateDateColumn({ nullable: true })
  date: Date;
}
import { UserEntity } from "src/app/model/user/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, } from "typeorm";

export enum Status {
	nosent = 'no-sent',
	pending = 'pending',
	accepted = 'accepted',
	declined = 'declined',
	waiting = 'waiting-for-current-user-response',
	blocked = 'blocked',
  }

  @Entity({ name: 'user_followers' })
  export class FriendEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'number' })
	following_id: number;

	@Column({ type: 'number' })
	follower_id: number;

	@ManyToOne(
	  () => UserEntity,
	  (u: UserEntity) => u.followers,
	)
	@JoinColumn({ name: 'follower_id' })
	followers: UserEntity;

	@ManyToOne(
	  type => UserEntity,
	  (u: UserEntity) => u.following,
	)
	@JoinColumn({ name: 'following_id' })
	following: UserEntity;

	@Column({ enum: Status, type: 'enum', default: Status.pending })
	status: Status;
  }

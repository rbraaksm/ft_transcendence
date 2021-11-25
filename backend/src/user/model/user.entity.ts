import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ConnectedUserEntity } from "src/chat/model/connected-user/connected-user.entity";
import { JoinedRoomEntity } from "src/chat/model/joined-room/joined-room.entity";
import { MessageEntity } from "src/chat/model/message/message.entity";
import { RoomEntity } from "src/chat/model/room/room.entity";

import { FriendRequestEntity } from "src/friends/model/friends.entity";
import { UserRole, UserStatus } from "./user.interface";
import { HistoryEntity } from "src/history/model/history.entity";

@Entity()
export class UserEntity {

	@PrimaryGeneratedColumn()
	id: number;

	@Column({unique: true})
	username: string;

	@Column({unique: true})
	email: string;

	@Column({default: false})
	ban: boolean;

	@Column({select: false})
	password: string;

	@Column({default: true})
	image_url: string;

	@Column({default: false})
	image: boolean;

	@Column({default: false})
	avatar: string;

	@Column({default: 0})
	level: number;

	@Column({ nullable: true })
	nbWin: number;

	@Column({ unique: true, nullable: true })
	school42id: number;

	@Column({ nullable: true })
	nbLoss: number;

	@Column({default: false})
	prevMatch: boolean;

	@Column({nullable: true})
	streak: number;

	@Column({ default: false })
	twoFactorAuthEnabled: boolean;

	@Column({ nullable: true })
	twoFactorAuthenticationSecret: string;

	@Column({nullable: true})
	xp: number;

	@Column({default: false})
	achievementStreak5: boolean;

	@Column({default: false})
	achievementStreak10: boolean;

	@Column({default: false})
	achievementStreak25: boolean;

	@Column({default: false})
	achievementStreak50: boolean;

	@Column({default: false})
	achievementNoGoalAgainst: boolean;

	@Column({default: false})
	achievementMaster: boolean;

	@Column({default: false})
	achievementRookie: boolean;

	@Column({default: false})
	achievementBeginner: boolean;

	@Column({default: false})
	achievementIntermediate: boolean;

	@Column({default: false})
	achievementPro: boolean;

	@OneToMany(
		() => FriendRequestEntity,
		(friendRequestEntity) => friendRequestEntity.creator,
	)
	sentFriendRequests: FriendRequestEntity[];

	@OneToMany(
	() => FriendRequestEntity,
	(friendRequestEntity) => friendRequestEntity.receiver,
	)
	receivedFriendRequests: FriendRequestEntity[];

	@OneToMany(
		() => HistoryEntity,
		(historyEntity) => historyEntity.playerOne,
	)
	host: HistoryEntity[];

	@OneToMany(
	() =>HistoryEntity,
	(historyEntity) => historyEntity.playerTwo,
	)
	opponent: HistoryEntity[];

	@Column({type: 'enum', enum: UserStatus, default: UserStatus.OFF})
	status: UserStatus;

	@Column({type: 'enum', enum: UserRole, default: UserRole.USER})
	role: UserRole;

	@ManyToMany(() => RoomEntity, room => room.users)
	rooms: RoomEntity[]

	@ManyToMany(() => RoomEntity, room => room.admin)
 	admin: RoomEntity[]

 	@OneToMany(() => ConnectedUserEntity, connection => connection.user)
 	connections: ConnectedUserEntity[];

 	@OneToMany(() => JoinedRoomEntity, joinedRoom => joinedRoom.room)
 	joinedRooms: JoinedRoomEntity[];

 	@OneToMany(() => MessageEntity, message => message.user)
 	messages: MessageEntity[];

	@OneToMany(() => RoomEntity, room => room.owner)
	chatOwner: RoomEntity[];

 	@BeforeInsert()
 	@BeforeUpdate()
 	emailToLowerCase() {
    	this.email = this.email.toLowerCase();
  }

}
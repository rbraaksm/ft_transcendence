import { FriendEntity } from "src/app/friend/models/friend.entity";
import { BeforeInsert, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { FriendRequestEntity } from "../friends/friends.entity";
import { HistoryEntity } from "../history/history.entity";
import { UserRole, UserStatus } from "./user.interface";

@Entity()
export class UserEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    username: string;

    @Column()
    password: string;

    @Column({ unique: true })
    email: string;

    @Column()
    image_url: string;

	@Column()
	image: boolean;
	
    @Column()
    avatar: string;

    @Column()
    level: number;

    @OneToMany(() => FriendEntity, friend => friend.following)
    following: UserEntity[];

	@OneToMany(() => FriendEntity, friend => friend.followers)
    followers: UserEntity[];

    @Column({type: 'enum', enum: UserStatus, default: UserStatus.OFF})
    status: UserStatus;

    @Column({type: 'enum', enum: UserRole, default: UserRole.USER})
    role: UserRole;

	@Column()
	nbWin: number;

	@Column()
	nbLoss: number;

	@Column()
	prevMatch: boolean;

	@Column()
	streak: number;

	@Column()
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
	host: FriendRequestEntity[];

	@OneToMany(
	() =>HistoryEntity,
	(historyEntity) => historyEntity.playerTwo,
	)
	opponent: FriendRequestEntity[];

	@BeforeInsert()
	emailToLowerCase() {
		this.email = this.email.toLocaleLowerCase();
	}
}

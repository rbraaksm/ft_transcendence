import { RoomI } from "src/chat/model/room/room.interface";

export interface UserI {
    id?: number;
    username?: string;
    password?: string;
    email?: string;
    ban?: boolean;
    image_url?: string;
	image?: boolean;
    avatar?: string;
    level?: number;
    status?: UserStatus;
    role?: UserRole;
	nbWin?: number;
	school42id?: number;
	nbLoss?: number;
	prevMatch?: boolean;
	streak?: number;
	twoFactorAuthEnabled?: boolean;
	twoFactorAuthenticationSecret?: string;
	xp?: number;
	achievementStreak5?: boolean;
	achievementStreak10?: boolean;
	achievementStreak25?: boolean;
	achievementStreak50?: boolean;
	achievementNoGoalAgainst?: boolean;
	achievementMaster?: boolean;
	achievementRookie?: boolean;
	achievementBeginner?: boolean;
	achievementIntermediate?: boolean;
	achievementPro?: boolean;
}

export enum UserRole {
    OWNER = 'owner',
    ADMIN = 'admin',
    USER = 'user',
}

export enum UserStatus {
    ON = 'online',
    OFF = 'offline',
    GAME = 'in-game'
}
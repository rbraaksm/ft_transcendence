import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/model/user.entity';
import { UserI, UserRole, UserStatus } from 'src/user/model/user.interface';
import { Like, Repository } from 'typeorm';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Observable, from, throwError } from 'rxjs';
import { switchMap, map, catchError} from 'rxjs/operators';
import { AuthService } from 'src/auth/login/service/auth.service';
import UserOauthIdNotFoundException from 'src/auth/oauth2/school42/exception/UserOauthIdNotFound.exception';

import fs = require("fs");
const axios = require('axios');
const { exec } = require("child_process");

const path = "./src/uploads/avatar/";

@Injectable()
export class UserService {

	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private authService: AuthService
	) { }

	async download(url, image_path){
	axios({
	  url,
	  responseType: 'stream',
	}).then(
	  response =>
		new Promise<void>((resolve, reject) => {
		  response.data
			.pipe(fs.createWriteStream(image_path))
			.on('finish', () => resolve())
			.on('error', e => reject(e));
		}),
	)};

	async create(newUser: UserI): Promise<UserI> {
		try {
		const exists: boolean = await this.mailExists(newUser.email);
		if (!exists) {
			const passwordHash: string = await this.hashPassword(newUser.password);
			newUser.password = passwordHash;
			newUser.level = 0;
			newUser.nbLoss = 0;
			newUser.nbWin = 0;
			newUser.streak = 0;
			newUser.prevMatch = false;
			newUser.achievementStreak5 = false;
			newUser.achievementStreak10 = false;
			newUser.achievementStreak25 = false;
			newUser.achievementStreak50 = false;
			newUser.achievementNoGoalAgainst = false;
			newUser.achievementMaster = false;
			newUser.achievementRookie = false;
			newUser.achievementBeginner = false;
			newUser.achievementIntermediate = false;
			newUser.achievementPro = false;
			newUser.xp = 0;
			newUser.twoFactorAuthEnabled = false;
			newUser.avatar = newUser.username + ".png"

			if (newUser.image_url)
				this.download(newUser.image_url, path + newUser.username + ".png")
			else
				this.download("https://cdn.vox-cdn.com/thumbor/-kkLKkrrQ4yx64Bbb60ttYeCxFo=/0x0:2370x1574/1820x1213/filters:focal(996x598:1374x976):format(webp)/cdn.vox-cdn.com/uploads/chorus_image/image/68870438/Screen_Shot_2020_07_21_at_9.38.25_AM.0.png", path + newUser.username + ".png")
			const user = await this.userRepository.save(this.userRepository.create(newUser));
			if (user.id == 1) {
				user.role = UserRole.OWNER;
				await this.userRepository.save(user);
			}
			return this.findOne(user.id);
		} else {
			throw new HttpException('Email is already in use', HttpStatus.CONFLICT);
		}
		} catch {
		throw new HttpException('Email or username is already in use', HttpStatus.CONFLICT);
		}
	}

	async login(user: UserI): Promise<any> {
		try {
			const foundUser: UserI = await this.findByEmail(user.email.toLowerCase());
			if (foundUser) {
				const matches: boolean = await this.validatePassword(user.password, foundUser.password);
				if (matches) {
					const payload: UserI = await this.findOne(foundUser.id);
					if (payload.ban)
						throw new HttpException('User banned', HttpStatus.UNAUTHORIZED);
					const jwt: string = await this.authService.generateJwt(payload);
					this.updateStatusOfUser(payload.id, {"status": UserStatus.ON});
					return {
						jwt,
						payload,
						};
				} else {
					throw new HttpException('Login was not successfull, wrong credentials', HttpStatus.UNAUTHORIZED);
				}
			} else {
				throw new HttpException('Login was not successfull, wrong credentials', HttpStatus.UNAUTHORIZED);
			}
		} catch {
		throw new HttpException('User not found', HttpStatus.NOT_FOUND);
		}
	}

	async logout(user:UserI): Promise<any> {
		this.updateStatusOfUser(user.id, {"status": UserStatus.OFF});
	}

	async findAll(options: IPaginationOptions): Promise<Pagination<UserEntity>> {
		return paginate<UserEntity>(this.userRepository, options);
	}

	async findAllByUsername(username: string): Promise<UserI[]> {
		return this.userRepository.find({
			where: {
				username: Like(`%${username.toLowerCase()}%`)
			}
		})
	}

	async findAllByLevel(): Promise<UserI[]> {
		return this.userRepository.find({
			order: {
				level: "DESC"
			}
		})
	}

	async findOne(id: number): Promise<UserI> {
		return this.userRepository.findOne({ id });
	}

	async updateOne(id: number, user: UserI): Promise<any> {
		delete user.password;
		delete user.role;

		return from(this.userRepository.update(id, user)).pipe(
			switchMap(() => this.findOne(id))
			);
	}

    async updateRoleOfUser(id: number, user: UserI): Promise<any> {
		const temp = await this.userRepository.findOne({
			where: {
			  id: id,
			},
		});
		if (temp.role == UserRole.OWNER) throw new HttpException('Can\'t change the Owner role...', HttpStatus.CONFLICT);
		if (user.role == UserRole.OWNER) throw new HttpException('Can\'t have 2 owner', HttpStatus.CONFLICT);
		return from(this.userRepository.update(id, user)).pipe(
			switchMap(() => this.findOne(id))
		);
    }

    async updateBanOfUser(id: number, user: UserI): Promise<any> {
		const temp = await this.userRepository.findOne({
			where: {
			  id: id,
			},
		});
		if (temp.role == UserRole.OWNER) throw new HttpException('You can\'t ban Owner...', HttpStatus.CONFLICT);
		return from(this.userRepository.update(id, user)).pipe(
			switchMap(() => this.findOne(id))
		);
    }

    updateStatusOfUser(id: number, user: UserI): Observable<any> {
      	return from(this.userRepository.update(id, user))
    }

	updateOneOb(id: number, user: UserI): Observable<any> {
		return from(this.userRepository.update(id, user)).pipe(
			switchMap(() => this.findOne(id))
		);
	}

	private async findByEmail(email: string): Promise<UserI> {
		return this.userRepository.findOne({ email }, { select: ['id', 'email', 'username', 'password'] });
	}

	private async hashPassword(password: string): Promise<string> {
		return this.authService.hashPassword(password);
	}

	private async validatePassword(password: string, storedPasswordHash: string): Promise<any> {
		return this.authService.comparePasswords(password, storedPasswordHash);
	}

	public getOne(id: number): Promise<UserI> {
		return this.userRepository.findOneOrFail({ id });
	}

	private async mailExists(email: string): Promise<boolean> {
		const user = await this.userRepository.findOne({ email });
		if (user)
			return true;
		return false;
	}

	async setTwoFactorAuthenticationSecret(secret: string, userId: number) {
		return this.userRepository.update(userId, {
		twoFactorAuthenticationSecret: secret
		});
	}

	async turnOnTwoFactorAuthentication(userId: number) {
		return this.userRepository.update(userId, {
			twoFactorAuthEnabled: true
		});
	}

	async turnOffTwoFactorAuthentication(userId: number) {
		return this.userRepository.update(userId, {
			twoFactorAuthEnabled: false
		});
  	}

	async getUserBy42Id(id: number): Promise<UserI> {
		const user = await this.userRepository.findOne({
		where: {
			school42id: id,
		},
		});
		if (user) return user;
		else throw new UserOauthIdNotFoundException(id);
	}


}

import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-oauth2';
import axios from 'axios';
import {UserService} from 'src/user/service/user-service/user.service';
import UserOauthIdNotFoundException from '../exception/UserOauthIdNotFound.exception';
import UserNameAlreadyExistsException from '../exception/UserNameAlreadyExists.exception';

@Injectable()
export class School42Strategy extends PassportStrategy(Strategy, 'school42') {
	constructor(private usersService: UserService) {
		super({
			authorizationURL: "https://api.intra.42.fr/oauth/authorize?client_id=999c140195c8f4b412254d790158ed245e0fb3b59ca0fa9e916a46e144d4153b&redirect_uri=http%3A%2F%2Flocalhost%2Fpublic%2Fcallback&response_type=code",
			tokenURL: "https://api.intra.42.fr/oauth/token",
			clientID: process.env.OAUTH_42_UID,
			clientSecret: process.env.OAUTH_42_SECRET,
			callbackURL: "http://localhost:4200/public/callback",
			scope: 'public',
			proxy: true
		});
	}

	async validate (accessToken: string, refreshToken: string, profile: any, done: Function): Promise<any> {
		const { data } = await axios.get('https://api.intra.42.fr/v2/me', { headers: { Authorization: `Bearer ${accessToken}` },});
		try {
			// check if user already exists
			let user = await this.usersService.getUserBy42Id(data.id);
			//check if user is banned
			if (user.ban) {
				throw new UnauthorizedException('You\'re banned');
			}
			done(null, user);
		}
		catch (error) {
			if (error instanceof UserOauthIdNotFoundException) {
				let nbTry = 0;
				while (nbTry < 20 && nbTry >= 0) {
					try {
						if (data.login == undefined) {
							throw new UserNameAlreadyExistsException(undefined);
						}
						let username = data.login.substring(0, 13);
						if (nbTry) {
							username = username + nbTry;
						}
						let user = await this.usersService.create({
							username: username,
							password: "School42",
							school42id: data.id,
							email: data.email,
							image_url: data.image_url,
							
						});
						user.password = undefined;
						done(null, user);
						nbTry = -1;
					} catch (e) {
						nbTry++;
					}
				}
			}
			else {
				throw new HttpException(
					error.message,
					HttpStatus.INTERNAL_SERVER_ERROR,
				  );
			}
		}
	}
}
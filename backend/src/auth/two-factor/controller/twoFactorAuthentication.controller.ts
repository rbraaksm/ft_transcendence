import {
	ClassSerializerInterceptor,
	Controller,
	Post,
	Get,
	UseInterceptors,
	UseGuards,
	Req,
	Res,
	Body,
	UnauthorizedException, HttpCode,
  } from '@nestjs/common';
import { TwoFactorService } from '../service/twoFactor.service';
import { Response } from 'express';
import path = require('path');
import { join } from 'path';
import { Observable, of } from 'rxjs';
import RequestWithUser from '../../requestWithUser.interface';
import { UserService } from 'src/user/service/user-service/user.service';
import { TwoFactorAuthenticationCodeDto } from '../dto/twoFactor.dto';
import { JwtAuthGuard } from 'src/auth/login/guards/jwt.guard';
import { UserEntity } from 'src/user/model/user.entity';
   
  @Controller('2fa')
  export class TwoFactorAuthenticationController {
	constructor(
	  private readonly twoFactorAuthenticationService: TwoFactorService,
	  private readonly usersService: UserService,
	) {}

	@Post('authenticate')
	@UseGuards(JwtAuthGuard)
	async authenticate(
	  @Req() request: RequestWithUser,
	  @Body() { twoFactorAuthenticationCode } : TwoFactorAuthenticationCodeDto) : Promise<string>{
		
		const isCodeValid = this.twoFactorAuthenticationService.isTwoFactorAuthenticationCodeValid(
		twoFactorAuthenticationCode, request.body
		);
		if (!isCodeValid) {
		  throw new UnauthorizedException('Wrong authentication code');
		}
		
		const user = await this.usersService.findOne(request.body.id);
		if (user.ban) {
		  throw new UnauthorizedException('You\'re banned');
		}

		const accessTokenCookie = this.twoFactorAuthenticationService.getCookieWithJwtToken(request.body.id, true);
		request.res.setHeader('Set-Cookie', [accessTokenCookie.cookie]);

		return JSON.stringify(accessTokenCookie.token);
	}

	@Post('turn-on')
	@UseGuards(JwtAuthGuard)
	async turnOnTwoFactorAuthentication(
	  @Req() request: RequestWithUser
	) {
	  const isCodeValid = this.twoFactorAuthenticationService.isTwoFactorAuthenticationCodeValid(
		request.body.twoFactorAuthenticationCode, request.body
	  );	  
	  if (!isCodeValid) {
		throw new UnauthorizedException('Wrong authentication code');
	  }
	  await this.usersService.turnOnTwoFactorAuthentication(request.body.id);
	}
	

	@Post('turn-off')
	@UseGuards(JwtAuthGuard)
	async turnOffTwoFactorAuthentication(
	  @Req() request: RequestWithUser,
	  @Body() { twoFactorAuthenticationCode } : TwoFactorAuthenticationCodeDto
	) {
	  const isCodeValid = this.twoFactorAuthenticationService.isTwoFactorAuthenticationCodeValid(
		twoFactorAuthenticationCode, request.body
	  );
	  if (!isCodeValid) {
		throw new UnauthorizedException('Wrong authentication code');
	  }
	  await this.usersService.turnOffTwoFactorAuthentication(request.body.id);
	}

	@Post('generate')
	@UseGuards(JwtAuthGuard)
	async generate(@Req() request: RequestWithUser) : Promise<string>{		
		const otpauth = await this.twoFactorAuthenticationService.generateTwoFactorAuthenticationSecret(request.body);
		this.twoFactorAuthenticationService.pipeQrCodeStream(otpauth.otpauthUrl);
		return (JSON.stringify(otpauth.secret));
	}
	
	@Get('qrcode')
	async findQrCode(@Res() res) {
		return of(res.sendFile(join(process.cwd(), 'src/uploads/qrcode/qrcode.png')));
	}
  }
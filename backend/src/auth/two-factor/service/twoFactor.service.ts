import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import { UserEntity } from 'src/user/model/user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/service/user-service/user.service';
import { toFileStream } from 'qrcode';
import { toFile } from 'qrcode';
import { Response } from 'express';
import { UserI } from 'src/user/model/user.interface';

@Injectable()
export class TwoFactorService {
  constructor (
    private readonly usersService: UserService,
	private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  public async generateTwoFactorAuthenticationSecret(user: UserI) {
    const secret = authenticator.generateSecret();

    const otpauthUrl = authenticator.keyuri(user.email, this.configService.get('TWO_FACTOR_AUTHENTICATION_APP_NAME'), secret);

    await this.usersService.setTwoFactorAuthenticationSecret(secret, user.id);

    return {
      secret,
      otpauthUrl
    }
  }

  public async pipeQrCodeStream(otpauthUrl: string) {
	  toFile('src/uploads/qrcode/qrcode.png',otpauthUrl);
  }

  public isTwoFactorAuthenticationCodeValid(twoFactorAuthenticationCode: string, user: UserEntity) {
    return authenticator.verify({
      token: twoFactorAuthenticationCode,
      secret: user.twoFactorAuthenticationSecret
    })
  }

  public getCookieWithJwtToken(userId: number, isSecondFactorAuthenticated = false) {
    const payload: TokenPayload = { userId, isSecondFactorAuthenticated };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: `10000`
    });
    const cookie = `Authentication=${token}; HttpOnly; Path=/; Max-Age=${this.configService.get('10000')}`;
	return {
		cookie,
		token,
	  };
  }

  async validate(payload: TokenPayload) {
    const user = await this.usersService.getOne(payload.userId);
    if (!user.twoFactorAuthEnabled || payload.isSecondFactorAuthenticated) {
      return user;
    }
  }
}

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/service/user-service/user.service';

@Injectable()
export class JwtStrategyTwoFactor extends PassportStrategy(Strategy, 'jwt-two-factor') {
  
  constructor(private configService: ConfigService, private usersService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET')
    });
  }

  async validate(payload: TokenPayload) {
    const user = await this.usersService.getOne(payload.userId);
    if (!user.twoFactorAuthEnabled || payload.isSecondFactorAuthenticated) {
      return user;
    }
  }
}
import { Req, Controller, HttpCode, UseGuards, Res, Get, Inject, forwardRef } from '@nestjs/common';
import { TwoFactorService } from '../two-factor/service/twoFactor.service';
import { Response } from 'express';
import { School42AuthenticationGuard } from './school42/guards/school42Authentication.guard';
import {UserService} from 'src/user/service/user-service/user.service';
import { UserI } from 'src/user/model/user.interface';


@Controller('oauth2')
export class Oauth2Controller {
  constructor(
    private twofactorService: TwoFactorService,
    @Inject(forwardRef(() => UserService))
    private readonly usersService: UserService,) { }

  @Get('school42/callback')
  @UseGuards(School42AuthenticationGuard)
  @HttpCode(200)
  async school42Callback(@Req() request: any, @Res() response: Response) {
    const { user } = request;
	const userEntity: UserI = {email: user.email, password: 'School42', image_url: user.image_url};
	const login = await this.usersService.login(userEntity);
	const resp = {id : user.id ,two_factor: user.twoFactorAuthEnabled , token: login.jwt};
    try {
		response.send(JSON.stringify(resp));
    } catch (error) {
      response.redirect('http://localhost:4200');
    }
  }

  @Get('school42')
  @UseGuards(School42AuthenticationGuard)
  @HttpCode(200)
  async logSchool42() {
  }

}
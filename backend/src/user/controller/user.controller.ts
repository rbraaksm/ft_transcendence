import { Body, Controller, Param, Get, Res, Post, Request, Put, Query, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Pagination } from 'nestjs-typeorm-paginate';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateUserDto } from '../model/dto/create-user.dto';
import { LoginUserDto } from '../model/dto/login-user.dto';
import { LoginResponseI } from '../model/login-response.interface';
import { UserI, UserRole } from '../model/user.interface';
import { map, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { UserHelperService } from '../service/user-helper/user-helper.service';
import { UserService } from '../service/user-service/user.service';
import { UserEntity } from '../model/user.entity';
import { JwtAuthGuard } from '../../auth/login/guards/jwt.guard'
import { diskStorage } from 'multer';
import path = require('path');
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

import { RolesGuard } from 'src/auth/login/guards/roles.guards';
import { hasRoles } from 'src/auth/login/decorator/roles.decorator';
import * as fs from 'fs';

export const storage = {
  storage: diskStorage({
      destination: './src/uploads/avatar',
      filename: (req, file, cb) => {
          const filename: string = path.parse(file.originalname).name.replace(/\s/g, '') + uuidv4();
          const extension: string = path.parse(file.originalname).ext;

          cb(null, `${filename}${extension}`)
      }
  })

}

@Controller('users')
export class UserController {

  constructor(
    private userService: UserService,
    private userHelperService: UserHelperService,
  ) { }

	@Post()
	async create(@Body() createUserDto: CreateUserDto): Promise<UserI> {
	  if ((await this.userService.findAllByUsername(createUserDto.username)).length  != 0) {
	    throw new HttpException('Username already in use', HttpStatus.CONFLICT);
	  }
	  const userEntity: UserI = this.userHelperService.createUserDtoToEntity(createUserDto);
	  return this.userService.create(userEntity);
	}

	@Get()
	async findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10): Promise<Pagination<UserEntity>> {
	  
	  limit = limit > 100 ? 100 : limit;
	  return this.userService.findAll({ page, limit, route: 'http://localhost:3000/api/users' });
	}

	@Get('/find-by-username')
	async findAllByUsername(@Query('username') username: string) {
	  return this.userService.findAllByUsername(username);
	}

	@Get('/find-by-level')
	async findAllByLevel() {
	  return this.userService.findAllByLevel();
	}

	@Get(':id')
	async findOne(@Param() params): Promise<UserI>{
		  return this.userService.findOne(params.id);
	}

  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto): Promise<LoginResponseI> {
	const userEntity: UserI = this.userHelperService.loginUserDtoToEntity(loginUserDto);
	const login = await this.userService.login(userEntity);
	let expiresIn = 10000;
	if (login.payload.twoFactorAuthEnabled)
		expiresIn = 30;
	return {
		access_token: login.jwt,
		token_type: 'JWT',
		expires_in: expiresIn,
		two_factor: login.payload.twoFactorAuthEnabled,
		id: login.payload.id,
	};
  }

	@UseGuards(JwtAuthGuard)
	@Put('logout')
	async logout(@Body() user: UserI): Promise<any> {
	  return this.userService.logout(user);
	}

	@hasRoles(UserRole.ADMIN, UserRole.OWNER)
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Put(':id/role')
	async updateRoleOfUser(@Param('id') id: string, @Body() user: UserI): Promise<UserI> {
	  return this.userService.updateRoleOfUser(Number(id), user);
	}

	@UseGuards(JwtAuthGuard)
	@Put(':id')
	async updateOne(@Param('id') id: string, @Body() user: UserI): Promise<any> {
	  if ((await this.userService.findAllByUsername(user.username)).length  != 0) {
		  throw new HttpException('Trying to add non-unique username', HttpStatus.CONFLICT);
	  }
	  return this.userService.updateOne(Number(id), user);
	}

	@UseGuards(JwtAuthGuard)
	@Post('upload')
	@UseInterceptors(FileInterceptor('file', storage))
	async uploadFile(@UploadedFile() file, @Request() req): Promise<Object> {
	    const user: UserI = await this.userService.findOne(req.user.id);
		// Remove old avatar
	    if (fs.existsSync('src/uploads/avatar/' + user.avatar) && user.avatar != "fallbackImage.png"){
			fs.unlinkSync('src/uploads/avatar/' + user.avatar)
		}
	    return this.userService.updateOneOb(user.id, {avatar: file.filename, image: true}).pipe(
	        map((user: UserI) => ({avatar: user.avatar}))
	    )
	}

	@Get('avatar/:imagename')
	findProfileImage(@Param('imagename') imagename, @Res() res): Observable<Object> {
	    return of(res.sendFile(join(process.cwd(), 'src/uploads/avatar/' + imagename)));
	}

	@Get('avatarById/:id')
	async findProfileImageById(@Param('id') id, @Res() res): Promise<Object> {
	    const user = await this.userService.findOne(id);
		if (user.avatar == "false")
			return null;
	    return of(res.sendFile(join(process.cwd(), 'src/uploads/avatar/' + user.avatar)));
	}

	@hasRoles(UserRole.ADMIN, UserRole.OWNER)
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Put('ban/:id')
	async updateBanOfUser(@Param('id') id: string, @Body() user: UserI): Promise<UserI> {
	  return this.userService.updateBanOfUser(Number(id), user);
	}

}

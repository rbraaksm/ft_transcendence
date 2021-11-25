import { Body, Controller, Param, Get, Put, Query, UseGuards } from '@nestjs/common';
import { Pagination } from 'nestjs-typeorm-paginate';
import { JwtAuthGuard } from '../../auth/login/guards/jwt.guard'
import { RolesGuard } from 'src/auth/login/guards/roles.guards';
import { hasRoles } from 'src/auth/login/decorator/roles.decorator';
import { RoomI, RoomType } from 'src/chat/model/room/room.interface';
import { RoomService } from 'src/chat/service/room-service/room.service';
import { UserI, UserRole } from 'src/user/model/user.interface';
import { Observable } from 'rxjs';


@Controller('room')
export class RoomController {

  constructor(
	private roomService: RoomService,
  ) { }

	@hasRoles(UserRole.ADMIN, UserRole.OWNER)
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Get()
	async getAllRoomAdmin(@Query('page') page: number = 1, @Query('limit') limit: number = 10): Promise<Pagination<RoomI>> {
	  limit = limit > 100 ? 100 : limit;
	  return this.roomService.getAllRoomAdmin({ page, limit, route: 'http://localhost:3000/api/room' });
	}

	@hasRoles(UserRole.ADMIN, UserRole.OWNER)
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Put(':id/admin/destroy')
	async closeRoomAdmin(@Param('id') id: string): Promise<RoomI> {
	  var room: RoomI = await this.roomService.getRoom(Number(id));
	  return this.roomService.changeTypeRoom(room, RoomType.CLOSE);
	}

	@hasRoles(UserRole.ADMIN, UserRole.OWNER)
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Put(':id/admin/give')
	async updateRoomUserForAdmin(@Param('id') id: string, @Body() user: UserI): Promise<RoomI> {  
	  var room: RoomI = await this.roomService.getRoom(Number(id));
	  return this.roomService.addAdminToRoom(room, user);
	}

	@hasRoles(UserRole.ADMIN, UserRole.OWNER)
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Put(':id/admin/remove')
	async updateRoomAdminForAdmin(@Param('id') id: string, @Body() user: UserI): Promise<RoomI> {
	  return this.roomService.deleteAUserAdminFromRoom(Number(id), user.id);
	}
	
	@UseGuards(JwtAuthGuard)
	@Get(':idRoom/:idUser')
	async UserIsRoom(@Param('idRoom') idRoom: number, @Param('idUser') idUser: number): Promise<Number> {
		var room: RoomI = await this.roomService.getRoom(idRoom);
		return this.roomService.boolUserIsOnRoom(idUser, room);
	}

	@UseGuards(JwtAuthGuard)
	@Get(':idRoom')
	async getRoom(@Param('idRoom') idRoom: number): Promise<RoomI> {
		return this.roomService.getRoom(idRoom);
	}

}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Observable, of } from 'rxjs';
import { AuthService } from 'src/auth/login/service/auth.service';
import { RoomEntity } from 'src/chat/model/room/room.entity';
import { RoomI, RoomType } from 'src/chat/model/room/room.interface';
import { UserI } from 'src/user/model/user.interface';
import { Repository, getConnection } from 'typeorm';
import { MessageService } from '../message/message.service';

@Injectable()
export class RoomService {


  constructor(
    @InjectRepository(RoomEntity)
    private readonly roomRepository: Repository<RoomEntity>,
	private authService: AuthService,
	private messageService: MessageService,
  ) { }

  async createRoom(room: RoomI, creator: UserI): Promise<RoomI> {
	if (room.password) {
		room.type = RoomType.PROTECTED;
		const passwordHash: string = await this.hashPassword(room.password);
		room.password = passwordHash;
	}
	room.owner = creator;
    const newRoom = await this.addCreatorToRoom(room, creator);
    const newRoomAdmin = await this.addAdminToRoom(newRoom, creator);	
    return this.roomRepository.save(newRoomAdmin);
  }

  async changePasswordRoom(room: RoomI, newPassword: string): Promise<RoomI> {
	  if (newPassword) {
		const passwordHash: string = await this.hashPassword(newPassword);
		room.password = passwordHash;
	}
    return this.roomRepository.save(room);
  }

  async changeTypeRoom(room: RoomI, newType: RoomType): Promise<RoomI> {
	room.type = newType;
    return this.roomRepository.save(room);
  }

  async getRoom(roomId: number): Promise<RoomI> {
    return this.roomRepository.findOne(roomId, {
      relations: ['users', 'owner', 'admin', 'muted'],
	  select: ['id', 'name', 'type', 'password']
    });
  }

  async saveRoom(room: RoomI): Promise<RoomI> {
	return this.roomRepository.save(room);
  }
  
  async getAllRoomAdmin(options: IPaginationOptions): Promise<Pagination<RoomI>> {
    const query = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.users', 'users')
      .leftJoinAndSelect('room.admin', 'all_admin')
      .leftJoinAndSelect('room.muted', 'all_muted')
      .leftJoinAndSelect('room.owner', 'onwner')
      .orderBy('room.updated_at', 'DESC');

    return paginate(query, options);
  }

  async getRoomsForUser(userId: number, options: IPaginationOptions): Promise<Pagination<RoomI>> {
	
	const query = this.roomRepository
		.createQueryBuilder('room')
		.leftJoinAndSelect('room.users', 'users')
		.where('users.id = :userId', { userId })
		.andWhere('room.type != :type', { type: RoomType.CLOSE })
		.leftJoinAndSelect('room.admin', 'all_admin')
		.leftJoinAndSelect('room.muted', 'all_muted')
		.leftJoinAndSelect('room.owner', 'onwner')
		.orderBy('room.updated_at', 'DESC');
	
	return paginate(query, options);
  }

  async getAllRoom(options: IPaginationOptions): Promise<Pagination<RoomI>> {
	
	const query = this.roomRepository
		.createQueryBuilder('room')
		.where('room.type != :p', { p: RoomType.PRIVATE })
		.andWhere('room.type != :c', { c: RoomType.CLOSE })
		.orderBy('room.updated_at', 'DESC');
	
	return paginate(query, options);
  }

  async addUserToRoom(roomId: number, user: UserI, password: string): Promise<Observable<{ error: string } | { success: string }>> {
	  const room = await this.getRoom(roomId);
	const bool: number = await this.boolUserIsOnRoom(user.id, room);
	if (bool) return of({ error: 'Already on the room;' }); 
	if (room.type == RoomType.PRIVATE) return of({ error: 'Can\'t join private room;' }); 
	if (room.type == RoomType.CLOSE) return of({ error: 'Can\'t join room closed;' }); 
	if (room.type == RoomType.PUBLIC) {
		const newRoom = await this.addCreatorToRoom(room, user);		
		this.roomRepository.save(newRoom);
		return of({ success: 'Room joined;' });
	}
	if (room.type == RoomType.PROTECTED) {
		const matches: boolean = await this.validatePassword(password, room.password);
		if (matches) {
			const newRoom = await this.addCreatorToRoom(room, user);
			this.roomRepository.save(newRoom);
			return of({ success: 'Room joined;' }); 
		}
		return of({ error: 'Bad password;' }); 
	}	
  }

  async addCreatorToRoom(room: RoomI, creator: UserI): Promise<RoomI> {
    room.users.push(creator);
    return room;
  }

  async addAdminToRoom(room: RoomI, user: UserI): Promise<RoomI> {
    room.admin.push(user);
    return room;
  }

  async addMutedToRoom(room: RoomI, user: UserI): Promise<RoomI> {
    room.muted.push(user);
    return room;
  }

  	private async hashPassword(password: string): Promise<string> {
		return this.authService.hashPassword(password);
	}

	private async validatePassword(password: string, storedPasswordHash: string): Promise<any> {
		return this.authService.comparePasswords(password, storedPasswordHash);
	}

  async deleteAUserFromRoom(roomId: number, userId: number): Promise<RoomI> {
	const room = await this.getRoom(roomId);
	
	if (room.owner.id === userId) {
		this.messageService.deleteAllMessagesForRoom(room);
		room.type = RoomType.CLOSE;
		return this.roomRepository.save(room);
	}
	room.users = room.users.filter(user => user.id !== userId);
	room.admin = room.admin.filter(user => user.id !== userId);	

	return this.roomRepository.save(room);
  }

  async deleteAUserMutedFromRoom(roomId: number, userId: number): Promise<RoomI> {
	const room = await this.getRoom(roomId);
	room.muted = room.muted.filter(user => user.id !== userId);

	return this.roomRepository.save(room);
  }

  async deleteAUserAdminFromRoom(roomId: number, userId: number): Promise<RoomI> {
	const room = await this.getRoom(roomId);
	room.admin = room.admin.filter(user => user.id !== userId);
	
	return this.roomRepository.save(room);
  }

  boolUserMutedOnRoom(userId: number, room: RoomI): Promise<number> {
	const query = this.roomRepository
	.createQueryBuilder('room')
    .leftJoinAndSelect('room.muted', 'muted')
    .where('muted.id = :userId', { userId })
	.andWhere("room.id = :rid", { rid: room.id })
	.getCount();

	return  (query);
  }

  boolUserIsOnRoom(userId: number, room: RoomI): Promise<number> {
	const query = this.roomRepository
    .createQueryBuilder('room')
    .leftJoinAndSelect('room.users', 'users')
    .where('users.id = :userId', { userId })
	.andWhere("room.id = :rid", { rid: room.id })
	.getCount();

	return  (query);
  }

  boolUserIsAdminOnRoom(userId: number, room: RoomI): Promise<number> {
	const query = this.roomRepository
	.createQueryBuilder('room')
    .leftJoinAndSelect('room.admin', 'admin')
    .where('admin.id = :userId', { userId })
	.andWhere("room.id = :rid", { rid: room.id })
	.getCount();

	return  (query);
  }
  
  async findOne(id: number): Promise<RoomI> {
	return this.roomRepository.findOne({ id });
}

}

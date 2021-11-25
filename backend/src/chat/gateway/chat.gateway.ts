import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { AuthService } from 'src/auth/login/service/auth.service';
import { Socket, Server } from 'socket.io';
import { UserI, UserRole } from 'src/user/model/user.interface';
import { UserService } from 'src/user/service/user-service/user.service';
import { UnauthorizedException } from '@nestjs/common';
import { RoomService } from '../service/room-service/room.service';
import { PageI } from '../model/page.interface';
import { ConnectedUserService } from '../service/connected-user/connected-user.service';
import { RoomI, RoomType } from '../model/room/room.interface';
import { ConnectedUserI } from '../model/connected-user/connected-user.interface';
import { JoinedRoomService } from '../service/joined-room/joined-room.service';
import { MessageService } from '../service/message/message.service';
import { MessageI } from '../model/message/message.interface';
import { JoinedRoomI } from '../model/joined-room/joined-room.interface';
import { FriendsService } from 'src/friends/service/friends.service';

@WebSocketGateway({ cors: true })
export class ChatGateway{

  @WebSocketServer()
  server: Server;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private friendsService: FriendsService,
    private roomService: RoomService,
    private connectedUserService: ConnectedUserService,
    private joinedRoomService: JoinedRoomService,
    private messageService: MessageService) { }

  async onModuleInit() {
    await this.connectedUserService.deleteAll();
    await this.joinedRoomService.deleteAll();
  }

  async handleConnection(socket: Socket) {
    try {
      const decodedToken = await this.authService.verifyJwt(socket.handshake.headers.authorization);
      const user: UserI = await this.userService.getOne(decodedToken.user.id);
      if (!user) {
        return this.disconnect(socket);
      } else {
        socket.data.user = user;
        const rooms = await this.roomService.getRoomsForUser(user.id, { page: 1, limit: 10 });
        // substract page -1 to match the angular material paginator
        rooms.meta.currentPage = rooms.meta.currentPage - 1;
        // Save connection to DB
        await this.connectedUserService.create({ socketId: socket.id, user });
        // Only emit rooms to the specific connected client
        return this.server.to(socket.id).emit('rooms', rooms);
      }
    } catch {
      return this.disconnect(socket);
    }
  }

  async handleDisconnect(socket: Socket) {
    // remove connection from DB
    await this.connectedUserService.deleteBySocketId(socket.id);
    socket.disconnect();
  }

  private disconnect(socket: Socket) {
    socket.emit('Error', new UnauthorizedException());
    socket.disconnect();
  }

  @SubscribeMessage('createRoom')
  async onCreateRoom(socket: Socket, room: RoomI) {
    const createdRoom: RoomI = await this.roomService.createRoom(room, socket.data.user);

    for (const user of createdRoom.users) {
      const connections: ConnectedUserI[] = await this.connectedUserService.findByUser(user);
      const rooms = await this.roomService.getRoomsForUser(user.id, { page: 1, limit: 10 });
      // substract page -1 to match the angular material paginator
      rooms.meta.currentPage = rooms.meta.currentPage - 1;
      for (const connection of connections) {
        await this.server.to(connection.socketId).emit('rooms', rooms);
      }
    }
  }

  @SubscribeMessage('paginateRooms')
  async onPaginateRoom(socket: Socket, page: PageI) {
    if (!socket || !socket.data || !socket.data.user)
      return ;
    const rooms = await this.roomService.getRoomsForUser(socket.data.user.id, this.handleIncomingPageRequest(page));
    // substract page -1 to match the angular material paginator
    rooms.meta.currentPage = rooms.meta.currentPage - 1;
    return this.server.to(socket.id).emit('rooms', rooms);
  }

  @SubscribeMessage('joinRoom')
  async onJoinRoom(socket: Socket, room: RoomI) {
    const messages = await this.messageService.findMessagesForRoom(room, socket.data.user, { limit: 30, page: 1 });
    messages.meta.currentPage = messages.meta.currentPage - 1;
    // Save Connection to Room
    await this.joinedRoomService.create({ socketId: socket.id, user: socket.data.user, userId: socket.data.user.id, room });
    // Send last messages from Room to User
    await this.server.to(socket.id).emit('messages', messages);
  }

  @SubscribeMessage('leaveJoinRoom')
  async onleaveJoinRoom(socket: Socket) {
    // remove connection from JoinedRooms
    await this.joinedRoomService.deleteBySocketId(socket.id);
  }

  @SubscribeMessage('leaveRoom')
  async leaveRoom(socket: Socket, room: RoomI) {
    // remove user from Room
    await this.roomService.deleteAUserFromRoom(room.id, socket.data.user.id);
  }

  // get all room (public and protected)
  @SubscribeMessage('allRoom')
  async allRoom(socket: Socket, page: PageI) {
	const rooms = await this.roomService.getAllRoom(this.handleIncomingPageRequest(page));
    // substract page -1 to match the angular material paginator
    rooms.meta.currentPage = rooms.meta.currentPage - 1;
    return this.server.to(socket.id).emit('allrooms', rooms);
  }

  // add user
  @SubscribeMessage('addUser')
  async addUser(socket: Socket, data: any) {
	  let room : RoomI = data.room;
	  const password = data.password;
    await this.roomService.addUserToRoom(room.id, socket.data.user, password);
  }

  // Add admin
  @SubscribeMessage('addAdmin')
  async addAdmin(socket: Socket, data: any) {
	let room : RoomI = data.room;
	let user : UserI = data.user;

	let bool: Number = await this.roomService.boolUserIsAdminOnRoom(socket.data.user.id, room);
	if (socket.data.user.role == UserRole.ADMIN || socket.data.user.role == UserRole.OWNER) {
		bool = 1;
	}

	if (bool) await this.roomService.addAdminToRoom(room, user);
	this.roomService.saveRoom(room);
  }

  // add muted
  @SubscribeMessage('addMuted')
  async addMuted(socket: Socket, data: any) {
	let room : RoomI = data.room;
	let user : UserI = data.user;
	const bool: Number = await this.roomService.boolUserIsAdminOnRoom(socket.data.user.id, room);
	if (bool && user != room.owner) await this.roomService.addMutedToRoom(room, user);
	this.roomService.saveRoom(room);
  }

  // remove user
  @SubscribeMessage('removeUser')
  async removeUser(socket: Socket, data: any) {
	let room : RoomI = data.room;
	let user : UserI = data.user;
	const bool: Number = await this.roomService.boolUserIsAdminOnRoom(socket.data.user.id, room);
	if (bool && user.id != room.owner.id) {
		await this.roomService.deleteAUserFromRoom(room.id, user.id);
		const connections: ConnectedUserI[] = await this.connectedUserService.findByUser(user);
		const rooms = await this.roomService.getRoomsForUser(user.id, { page: 1, limit: 10 });
      	// substract page -1 to match the angular material paginator
      	rooms.meta.currentPage = rooms.meta.currentPage - 1;
      	for (const connection of connections) {
      	  await this.server.to(connection.socketId).emit('rooms', rooms);
		}
	}
  }

  // remove admin
  @SubscribeMessage('removeAdmin')
  async removeAdmin(socket: Socket, data: any) {
	let room : RoomI = data.room;
	let user : UserI = data.user;
	const bool: Number = await this.roomService.boolUserIsAdminOnRoom(socket.data.user.id, room);
	if (bool && user != room.owner) await this.roomService.deleteAUserAdminFromRoom(room.id, user.id);
  }

   // remove muted
   @SubscribeMessage('removeMuted')
   async removeMuted(socket: Socket, data: any) {
	let room : RoomI = data.room;
	let user : UserI = data.user;
	 const bool: Number = await this.roomService.boolUserIsAdminOnRoom(socket.data.user.id, room);
	 if (bool) await this.roomService.deleteAUserMutedFromRoom(room.id, user.id);
   }

  // try join channel
  @SubscribeMessage('tryJoinChannel')
   async tryJoinChannel(socket: Socket, data: any) {
	  let room : RoomI = data.room;
	  const password = data.password;
	await this.roomService.addUserToRoom(room.id, socket.data.user, password);
   }

  // change password
  @SubscribeMessage('changePassword')
   async changePassword(socket: Socket, data: any) {
	  let room : RoomI = data.room;
	  const password = data.password;
	if (room.owner.id == socket.data.user.id) await this.roomService.changePasswordRoom(room, password);
   }

  // change type room
  @SubscribeMessage('changeType')
   async changeType(socket: Socket, data: any) {
	let room : RoomI = data.room;
	let type : RoomType = data.type;
	const password = data.password;

	if (room.owner.id == socket.data.user.id) {
		if (type == RoomType.PROTECTED) {
			if (room.password != null && password == null){
				await this.roomService.changeTypeRoom(room, type);
			}
			else if (password != null) {
				await this.roomService.changePasswordRoom(room, password);
				await this.roomService.changeTypeRoom(room, type);
			}
		}
		else
			await this.roomService.changeTypeRoom(room, type);
	}
   }

  @SubscribeMessage('addMessage')
  async onAddMessage(socket: Socket, message: MessageI) {
	const bool: number = await this.roomService.boolUserMutedOnRoom(socket.data.user.id, message.room);
    if (!bool) {
		const createdMessage: MessageI = await this.messageService.create({...message, user: socket.data.user});
		const room: RoomI = await this.roomService.getRoom(createdMessage.room.id);
		const joinedUsers: JoinedRoomI[] = await this.joinedRoomService.findByRoom(room);
		for(const user of joinedUsers) {
			const nu = await this.friendsService.boolUserIsBlocked(user.userId, createdMessage.user.id);
			if (!nu) await this.server.to(user.socketId).emit('messageAdded', createdMessage);
		}
	}
  }

  @SubscribeMessage('gameMessage')
  async onGameMessage(socket: Socket, data: {message: MessageI, id: number, type: number}) {
    const createdMessage: MessageI = await this.messageService.create({...data.message, user: socket.data.user});
    const room: RoomI = await this.roomService.getRoom(createdMessage.room.id);
    const joinedUsers: JoinedRoomI[] = await this.joinedRoomService.findByRoom(room);
    this.server.to(socket.id).emit('startGame', {room: room, u_id: data.id, type: data.type, m_id: createdMessage.id});
    for(const user of joinedUsers) {
		const nu = await this.friendsService.boolUserIsBlocked(user.userId, createdMessage.user.id);
		if (!nu) await this.server.to(user.socketId).emit('messageAdded', createdMessage);
    }
  }

  private handleIncomingPageRequest(page: PageI) {
    page.limit = page.limit > 100 ? 100 : page.limit;
    // add page +1 to match angular material paginator
    page.page = page.page + 1;
    return page;
  }
}
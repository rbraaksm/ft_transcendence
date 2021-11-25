import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { AuthService } from 'src/auth/login/service/auth.service';
import { Socket, Server } from 'socket.io';
import { UserI, UserStatus } from 'src/user/model/user.interface';
import { UserService } from 'src/user/service/user-service/user.service';
import { HistoryService } from 'src/history/service/history.service';
import { HistoryI } from 'src/history/model/history.interface';
import { OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { GameStateI } from 'src/match/model/game-state/game-state.interface';
import { PlayerI } from 'src/match/model/player/player.interface';
import { CoordinatesI } from 'src/match/model/coordinates/coordinates.interface';
import { PowerI } from 'src/match/model/powers/powers.interface';
import { LobbyI } from 'src/match/model/lobby/lobby.interface';
import { type } from 'os';
import { Console } from 'console';
import { FriendsService } from 'src/friends/service/friends.service';
import { UpdateDateColumn } from 'typeorm';
import { GameService } from './service/game/game.service';
import { GameRoomService } from './service/gameroom/gameroom.service';
import { RoomI } from 'src/chat/model/room/room.interface';
import { RoomService } from 'src/chat/service/room-service/room.service';
import { MIN_DATE } from 'class-validator';

@WebSocketGateway({ cors: true })
export class MatchGateway{

  @WebSocketServer()
  server: Server;

  //Setting up base Interfaces for both game modes
  n_ball: CoordinatesI = {
    x: 200,
    y: 150,
    dx: 1,
    dy: -1,
    width: 10,
    height: 10,
    speedmultiplier: 2,
  };
  //Setting up base Interfaces for both game modes
  b_ball: CoordinatesI = {
    x: 200,
    y: 150,
    dx: 1,
    dy: -1,
    width: 10,
    height: 10,
    speedmultiplier: 2,
  };
  //Setting up base Interfaces for both game modes
  n_gamestate: GameStateI = {
    userServices: this.userService,
    historyServices: this.historyService,
    player1: null,
    player2: null,
    spectators: [],
    ball: null,
    type: 0,
  };
  //Setting up base Interfaces for both game modes
  b_gamestate: GameStateI = {
    userServices: this.userService,
    historyServices: this.historyService,
    player1: null,
    player2: null,
    spectators: [],
    ball: null,
    type: 1,
    powers: [],
  };

  //Lists In which Rooms will be added through matchmaking
  lobby_list: LobbyI = {
    normalRooms: [this.n_gamestate],
    blitzRooms: [this.b_gamestate],
    privateRooms: [],
  };

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private historyService: HistoryService,
    private friendsService: FriendsService,
    private gameService: GameService,
    private gameRoomService: GameRoomService) { }

  @SubscribeMessage('CreatePrivateGame')
  async onPrivateGame(n_socket: Socket, data: {room: RoomI, user: number, type: number, m_id: number}) {
    let id_num: number[] = await this.gameRoomService.UpdateRooms(this.lobby_list, this.server);
    this.p_id = id_num[2];
    this.b_id = id_num[1];
    this.n_id = id_num[0];
    let p_gamestate: GameStateI = {
      userServices: this.userService,
      historyServices: this.historyService,
      player1: null,
      player2: null,
      spectators: [],
      ball: null,
      type: data.type,
      powers: [],
      room: data.room,
      p_id: data.m_id,
    };
    let n_paddle: CoordinatesI = {
      x: 0,
      y: 120,
      dx: 0,
      dy: 0,
      width: 10,
      height: 60,
      speedmultiplier: 1,
    };
    //Get UserI from received ID to synchronise with n_players info
    const payload = await this.userService.findOne(data.user);
    payload.status = UserStatus.GAME;
    this.userService.updateOne(payload.id, payload);
    let n_player: PlayerI = {
      user: payload,
      socket: n_socket,
      paddle: n_paddle,
      points: 0,
    };
    p_gamestate.player1 = n_player;
    this.lobby_list.privateRooms.push(p_gamestate);

	
  }

  @SubscribeMessage('newPrivatePlayer')
  async onNewPrivatePlayer(n_socket: Socket, data: {room: RoomI, user: number, m_id: number}) {
    let id_num: number[] = await this.gameRoomService.UpdateRooms(this.lobby_list, this.server);
    this.p_id = id_num[2];
    this.b_id = id_num[1];
    this.n_id = id_num[0];
    let game: GameStateI = this.gameRoomService.findGameByMessageId(this.lobby_list, data.m_id);
    if (!game)
    {
      console.log("not found")
      return ;
    }
    const payload = await this.userService.findOne(data.user);
    payload.status = UserStatus.GAME;
    this.userService.updateOne(payload.id, payload);
    let p_paddle: CoordinatesI = {
      x: 400,
      y: 120,
      dx: 0,
      dy: 0,
      width: 10,
      height: 60,
      speedmultiplier: 1,
    };
    let p_player: PlayerI = {
      user: payload,
      socket: n_socket,
      paddle: p_paddle,
      points: 0,
    };
    if (game.player1.user.id == data.user)
      game.player1.socket = n_socket;
    else if (game.player2)
    {
      game.spectators.push(p_player);
      this.server.to(p_player.socket.id).emit('name', 2);
    }
    else
    {
      let p_ball: CoordinatesI = {
        x: 200,
        y: 150,
        dx: 1,
        dy: -1,
        width: 10,
        height: 10,
        speedmultiplier: 2,
      };
      game.player2 = p_player;
      game.ball = p_ball;
      const loopInterval = 1000 / 60;
      let gamestate = game;
      let server = this.server;
      if (Math.random() < 0.5)
        this.gameService.RespawnBall(game.ball, 1);
      else
        this.gameService.RespawnBall(game.ball, -1);
      //Start Room's Game Loop
      let gameService = this.gameService;
      let gameRoomService = this.gameRoomService;
      gamestate.id = setInterval(function() {gameService.loopFunction(gamestate, server, gameRoomService);}, loopInterval);
      //Send Players their room's id
      server.to(game.player2.socket.id).emit('id', [this.p_id, 2]);
      server.to(game.player1.socket.id).emit('id', [this.p_id, 2]);
      server.to(game.player1.socket.id).emit('name', 0);
      server.to(game.player2.socket.id).emit('name', 1);
      server.to(game.player1.socket.id).emit('score', [0, 0]);
      server.to(game.player2.socket.id).emit('score', [0, 0]);
      this.p_id++;
    }
  }

  //----------------------------------------CONNECTION HANDLER-------------------------------------------
  players = 0;
  n_id = 0;
  b_id = 0;
  p_id = 0;
  //When a new player connects to the game (data -> gamemode | user id)
  @SubscribeMessage('newPlayer')
  async onNewPlayer(n_socket: Socket, data: number[]) {
    if (this.gameRoomService.checkConnection(this.n_gamestate) == 2)
      this.n_gamestate.player1 = null;
    if (this.gameRoomService.checkConnection(this.b_gamestate) == 2)
      this.b_gamestate.player1 = null;

    //Update rooms to facilitate setup
    let id_num: number[] = await this.gameRoomService.UpdateRooms(this.lobby_list, this.server);
    this.p_id = id_num[2];
    this.b_id = id_num[1];
    this.n_id = id_num[0];
    let n_paddle: CoordinatesI = {
      x: 0,
      y: 120,
      dx: 0,
      dy: 0,
      width: 10,
      height: 60,
      speedmultiplier: 1,
    };

    //Get UserI from received ID to synchronise with n_players info
    const payload = await this.userService.findOne(data[1]);
    if (payload === undefined)
      return;
    payload.status = UserStatus.GAME;
    this.userService.updateOne(payload.id, payload);
    let n_player: PlayerI = {
      user: payload,
      socket: n_socket,
      paddle: n_paddle,
      points: 0,
    };

    //Enter player in first available space in chosen gamemode
    if (!this.n_gamestate.player1 && data[0] == 0)
    {
      this.players++;
      this.n_gamestate.player1 = n_player;
    }
    else if (!this.n_gamestate.player2 && data[0] == 0)
    {
      this.players++;
      this.n_gamestate.player2 = n_player;
      n_player.paddle.x = 400
    }
    if (!this.b_gamestate.player1 && data[0] == 1)
    {
      this.players++;
      this.b_gamestate.player1 = n_player;
    }
    else if (!this.b_gamestate.player2 && data[0] == 1)
    {
      this.players++;
      this.b_gamestate.player2 = n_player;
      n_player.paddle.x = 400
    }
    else if (data[0] == 2)
    {
      //Randomly affect a normal game to a spectator
      let room_nb : number;
      this.server.to(n_player.socket.id).emit('name', 2);
	  room_nb = Math.floor(Math.random() * (this.lobby_list.normalRooms.length - 1));
	  this.lobby_list.normalRooms[room_nb].spectators.push(n_player);
	  if (this.lobby_list.normalRooms[room_nb].player1 && this.lobby_list.normalRooms[room_nb].player2)
        this.server.to(n_player.socket.id).emit('score', [this.lobby_list.normalRooms[room_nb].player1.points,this.lobby_list.normalRooms[room_nb].player2.points]);
    }
    //once oth players are present in a game launch it
    if (this.n_gamestate.player2)
    {
      this.n_gamestate.ball = this.n_ball;
      const loopInterval = 1000 / 60;
      let gamestate = this.n_gamestate;
      let server = this.server;
      if (Math.random() < 0.5)
        this.gameService.RespawnBall(this.n_gamestate.ball, 1);
      else
        this.gameService.RespawnBall(this.n_gamestate.ball, -1);
      //Start Room's Game Loop
      let gameService = this.gameService;
      let gameRoomService = this.gameRoomService;
      gamestate.id = setInterval(function() {gameService.loopFunction(gamestate, server, gameRoomService);}, loopInterval);
      //Send Players their room's id
      server.to(this.n_gamestate.player2.socket.id).emit('id', [this.n_id, 0]);
      server.to(this.n_gamestate.player1.socket.id).emit('id', [this.n_id, 0]);
      server.to(this.n_gamestate.player1.socket.id).emit('name', 0);
      server.to(this.n_gamestate.player2.socket.id).emit('name', 1);
      server.to(this.n_gamestate.player1.socket.id).emit('score', [0, 0]);
      server.to(this.n_gamestate.player2.socket.id).emit('score', [0, 0]);

      //Reset info for next room
      this.n_ball = {
        x: 50,
        y: 50,
        dx: -50,
        dy: 0,
        width: 10,
        height: 10,
        speedmultiplier: 1,
      };
      this.n_gamestate = {
        userServices: this.userService,
        historyServices: this.historyService,
        player1: null,
        player2: null,
        spectators: [],
        ball: null,
        type: 0,
      };
      this.players = 0;
      //Push empty room to back of array
      if (undefined !== this.lobby_list)
        this.lobby_list.normalRooms.push(this.n_gamestate);
    }
    else if (this.b_gamestate.player2)
    {
      this.b_gamestate.ball = this.b_ball;
      const loopInterval = 1000 / 60;
      let gamestate = this.b_gamestate;
      let server = this.server;
      if (Math.random() < 0.5)
        this.gameService.RespawnBall(this.b_gamestate.ball, 1);
      else
        this.gameService.RespawnBall(this.b_gamestate.ball, 1);
      //Start Room's Game Loop
      let gameService = this.gameService;
      let gameRoomService = this.gameRoomService;
      gamestate.id = setInterval(function() {gameService.loopFunction(gamestate, server, gameRoomService);}, loopInterval);
      //Send Players their room's id
      server.to(this.b_gamestate.player2.socket.id).emit('id', [this.b_id, 1]);
      server.to(this.b_gamestate.player1.socket.id).emit('id', [this.b_id, 1]);
      server.to(this.b_gamestate.player1.socket.id).emit('name', 0);
      server.to(this.b_gamestate.player2.socket.id).emit('name', 1);
      server.to(this.b_gamestate.player1.socket.id).emit('score', [0, 0]);
      server.to(this.b_gamestate.player2.socket.id).emit('score', [0, 0]);

      //Reset info for next room
      this.b_ball = {
        x: 50,
        y: 50,
        dx: -50,
        dy: 0,
        width: 10,
        height: 10,
        speedmultiplier: 1,
      };
      this.b_gamestate = {
        userServices: this.userService,
        historyServices: this.historyService,
        player1: null,
        player2: null,
        spectators: [],
        ball: null,
		powers: [],
        type: 1,
      };
      this.players = 0;
      //Push empty room to back of array
      if (undefined !== this.lobby_list)
        this.lobby_list.blitzRooms.push(this.b_gamestate);
    }
  }

  @SubscribeMessage('checkExistence')
  async checkExist(socket: Socket, data: number)
  {
    let id_num: number[] = await this.gameRoomService.UpdateRooms(this.lobby_list, this.server);
    this.p_id = id_num[2];
    this.b_id = id_num[1];
    this.n_id = id_num[0];
    const payload = await this.userService.findOne(data);
    this.gameRoomService.checkIfAlready(this.lobby_list, payload, socket, this.server);

    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }

  @SubscribeMessage('logoutPlayer')
  async logout(socket: Socket, data: number)
  {
    let found: boolean = false;
    this.lobby_list.normalRooms.forEach(room => {
      if (room.player1 && room.player2 && room.player1.socket.id == socket.id)
      {
        room.player1.paddle.speedmultiplier = -1;
        room.player2.points = 5;
        return ;
      }
      if (room.player1 && room.player2 && room.player2.socket.id == socket.id)
      {
        room.player2.paddle.speedmultiplier = -1;
        room.player1.points = 5;
        return ;
      }
    });
    this.lobby_list.blitzRooms.forEach(room => {
        if (room.player1 && room.player2 && room.player1.socket.id == socket.id)
        {
          room.player1.paddle.speedmultiplier = -1;
          room.player2.points = 5;
          return ;
        }
        if (room.player1 && room.player2 && room.player2.socket.id == socket.id)
        {
          room.player2.paddle.speedmultiplier = -1;
          room.player1.points = 5;
          return ;
        }
      });
    this.lobby_list.privateRooms.forEach(room => {
      if (room.player1 && room.player2 && room.player1.socket.id == socket.id)
      {
        room.player1.paddle.speedmultiplier = -1;
        room.player2.points = 5;
        return ;
      }
      if (room.player1 && room.player2 && room.player2.socket.id == socket.id)
      {
        room.player2.paddle.speedmultiplier = -1;
        room.player1.points = 5;
        return ;
      }
    });
  }

  //Paddle Movement handler Using room id and more
  @SubscribeMessage('paddle')
  async onPaddleMove(socket: Socket, data: number[]) {
    if (data !== null && data[2] == 0)
    {
      if (undefined !== this.lobby_list && this.lobby_list.normalRooms.length > data[1])
      {
        if (socket.id == this.lobby_list.normalRooms[data[1]].player1.socket.id)
        {
          if (data[0] == 0)
            this.lobby_list.normalRooms[data[1]].player1.paddle.dy = 0;
          else
            this.lobby_list.normalRooms[data[1]].player1.paddle.dy = data[0] < 0 ? 3: -3;
        }
        else if (socket.id == this.lobby_list.normalRooms[data[1]].player2.socket.id)
        {
          if (data[0] == 0)
            this.lobby_list.normalRooms[data[1]].player2.paddle.dy = 0;
          else
            this.lobby_list.normalRooms[data[1]].player2.paddle.dy = data[0] < 0 ? 3: -3;
        }
      }
    }
    else if (data !== null && data[2] == 1)
    {
      if (undefined !== this.lobby_list && this.lobby_list.blitzRooms.length > data[1])
      {
        if (socket.id == this.lobby_list.blitzRooms[data[1]].player1.socket.id)
        {
          if (data[0] == 0)
            this.lobby_list.blitzRooms[data[1]].player1.paddle.dy = 0;
          else
            this.lobby_list.blitzRooms[data[1]].player1.paddle.dy = data[0] < 0 ? 3: -3;
        }
        else if (socket.id == this.lobby_list.blitzRooms[data[1]].player2.socket.id)
        {
          if (data[0] == 0)
            this.lobby_list.blitzRooms[data[1]].player2.paddle.dy = 0;
          else
            this.lobby_list.blitzRooms[data[1]].player2.paddle.dy = data[0] < 0 ? 3: -3;
        }
      }
    }
    else if (data !== null && data[2] == 2)
    {
      if (undefined !== this.lobby_list && this.lobby_list.privateRooms.length > data[1])
      {
        if (socket.id == this.lobby_list.privateRooms[data[1]].player1.socket.id)
        {
          if (data[0] == 0)
            this.lobby_list.privateRooms[data[1]].player1.paddle.dy = 0;
          else
            this.lobby_list.privateRooms[data[1]].player1.paddle.dy = data[0] < 0 ? 3: -3;
        }
        else if (socket.id == this.lobby_list.privateRooms[data[1]].player2.socket.id)
        {
          if (data[0] == 0)
            this.lobby_list.privateRooms[data[1]].player2.paddle.dy = 0;
          else
            this.lobby_list.privateRooms[data[1]].player2.paddle.dy = data[0] < 0 ? 3: -3;
        }
      }
    }
  }

  @SubscribeMessage('specRoom')
  async onspectate(socket: Socket, data: number[]) {
    const payload = await this.userService.findOne(data[1]);
    if (payload === undefined)
      return ;
    this.userService.updateOne(payload.id, payload);
    let game: GameStateI = this.gameRoomService.findGameById(this.lobby_list, data[0]);
    if (game != null)
    {
      let n_player: PlayerI = {
        user: payload,
        socket: socket,
        paddle: null,
        points: 0,
      };

      game.spectators.push(n_player);
      this.server.to(n_player.socket.id).emit('name', 2);
      if (game.player1 && game.player2)
        this.server.to(n_player.socket.id).emit('score', [game.player1.points, game.player2.points]);
    }
  }

}
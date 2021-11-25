import { Injectable } from '@nestjs/common';
import { CoordinatesI } from 'src/match/model/coordinates/coordinates.interface';
import { LobbyI } from 'src/match/model/lobby/lobby.interface';
import { Socket, Server } from 'socket.io';
import { UserI, UserStatus} from 'src/user/model/user.interface';
import { GameStateI } from 'src/match/model/game-state/game-state.interface';
import { UserService } from 'src/user/service/user-service/user.service';
import { HistoryI } from 'src/history/model/history.interface';
import { RoomI } from 'src/chat/model/room/room.interface';

@Injectable()
export class GameRoomService {

  constructor(private userService: UserService){};

  public findGameByMessageId(lobbies: LobbyI, id: number)
  {
    for (const room of lobbies.privateRooms)
    {
      if (room.p_id && room.p_id == id)
      {
        return(room);
      }
    }
  }

  public findGameById(lobbies: LobbyI, id: number)
  {
    for (const room of lobbies.privateRooms)
    {
      if (room.player1 && room.player1.user.id == id)
        return room;
      if (room.player2 && room.player2.user.id == id)
        return room;
    }
    for (const room of lobbies.normalRooms)
    {
      if (room.player1 && room.player1.user.id == id)
        return room;
      if (room.player2 && room.player2.user.id == id)
        return room;
    }
    for (const room of lobbies.blitzRooms)
    {
      if (room.player1 && room.player1.user.id == id)
        return room;
      if (room.player2 && room.player2.user.id == id)
        return room;
    }
    return null;
  }

  //Remove unused Rooms and change id's to coincide with new order
  public async UpdateRooms(lobbies: LobbyI, server: Server)
  {
    let i : number = 0;
    let y : number = 0;
    lobbies.normalRooms.forEach(room => {
      if (room.type < 0)
      {
        lobbies.normalRooms.splice(i, 1);
        y--;
      }
      else if (y != i && lobbies.normalRooms[y].ball != null)
      {
        server.to(lobbies.normalRooms[y].player1.socket.id).emit('id', [y, 0]);
        server.to(lobbies.normalRooms[y].player2.socket.id).emit('id', [y, 0]);
      }
      i++;
      y++;
    });
    i = 0;
    y = 0;
    lobbies.blitzRooms.forEach(room => {
      if (room.type < 0)
      {
        lobbies.blitzRooms.splice(i, 1);
        y--;
      }
      else if (y != i && lobbies.blitzRooms[y].ball != null)
      {
        server.to(lobbies.blitzRooms[y].player1.socket.id).emit('id', [y, 1]);
        server.to(lobbies.blitzRooms[y].player2.socket.id).emit('id', [y, 1]);
      }
      y++;
      i++;
    });
    i = 0;
    y = 0;
    lobbies.privateRooms.forEach(room => {
      if (room.type < 0)
      {
        lobbies.privateRooms.splice(i, 1);
        y--;
      }
      else if (y != i && lobbies.privateRooms[y].ball != null)
      {
        server.to(lobbies.privateRooms[y].player1.socket.id).emit('id', [y, 2]);
        server.to(lobbies.privateRooms[y].player2.socket.id).emit('id', [y, 2]);
      }
      y++;
      i++;
    });
    let n_id = lobbies.normalRooms.length - 1;
    let b_id = lobbies.blitzRooms.length - 1;
    let p_id = lobbies.privateRooms.length - 1;
    return ([n_id, b_id, p_id]);
  }

  private checkAll(room: GameStateI, user: UserI, socket: Socket, server: Server, opt: number, id: number)
  {
    if (room.player1 && room.player1.user.id == user.id)
    {
      if (!room.player2 && opt != 2)
      {
        room.player1 = null;
        return 2;
      }
      if (room.player1.socket != socket)
        server.to(room.player1.socket.id).emit('done', 1);
      room.player1.socket = socket;
      if (room.player1 && room.player2)
        server.to(room.player1.socket.id).emit('score', [room.player1.points, room.player2.points]);
      server.to(room.player1.socket.id).emit('exists', 0);
      server.to(room.player1.socket.id).emit('name', 0);
      server.to(room.player1.socket.id).emit('id', [id,opt]);
      if (room.player2 && room.player2.socket)
        server.to(room.player2.socket.id).emit('id', [id,opt]);
      return 1;
    }
    if (room.player2 && room.player2.user.id == user.id)
    {
      if (!room.player1 && opt != 2)
      {
        room.player2 = null;
        return 2;
      }
      if (room.player2.socket != socket)
        server.to(room.player2.socket.id).emit('done', 1);
      room.player2.socket = socket;
      if (room.player1 && room.player2)
        server.to(room.player2.socket.id).emit('score', [room.player1.points, room.player2.points]);
      server.to(room.player2.socket.id).emit('exists', 0);
      server.to(room.player2.socket.id).emit('name', 1);
      server.to(room.player2.socket.id).emit('id', [id,opt]);
      if (room.player1 && room.player1.socket)
        server.to(room.player1.socket.id).emit('id', [id,opt]);
      return 1;
    }
    for (const spec of room.spectators)
    {
      if (spec.socket.id == socket.id)
      {
        if (room.player1 && room.player2)
          server.to(spec.socket.id).emit('score', [room.player1.points,room.player2.points]);
        else if ((room.player1 || room.player2) && opt == 2)
          server.to(spec.socket.id).emit('score', [0,0]);
        else
          return 2;
        server.to(spec.socket.id).emit('name', 2);
        server.to(spec.socket.id).emit('exists', 2);
        return 1;
      }
    }
    return 0;
  }

  async changeGameState(user: UserI, status: UserStatus)
  {
    user.status = status;
    this.userService.updateOne(user.id, user);
  }

  public checkIfAlready(lobbies: LobbyI, user: UserI, socket: Socket, server: Server)
  {
    let id: number = 0;
    let status: number;
    for (const room of lobbies.normalRooms)
    {
      if (status = this.checkAll(room, user, socket, server, 0, id))
        if(status == 1)
          return this.changeGameState(user, UserStatus.GAME);
        else
          return this.changeGameState(user, UserStatus.ON);
      id++;
    }
    id = 0;
    for (const room of lobbies.blitzRooms)
    {
      if (status = this.checkAll(room, user, socket, server, 1, id))
        if(status == 1)
          return this.changeGameState(user, UserStatus.GAME);
        else
          return this.changeGameState(user, UserStatus.ON);
      id++;
    }
    id = 0;
    for (const room of lobbies.privateRooms)
    {
      if (status = this.checkAll(room, user, socket, server, 2, id))
        if(status == 1)
          return this.changeGameState(user, UserStatus.GAME);
        else
          return this.changeGameState(user, UserStatus.ON);
      id++;
    }
    return this.changeGameState(user, UserStatus.ON);
  }

  //Check if Users are still connected properly
  public checkConnection(gamestate: GameStateI)
  {
    let i : number = 0;
    if (gamestate.spectators.length)
    {
      gamestate.spectators.forEach(element => {
        if (!element.socket.connected)
        {
          gamestate.spectators.splice(i, 1);
        }
        i++;
      });
    }
    if (gamestate.player1 && !gamestate.player1.socket.connected)
    {
      if (gamestate.player2)
        gamestate.player2.points = 5;
      return (2);
    }
    else if (gamestate.player2 && !gamestate.player2.socket.connected)
    {
      if (gamestate.player1)
        gamestate.player1.points = 5;
      return (1);
    }
    return (0);
  }

  public async checkStreakAchievements(winner: any) {
	if (winner.user.streak == 5 && winner.user.achievementStreak5 == false) {
		winner.user.achievementStreak5 = true;
		winner.user.xp += 5;
	}
	if (winner.user.streak == 10 && winner.user.achievementStreak10 == false) {
		winner.user.achievementStreak10 = true;
		winner.user.xp += 10;
	}
	if (winner.user.streak == 25 && winner.user.achievementStreak25 == false) {
		winner.user.achievementStreak25 = true;
		winner.user.xp += 25;
	}
	if (winner.user.streak == 50 && winner.user.achievementStreak50 == false) {
		winner.user.achievementStreak50 = true;
		winner.user.xp += 50;
	}
  }

  public async gameResultsWon(winner: any)
  {
	if (winner.user.prevMatch == false)
		winner.user.prevMatch = true;
	winner.user.streak++;
	this.checkStreakAchievements(winner);
	winner.user.nbWin++;
	winner.user.xp++;
  }

  public async gameResultsLost(loser: any)
  {
	loser.user.nbLoss++;
	loser.user.streak = 0;
	loser.user.prevMatch = false;
	if (loser.user.xp >= 1)
		loser.user.xp -= 1;
  }

  public async checkStatusAchievement(player: any) {
	if (player.user.nbWin + player.user.nbLoss >= 1 && player.user.achievementRookie == false) {
		player.user.achievementRookie = true;
		player.user.xp += 2;
	}
	if (player.user.nbWin + player.user.nbLoss >= 5 && player.user.achievementBeginner == false) {
		player.user.achievementBeginner = true;
		player.user.xp += 5;
	}
	if (player.user.nbWin + player.user.nbLoss >= 15 && player.user.achievementIntermediate == false) {
		player.user.achievementIntermediate = true;
		player.user.xp += 10;
	}
	if (player.user.nbWin + player.user.nbLoss >= 25 && player.user.achievementPro == false) {
		player.user.achievementPro = true;
		player.user.xp += 15;
	}
  }

  public endGame(gamestate: GameStateI, gameRoomService: GameRoomService, userservice: UserService, server: Server)
  {
    let type: string;
    if (gamestate.type == 0)
      type = "normal";
    else if (gamestate.type == 1)
      type = "blitz";
    else
      type = "private";
    gamestate.type = -1;
    if (gamestate.player1.points >= 5)
    {
		this.gameResultsWon(gamestate.player1);
		this.gameResultsLost(gamestate.player2);
		if (gamestate.player1.points == 5 && gamestate.player2.points == 0) {
			gamestate.player1.user.achievementNoGoalAgainst = true;
			gamestate.player1.user.xp += 5;
		}
    }
    else if (gamestate.player2.points >= 5)
    {
		this.gameResultsWon(gamestate.player2);
		this.gameResultsLost(gamestate.player1);
		if (gamestate.player2.points == 5 && gamestate.player1.points == 0) {
			gamestate.player2.user.achievementNoGoalAgainst = true;
			gamestate.player2.user.xp += 5;
		}
    }
    else if (gamestate.type == -1)
    {
		this.gameResultsWon(gamestate.player1);
		gamestate.player1.points = 5;
		this.gameResultsLost(gamestate.player2);
    }
    else
    {
		this.gameResultsWon(gamestate.player2);
		gamestate.player2.points = 5;
		this.gameResultsLost(gamestate.player1);
    }
	this.checkStatusAchievement(gamestate.player1);
	this.checkStatusAchievement(gamestate.player2);
    if (gamestate.player2.user.status == UserStatus.GAME)
      gamestate.player2.user.status = UserStatus.ON;
    if (gamestate.player1.user.status == UserStatus.GAME)
      gamestate.player1.user.status = UserStatus.ON;
    for (const spec of gamestate.spectators)
    {
      if (spec.user.status == UserStatus.GAME)
      {
        spec.user.status = UserStatus.ON;
        userservice.updateOne(spec.user.id, spec.user);
      }
    }
    let history: HistoryI = {
      playerOne: gamestate.player1.user,
      playerTwo: gamestate.player2.user,
      playerOneScore: gamestate.player1.points,
      playerTwoScore: gamestate.player2.points,
      game: type,
      date: new Date(),
    };
    gamestate.historyServices.createMatchHistory(history);
    
    userservice.updateOne(gamestate.player2.user.id, gamestate.player2.user);
    userservice.updateOne(gamestate.player1.user.id, gamestate.player1.user);
    //Stop Loop from running
    if (gamestate.player1.paddle.speedmultiplier != -1)
    {
      server.to(gamestate.player1.socket.id).emit('done', 0);
    }
    if (gamestate.player2.paddle.speedmultiplier != -1)
    {
      server.to(gamestate.player2.socket.id).emit('done', 0);
    }
    if (gamestate.spectators.length)
    {
      gamestate.spectators.forEach(element => {
        server.to(element.socket.id).emit('done', -1);
      });
    }
  }
}

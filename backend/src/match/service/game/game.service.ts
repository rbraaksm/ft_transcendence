import { Injectable } from '@nestjs/common';
import { LobbyI } from 'src/match/model/lobby/lobby.interface';
import { Socket, Server } from 'socket.io';
import { UserI} from 'src/user/model/user.interface';
import { CoordinatesI } from 'src/match/model/coordinates/coordinates.interface';
import { GameStateI } from 'src/match/model/game-state/game-state.interface';
import { PowerI } from 'src/match/model/powers/powers.interface';
import { GameRoomService } from '../gameroom/gameroom.service';
import { UserService } from 'src/user/service/user-service/user.service';
import { PlayerI } from 'src/match/model/player/player.interface';


@Injectable()
export class GameService {

	constructor(){};

	//Setup The end of the game through score or disconnect
	public endGame(gamestate: GameStateI, gameRoomService: GameRoomService, userServices: UserService, server: Server)
	{
		gameRoomService.endGame(gamestate, gameRoomService, userServices, server);
		clearInterval(gamestate.id);
	}

	//------------------------------------GAME LOOP--------------------------------------------
	public loopFunction(gamestate: GameStateI, server: Server, gameRoomService: GameRoomService)
	{
		var player1: PlayerI = gamestate.player1;
		let player2: PlayerI = gamestate.player2;
		let ball: CoordinatesI = gamestate.ball;
		//Check if game is done through either points or loss of connection
		let disc: number = 0;
		if ((disc = gameRoomService.checkConnection(gamestate)) || player1.points >= 5 || player2.points >= 5)
			this.endGame(gamestate, gameRoomService, gamestate.userServices, server);
		//PLAYER MOVEMENTS based on input variables recieved
		player1.paddle.y += player1.paddle.dy;
		if (player1.paddle.y < 0)
			player1.paddle.y = 0;
		else if (player1.paddle.y > 300 - player1.paddle.height)
			player1.paddle.y = 300 - player1.paddle.height;
		player2.paddle.y += player2.paddle.dy;
		if (player2.paddle.y < 0)
			player2.paddle.y = 0;
		else if (player2.paddle.y > 300 - player2.paddle.height)
			player2.paddle.y = 300 - player2.paddle.height;

		//BALL MOVEMENT and bounces on sides if coordinates are out of bounds
		ball.y += ball.dy;
		if (ball.y < 0)
		{
			ball.dy *= -1;
			ball.y = 0
		}
		else if (ball.y > 300 - ball.height)
		{
			ball.dy *= -1;
			ball.y = 300 - ball.height;
		}
		ball.x += ball.dx;
		//CHECK COLLISION WITH PADDLES IF INSIDE BOUNDS

		if (!(ball.x < 415 - ball.width && ball.x > -15))
		{
			//reset ball speed and set start of next round
			ball.speedmultiplier = 2;
			setTimeout(() => {
			//change scores
			if (ball.x <= -15 || ball.x >=415)
			{
				ball.x <= -15 ? player2.points++ : 0;
				ball.x >= 415 ? player1.points++ : 0;
				//send updated scores to both players and spectators
				server.to(player1.socket.id).emit('score', [gamestate.player1.points, gamestate.player2.points]);
				server.to(player2.socket.id).emit('score', [gamestate.player1.points, gamestate.player2.points]);
				if (gamestate.spectators.length)
				{
				gamestate.spectators.forEach(element => {
					server.to(element.socket.id).emit('score', [gamestate.player1.points, gamestate.player2.points]);
				});
				}
			}
			//if powers are present in the game reset all current powers affecting players or on board
			if (gamestate.type == 1 && gamestate.powers)
			{
				if (gamestate.powers){
					gamestate.powers.forEach(power => {
					if (power.player != -1)
						power.deactivate(power.player);
					});
					gamestate.powers.splice(0, gamestate.powers.length);

				}
			}
			//respawn ball same diretion as before last loss
			if (ball.x <= -15)
				this.RespawnBall(ball, -1);
			else if (ball.x >= 415)
				this.RespawnBall(ball, 1);
			}, 1500);
		}
		//check collisions between player paddles and the ball
		if (this.collides(ball, player1.paddle) || this.collides(ball, player2.paddle))
		{
			//Bounce ball back
			if (this.collides(ball, player1.paddle))
			this.CalculateBounce(ball, player1.paddle);
			else
			this.CalculateBounce(ball, player2.paddle);
			//if the gamemode permits diceroll to determine if a powerup will be spawned
			if (gamestate.type == 1)
			{
			if (Math.floor(Math.random() * 3) == 1)
				this.spawnPowerUp(gamestate);
			this.updatePowerUp(gamestate);
			}
		}
		else if (gamestate.type == 1 && gamestate.powers)
		{
			//Check collision with potential powerups if gamemode permits
			let i: number = 0;
			gamestate.powers.forEach(element => {
			if (element.player == -1 && this.collides(ball, element.pos))
			{
				//activate on position with determined player
				element.player = (ball.dx < 0) ? 1 : 0;
				element.activate(element.player);
			}
			i++;
			});
		}
		//Setup only necessary frontend data in order to refrain from overloading stack
		let n_data: GameStateI = {
			player1:{
			paddle: player1.paddle,
			points: player1.points,
			},
			player2:{
			paddle: player2.paddle,
			points: player2.points,
			},
			ball: ball,
			type: gamestate.type,
			powers: gamestate.powers,
		};
		//send Gamestte information to all players and spectators
		server.to(player2.socket.id).emit('gamestate', n_data);
		server.to(player1.socket.id).emit('gamestate', n_data);
		if (gamestate.spectators.length)
		{
			gamestate.spectators.forEach(element => {
			server.to(element.socket.id).emit('gamestate', n_data);
			});
		}
	 }

	//Respawn ball with random angle but always towards the side that lost last
	public RespawnBall(ball: CoordinatesI, side: number)
	{
	//reset ball position
	ball.speedmultiplier = 2;
	ball.x = 200 - ball.width/2;
	ball.y = 150 - ball.height/2;
	ball.dx = 10 * side;
	ball.dy = Math.random() * 20 - 10;
	//reset magnitude of ball to speed multiplier
	let magnitude: number = Math.sqrt(Math.pow(ball.dx, 2) + Math.pow(ball.dy, 2));
	ball.dx = ball.dx / magnitude * ball.speedmultiplier;
	ball.dy = ball.dy / magnitude * ball.speedmultiplier;
	}

	//calculate Bounces from paddles based on relative positions of both objects
	public CalculateBounce(ball: CoordinatesI, paddle: CoordinatesI)
	{
	ball.speedmultiplier *= 1.05;
	ball.dx	= -Math.sign(ball.dx) * 10;
	ball.dy = ((ball.y + ball.height/2) - (paddle.y + paddle.height/2))/2;
	if (Math.abs(ball.dx) < Math.abs(ball.dy) / 3)
		 ball.dx = Math.abs(ball.dy) / 3 * Math.sign(ball.dx);
	if (Math.abs(ball.dy) < 0.5)
		 ball.dy = 0;
	let magnitude: number = Math.sqrt(Math.pow(ball.dx, 2) + Math.pow(ball.dy, 2));
	ball.dx = ball.dx / magnitude * ball.speedmultiplier;
	ball.dy = ball.dy / magnitude * ball.speedmultiplier;
	// move ball next to the paddle otherwise the collision will happen again
	// in the next frame
	if (paddle.x < 200)
		 ball.x = paddle.x + paddle.width;
	else
		 ball.x = paddle.x - paddle.width;
	}

	//simple function to check collisions between to CoordinatesI interfaces
	public collides(obj1: CoordinatesI, obj2: CoordinatesI) {
	return obj1.x < obj2.x + obj2.width &&
				obj1.x + obj1.width > obj2.x &&
				obj1.y < obj2.y + obj2.height &&
				obj1.y + obj1.height > obj2.y;
	}

	//Randomly Spawn A powerup on the map
	public spawnPowerUp(gamestate: GameStateI)
	{
	//PowerUp that reduces opponent's pallet size
	//Duration and effect setup with stat reset on deactivation
	let SmallerRacket: PowerI = {
		 pos: {
		x: 50 + Math.random() * 300,
		y: 20 + Math.random() * 260,
		width: 10,
		height: 10,
		 },
		 color: "red",
		 duration: 5,
		 player: -1,
		 activate: function (n_player: number) {
		if (n_player == 0)
			 gamestate.player2.paddle.height -= 20;
		else
			 gamestate.player1.paddle.height -= 20;
		 },
		 deactivate: function (n_player: number) {
		if (n_player == 0)
			 gamestate.player2.paddle.height += 20;
		else
			 gamestate.player1.paddle.height += 20;
		 }
	}
	//PowerUp that increase player's pallet size
	//Duration and effect setup with stat reset on deactivation
	let BiggerRacket: PowerI = {
		 pos: {
		x: 50 + Math.random() * 300,
		y: 20 + Math.random() * 260,
		width: 10,
		height: 10,
		 },
		 color: "green",
		 duration: 5,
		 player: -1,
		 activate: function (n_player: number) {
		if (n_player == 0)
			 gamestate.player1.paddle.height += 20;
		else
			 gamestate.player2.paddle.height += 20;
		 },
		 deactivate: function (n_player: number) {
		if (n_player == 0)
			 gamestate.player1.paddle.height -= 20;
		else
			 gamestate.player2.paddle.height -= 20;
		 }
	}
	//Randomly select one of the powerups to be generated
	let i: number = Math.floor(Math.random() * 3);
	if (i == 0 && gamestate.powers)
		 gamestate.powers.push(SmallerRacket);
	else if (i == 1 && gamestate.powers)
		 gamestate.powers.push(BiggerRacket);
	}

	//Update Currently in use powerups and call deactivate if duration reaches 0 bounces
	public updatePowerUp(gamestate: GameStateI)
	{
	let i: number = 0;
	if (gamestate.powers){
		gamestate.powers.forEach(power => {
			 if (power.player != -1)
			 {
			power.duration--;
			if (power.duration < 1)
			{
				 power.deactivate(power.player);
				 gamestate.powers.splice(i, 1);
			}
			 }
			 i++;
		});
	}
	}
}

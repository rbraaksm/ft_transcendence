import { HostListener, AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { combineLatest, Observable } from 'rxjs';
import { switchMap, map, startWith, tap } from 'rxjs/operators';
import { GameStateI } from 'src/app/model/game-state.interface';
import { MessagePaginateI } from 'src/app/model/chat/message.interface';
import { RoomI } from 'src/app/model/chat/room.interface';
import { ChatService } from '../../services/chat-service/chat.service';
import { Router, Event, NavigationStart, NavigationEnd, NavigationError } from '@angular/router';
import { CustomSocket } from '../../sockets/custom-socket';
import { kill } from 'process';
import { CoordinatesI } from 'src/app/model/coordinates.interface';
import { debug } from 'console';
import { AuthService } from 'src/app/public/services/auth-service/auth.service';
import { UserService } from '../../../public/services/user-service/user.service';
import { UserI } from 'src/app/model/user/user.interface';

@Component({
  selector: 'app-match',
  templateUrl: './match.component.html',
  styleUrls: ['./match.component.css']
})
export class MatchComponent implements OnInit {

  initialized: boolean = false;
  _canvas: HTMLCanvasElement;

  constructor(private router: Router, private authService: AuthService, private chatService: ChatService, private userService: UserService) {

    //site basic pixel size for sidebars and bot/top spaces
    let sidebarSize = 200;
    let rightminSize = 50;
    let rightBoundary = 400;
    let botBoundary = 300;
    let botSize = 20;
    let topSize = 20;
    let grid = 10;
    let id: number = -1;
    let type: number;
    let name1: string;
    let name2: string;
    let score1: number = 0;
    let score2: number = 0;
    //Get Room ID from Server Response
    chatService.socket.on('id', function(n_id: number[]) {
      id = n_id[0];
      type = n_id[1];
    });

    chatService.socket.on('connect', function() {
      console.log("Connected to WS server");
    });

    chatService.socket.on('exists', function(data: number) {
      var spectate = document.getElementById("spectate");
      var normal = document.getElementById("normal");
      var blitz = document.getElementById("blitz");
      if (normal)
        normal.remove();
      if (blitz)
        blitz.remove();
      if (spectate)
        spectate.remove();
    });

    chatService.socket.on('score', function(state: number[]) {
      score1 = state[0];
      score2 = state[1];
      var score = document.getElementById("score");
      if(score)
      {
        score.textContent = 0 + " : " + 0;
        if (state)
          score.textContent = name1 + " " + state[0] + " : " + state[1] + " " + name2;
      }
    });

    chatService.socket.on('name', function(data: number) {
      if (data == 0)
      {
        name1 = "You";
        name2 = "Opp";
      }
      else if (data == 1)
      {
        name1 = "Opp";
        name2 = "You";
      }
      else
      {
        name1 = "P1>";
        name2 = "<P2";
      }
      var score = document.getElementById("score");
      if(score)
        score.textContent = name1 + " " + score1 + " : " + score2 + " " + name2;
    });

    chatService.socket.on('done', function(data: number) {
      router.navigate(['../../private/profile']);
    });

    //Send Inputs to server Room ID has been recieved
    function handleMovement(e){
      if (id > -1)
      {
        if (e.key === "ArrowUp")
          chatService.emitInput([1,id, type]);
        else if (e.key === "ArrowDown") {
          chatService.emitInput([-1,id, type]);
        }
      }
    }
    // listen to keyboard events to stop the paddle if key is released
    function handleMovementStop(e){
      if (id > -1)
      {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          chatService.emitInput([0,id, type]);
        }
      }
    }
    //Keyboard event listeners
    document.addEventListener('keydown', handleMovement);
    document.addEventListener('keyup', handleMovementStop);


    //Calculate Positions and Sizes on screen based on window size and UI Sizes
    function actualPosX(pos: number, canvas: HTMLCanvasElement) {
      if (canvas.width - sidebarSize - rightminSize  < 4/3 * (canvas.height - botSize - topSize))
        return ((pos/rightBoundary) * (canvas.width - sidebarSize - rightminSize) + sidebarSize);
      else
        return ((pos/rightBoundary) * 4/3 * (canvas.height - grid * 2) + sidebarSize);
    }
    function actualPosY(pos: number, canvas: HTMLCanvasElement) {
      if (canvas.width - sidebarSize - rightminSize > 4/3 * (canvas.height - botSize - topSize))
        return ((pos/botBoundary) * (canvas.height - botSize - topSize) + topSize);
      else
        return ((pos/botBoundary) * 3/4 * (canvas.width - sidebarSize - rightminSize) + topSize);
    }
  
    function actualSizeY(pos: number, canvas: HTMLCanvasElement) {
      if (canvas.width - sidebarSize - rightminSize > 4/3 * (canvas.height - botSize - topSize))
        return ((pos/botBoundary) * (canvas.height - botSize - topSize));
      else
        return ((pos/botBoundary) * 3/4 * (canvas.width - sidebarSize - rightminSize));
    }
  
    function actualSizeX(pos: number, canvas: HTMLCanvasElement) {
      if (canvas.width - sidebarSize - rightminSize < 4/3 * (canvas.height - grid * 2))
        return ((pos/rightBoundary) * (canvas.width - sidebarSize - rightminSize));
      else
        return ((pos/rightBoundary) * 4/3 * (canvas.height - grid * 2));
    }

    function ez_fillRect(pos: CoordinatesI, canvas: HTMLCanvasElement ,context: CanvasRenderingContext2D)
    {
      context.fillRect(actualPosX(pos.x, canvas), actualPosY(pos.y, canvas), actualSizeX(pos.width, canvas), actualSizeY(pos.height, canvas));
    }

    //Recieve server Gamestate information to update game on client side
    chatService.socket.on('gamestate', function(gamestate: GameStateI) {
	  var blitz = document.getElementById("blitz");
      var canvas = document.getElementById("game");
      if (canvas && canvas instanceof HTMLCanvasElement)
      {
        let n_canvas: HTMLCanvasElement = canvas;
        let context: CanvasRenderingContext2D = canvas.getContext('2d');
		context.clearRect(0,0,canvas.width,canvas.height);
		if (gamestate.type == 1) {
			context.fillStyle = 'blue';
			context.fillRect(0,0,canvas.width,canvas.height);
		}
        
        //Draw dotted line down the middle
        context.fillStyle = 'grey';
		if (gamestate.type == 1)
			context.fillStyle = 'yellow';
        for (let i = grid*1.5; i < botBoundary - grid; i += grid * 2) {
          context.fillRect(actualPosX(rightBoundary/2 - grid/2, canvas), actualPosY(i, canvas), actualSizeX(grid/2, canvas), actualSizeY(grid/2, canvas));
        }
        
        //Draw PowerUps
        if (gamestate.powers)
        {
          gamestate.powers.forEach(element => {
            if (element.player == -1)
            {
              context.fillStyle = element.color;
              ez_fillRect(element.pos, n_canvas ,context);
            }
          });
        }
        
        //Use Gamestate information to draw in ball and paddle positions
        context.fillStyle = 'lightgrey';
		if (gamestate.type == 1)
			context.fillStyle = 'yellow';
        context.fillRect(actualPosX(gamestate.ball.x, canvas), actualPosY(gamestate.ball.y, canvas), actualSizeX(gamestate.ball.width, canvas), actualSizeY(gamestate.ball.height, canvas));
        context.fillRect(actualPosX(gamestate.player1.paddle.x, canvas), actualPosY(gamestate.player1.paddle.y, canvas), actualSizeX(gamestate.player1.paddle.width, canvas), actualSizeY(gamestate.player1.paddle.height, canvas));
        context.fillRect(actualPosX(gamestate.player2.paddle.x, canvas), actualPosY(gamestate.player2.paddle.y, canvas), actualSizeX(gamestate.player2.paddle.width, canvas), actualSizeY(gamestate.player2.paddle.height, canvas));
        
        //Draw top and bottom wall
        context.fillRect(actualPosX(0, canvas), actualPosY(-grid, canvas), actualSizeX(rightBoundary + grid, canvas), actualSizeY(grid, canvas));
        context.fillRect(actualPosX(0, canvas), actualPosY(botBoundary, canvas), actualSizeX(rightBoundary + grid, canvas), actualSizeY(grid, canvas));
      }
    });
  }

  //function to draw canvas
  resize_canvas(){
    var canvas = document.getElementById("game");
    var score = document.getElementById("score");
    var normal = document.getElementById("normal");
    var blitz = document.getElementById("blitz");
    var spectate = document.getElementById("spectate");
    if (canvas && canvas instanceof HTMLCanvasElement && score)
    {
		
      //Change canvase size and button positions based on window size !
      canvas.height = window.innerHeight - 100;
      canvas.width  = window.innerWidth - 100;
      let pix : number;
      if (canvas.width - 200 - 50  < 4/3 * (canvas.height - 20 - 20))
        pix = 1/2 * (canvas.width - 250) + 173;
      else
        pix = 4/6 * (canvas.height - 20) + 171;
      score.style.left = pix - 62 + "px";
      if (normal && blitz && spectate)
      {
        normal.style.left = pix - 150 + "px";
        blitz.style.left = pix + 100 + "px";
        spectate.style.left = pix - 10 + "px";
        normal.style.top = 200 + "px";
        blitz.style.top = 200 + "px";
        spectate.style.top = 300 + "px";
      }
    }
  }

  ngOnInit(){
    var normal = document.getElementById("normal");
    var blitz = document.getElementById("blitz");
    var spectate = document.getElementById("spectate");
    var service = this.chatService;
    let _user: number;

    this.authService.getUserId().pipe(
		  switchMap((idt: number) => this.userService.findOne(idt).pipe(
			tap((user) => {
			  _user = user.id;
        service.checkExistence(_user);
			})
		  ))
		).subscribe()

    //Destroy buttons after one was chosen
    function killButtons(){
      if (normal)
        normal.remove();
      if (blitz)
        blitz.remove();
      if (spectate)
        spectate.remove();
    }

    function connectNormal(e){
      killButtons();
      //Send Connections to Server
      service.newPlayer(0, _user);
    }
    function connectBlitz(e){
      killButtons();
      //Send Connections to Server
      service.newPlayer(1, _user);
    }
    function connectSpectate(e){
      killButtons();
      //Send Connections to Server
      service.newPlayer(2, _user);
    }

    normal.addEventListener("click", connectNormal);
    blitz.addEventListener("click", connectBlitz);
    spectate.addEventListener("click", connectSpectate);
    //Draw in canvas to correct size at start
    this.resize_canvas();
    //Draw in canvas to correct size after each window resize
    window.addEventListener('resize', this.resize_canvas, false);
  }
}

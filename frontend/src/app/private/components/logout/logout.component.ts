import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserI, UserStatus } from 'src/app/model/user/user.interface';
import { UserService } from 'src/app/public/services/user-service/user.service';
import { AuthService } from '../../../public/services/auth-service/auth.service';
import { ChatService } from '../../services/chat-service/chat.service';

@Component({
	selector: 'app-logout',
	templateUrl: './logout.component.html',
	styleUrls: ['./logout.component.css']
})

export class LogoutComponent implements OnInit {
	constructor(
		private authService: AuthService,
		private router: Router,
		private userService: UserService,
		private chatService: ChatService,
	) { }

	ngOnInit(): void {

  this.userService.findOne(this.authService.getLoggedInUser().id).subscribe(
	(user: UserI) => {
	  user.status = UserStatus.OFF;
	  this.authService.logout(user).subscribe();
	  this.chatService.gameLogout();
	});
  setTimeout(() => {
		this.router.navigate(['login']);
	}, 500);  
  }
}
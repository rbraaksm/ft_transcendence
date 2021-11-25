import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { combineLatest, Observable } from 'rxjs';
import { switchMap, map, startWith, tap } from 'rxjs/operators';
import { MessagePaginateI } from 'src/app/model/chat/message.interface';
import { RoomI, RoomPaginateI, RoomType } from 'src/app/model/chat/room.interface';
import { UserI, UserPaginateI, UserRole } from 'src/app/model/user/user.interface';
import { AuthService } from 'src/app/public/services/auth-service/auth.service';
import { UserService } from 'src/app/public/services/user-service/user.service';
import { ChatService } from '../../services/chat-service/chat.service';

@Component({
  selector: 'app-administration',
  templateUrl: './administration.component.html',
  styleUrls: ['./administration.component.css']
})
export class AdministrationComponent implements OnInit, AfterViewInit {

	user: UserI = this.authService.getLoggedInUser();
	admin :UserRole = UserRole.ADMIN;
	allUsers$: Observable<UserPaginateI> = this.userService.getAllUsers();
	allRooms$: Observable<RoomPaginateI> = this.chatService.getAllRooms();
	constructor(
		private authService: AuthService,
		private router: Router,
		private activatedRoute: ActivatedRoute,
		private snackBar: MatSnackBar,
		private userService: UserService,
		private chatService: ChatService
  	) { }

	ngOnInit(): void {
		this.userService.findOne(this.user.id).subscribe(
			(user: UserI) => {
				this.user = user;
		// check if user status is owner or admin
		if (this.user.role !== UserRole.ADMIN && this.user.role !== UserRole.OWNER) {
			this.snackBar.open('You are not authorized to access this page', '', {
				duration: 3000, panelClass: ['login1-snackbar', 'login2-snackbar'],
			});
			this.router.navigate(['../setting'], { relativeTo: this.activatedRoute });
		}
		else {
			this.chatService.emitPaginateAllRooms(10, 0);
		}
	});
	}

	ngAfterViewInit() {
		this.chatService.emitPaginateAllRooms(10, 0);
	}

	onPaginateRooms(pageEvent: PageEvent) {
		this.chatService.emitPaginateAllRooms(10, pageEvent.pageIndex);
	  }

	// delete a room by id
	deleteRoom(roomId: number) {
		this.chatService.deleteRoom(roomId).subscribe(
			data => {
				this.snackBar.open('Room deleted', '', {
					duration: 3000, panelClass: ['login1-snackbar', 'login2-snackbar'],
				});
				this.chatService.emitPaginateAllRooms(10, 0);
			},
		);
	}

	// ban user by id
	banUser(user : UserI) {
		if (user.role != UserRole.OWNER) {
			user.ban = !user.ban;
		}
		this.userService.banUser(user).subscribe();
	}

	changeRole(user : UserI) {
		if (user.role != UserRole.OWNER) {
			if (user.role === UserRole.ADMIN) {
				user.role = UserRole.USER;
			}
			else {
				user.role = UserRole.ADMIN;
			}
		}
		this.userService.changeRole(user).subscribe();
	}

	optionRoom(roomId: number) {
	  this.router.navigate(['../option-room/' + roomId], { relativeTo: this.activatedRoute });
	}

}

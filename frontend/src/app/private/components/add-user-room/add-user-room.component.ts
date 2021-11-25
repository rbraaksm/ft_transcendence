import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { combineLatest, Observable } from 'rxjs';
import { switchMap, map, startWith, tap } from 'rxjs/operators';
import { MessagePaginateI } from 'src/app/model/chat/message.interface';
import { RoomI, RoomPaginateI, RoomType } from 'src/app/model/chat/room.interface';
import { UserI } from 'src/app/model/user/user.interface';
import { AuthService } from 'src/app/public/services/auth-service/auth.service';
import { ChatService } from '../../services/chat-service/chat.service';

@Component({
  selector: 'app-add-user-room',
  templateUrl: './add-user-room.component.html',
  styleUrls: ['./add-user-room.component.css']
})
export class AddUserRoomComponent implements OnChanges {

  @Input() joinRoom: RoomI;
  @Input() InRoom: boolean;
  user: UserI = this.authService.getLoggedInUser();
  protected = RoomType.PROTECTED;

  password: FormControl = new FormControl({value: '', disabled: false}, [Validators.required]);



  constructor(
	  private chatService: ChatService,
	  private authService: AuthService,
	  private router: Router,
	  private activatedRoute: ActivatedRoute,
	  private snackBar: MatSnackBar
	  	) { }

	ngOnChanges(changes: SimpleChanges): void {
		if (changes.InRoom) {
			this.InRoom = changes.InRoom.currentValue;
		}
	}

	addUser() {
		if (this.InRoom) {
			return;
		}
		if (this.password.value === undefined) {
			this.password.setValue('');
		}
		
		this.chatService.addUserToRoom(this.joinRoom, this.password.value);
		setTimeout(() => {
			if (this.joinRoom.type === this.protected) {
				this.chatService.IsInRoom(this.joinRoom.id, this.user.id).subscribe();
			}
			else {
				this.router.navigate(['../dashboard'], {relativeTo: this.activatedRoute});
				this.snackBar.open(`You're in the room !`, 'Close', {
					duration: 3000, panelClass: ['login1-snackbar', 'login2-snackbar'],
				});
				
				
			}
		}, 500);
  }
}

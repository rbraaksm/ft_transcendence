import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatRadioChange } from '@angular/material/radio';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { RoomI, RoomType } from 'src/app/model/chat/room.interface';
import { UserI, UserRole } from 'src/app/model/user/user.interface';
import { AuthService } from 'src/app/public/services/auth-service/auth.service';
import { UserService } from 'src/app/public/services/user-service/user.service';
import { ChatService } from '../../services/chat-service/chat.service';

@Component({
  selector: 'app-option-room',
  templateUrl: './option-room.component.html',
  styleUrls: ['./option-room.component.css']
})
export class OptionRoomComponent implements OnInit {
	
  user: UserI = this.authService.getLoggedInUser();
  IsOwner: boolean = false;
  room: RoomI = {};
  radiocheck: boolean = true;
  beforeType: string = 'public';
  form: FormGroup = new FormGroup({
	id : new FormControl(''),
	password: new FormControl({value: '', disabled: true}),
	owner : new FormControl(''),
	type: new FormControl(null ,[Validators.required]),
  });

  private roomId$: Observable<number> = this.activatedRoute.params.pipe(
	map((params: Params) => parseInt(params['id']))
  )

  room$: Observable<RoomI> = this.roomId$.pipe(
	switchMap((roomId: number) => this.chatService.findOne(roomId))
	)

  constructor(
	  private chatService: ChatService,
	  private authService: AuthService,
	  private router: Router,
	  private activatedRoute: ActivatedRoute,
	  private _snackBar: MatSnackBar,
	  private userService: UserService,
	  	) { 
			this.activatedRoute.params.subscribe(params => {
				if (params["id"]) {
				  this.doSearch(params["id"]);
				}
			  });
			}

	ngOnInit(): void {
		this.userService.findOne(this.user.id).subscribe(user => {
			this.user = user;
			// check if user status is owner or admin
			this.room$.subscribe(val => {
				let authorized : boolean = false;

				if (!val) this.router.navigate(['../../page-not-found'],{ relativeTo: this.activatedRoute })
				if (this.user.role == UserRole.USER) {
					if (val.owner.id === this.user.id) {
						authorized = true;
						this.IsOwner = true;
					}
					if (val.admin.find(admin => admin.id === this.user.id)) {
						authorized = true;
					}
				}
				else {
					authorized = true;
				}
				if (!authorized) {
					this._snackBar.open('You are not authorized to access this page', '', {
						duration: 3000, panelClass: ['login1-snackbar', 'login2-snackbar'],
					});
					this.router.navigate(['../../dashboard'], { relativeTo: this.activatedRoute });
				}
				else {
					this.room = val;
					this.room$ = this.room$.pipe(
						map(room => {
							return {
								...room,
								users: room.users.filter(user => user.id !== this.user.id)
							};
						})
						);
						this.form.patchValue({
							id: this.room.id,
							owner: this.room.owner,
						});
						// remove current user from all users list
				}
			});
		});
	}

	doSearch(term: string) {		
		let test = parseInt(term);
		if (isNaN(test)) {
		  this.router.navigate(['../../page-not-found'],{ relativeTo: this.activatedRoute })
		}
	}

	modify() {
		if (this.form.valid) {
			this.chatService.changeType(this.form.getRawValue(), this.form.get('type').value, this.form.get('password').value, this.user);
		  } 
	}
	
	radioType($event: MatRadioChange) {
		if ($event.value == 'public') {
			this.form.get('password').clearValidators();
        	this.form.get('password').disable();
			this.form.get('password').setValue('');
			this.form.get('type').setValue('public');
			this.beforeType = 'public';
		}
		else if ($event.value == 'private') {
			this.form.get('password').clearValidators();
        	this.form.get('password').disable();
			this.form.get('password').setValue('');
			this.form.get('type').setValue('private');
			this.beforeType = 'private';
		}
		else {
			this.form.get('password').setValidators([Validators.required]);
			this.form.get('password').enable();
			this.form.get('type').setValue('protected');
			this.beforeType = 'protected';
		}
	  }

	isAdmin(user: UserI) {
		return this.room.admin && this.room.admin.find(admin => admin.id === user.id);
	}

	isMuted(user: UserI) {
		return this.room.muted && this.room.muted.find(muted => muted.id === user.id);
	}

	addAdmin(user: UserI) {
		this.chatService.addAdmin(this.room, user);
		this.room.admin.push(user);
	}

	addMuted(user: UserI) {
		// check if user is owner room
		if (user.id === this.room.owner.id) {
			this._snackBar.open('You can\'t mute owner room', '', {
				duration: 3000, panelClass: ['login1-snackbar', 'login2-snackbar'],
			});
		}
		else {
			this.chatService.addMuted(this.room, user);
			this.room.muted.push(user);
		}
	}

	removeUser(user: UserI) {
		this.removeAdmin(user);
		this.removeMuted(user);
		this.chatService.removeUser(this.room, user);
		this.router.navigate(['../../dashboard'], { relativeTo: this.activatedRoute });
	}

	removeAdmin(user: UserI) {
		if (user.id === this.room.owner.id) {
			this._snackBar.open('He\'s owner room', '', {
				duration: 3000, panelClass: ['login1-snackbar', 'login2-snackbar'],
			});
		}
		else {
			this.chatService.removeAdmin(this.room, user);
			this.room.admin = this.room.admin.filter(admin => admin.id !== user.id);
		}
	}

	removeMuted(user: UserI) {
		this.chatService.removeMuted(this.room, user);
		this.room.muted = this.room.muted.filter(muted => muted.id !== user.id);
	}

	changePassword(password: string) {
		this.chatService.changePassword(this.room, password);
	}

	changeType(type: RoomType, password: string) {
		this.chatService.changeType(this.room, type, password, this.user);
	}
}

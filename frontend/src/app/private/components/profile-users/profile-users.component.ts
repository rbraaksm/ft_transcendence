import { AfterViewInit, Component, OnInit } from '@angular/core';
import { MatSelectionListChange } from '@angular/material/list';
import { PageEvent } from '@angular/material/paginator';
import { Observable, Subscription } from 'rxjs';
import { RoomPaginateI } from 'src/app/model/chat/room.interface';
import { UserI } from 'src/app/model/user/user.interface';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AuthService } from 'src/app/public/services/auth-service/auth.service';
import { UserService } from '../../../public/services/user-service/user.service';
import { switchMap, tap, map, catchError } from 'rxjs/operators';
import { FormControl, FormGroup, FormBuilder, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { FriendsService } from '../../services/friends-service/friends.service';
import { FriendRequest } from 'src/app/model/friends/friends.interface';
import { HistoryI } from 'src/app/model/history/history.interface';
import { HistoryService } from '../../../public/services/history-service/history.service';
import { ChatService } from '../../services/chat-service/chat.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile-users.component.html',
  styleUrls: ['./profile-users.component.css']
})
export class ProfileusersComponent implements OnInit {

	blocked$: Observable<FriendRequest[]> = this.friendsService.getMyBlockedUsers();
	friends$: Observable<FriendRequest[]> = this.friendsService.getMyFriends();
	requests$: Observable<FriendRequest[]> = this.friendsService.getFriendRequests();
	history : Observable<HistoryI[]>;


	private userId$: Observable<number> = this.activatedRoute.params.pipe(
	  map((params: Params) => parseInt(params['id']))
	)

	user$: Observable<UserI> = this.userId$.pipe(
		switchMap((userId: number) => this.userService.findOne(userId))
		)

	constructor(private formBuilder: FormBuilder,
		private activatedRoute: ActivatedRoute,
		private userService: UserService,
		private router: Router,
		private authService: AuthService,
		private historyService: HistoryService,
		private friendsService: FriendsService,
		private chatService: ChatService,
		) {
			this.activatedRoute.params.subscribe(params => {
				if (params["id"]) {
				  this.doSearch(params["id"]);
				}
			  });
			}

		imageToShow: any;
		isImageLoading : boolean;
		idProfile: number;
		idRequest: number;

		yourFriend : number;
		yourBlocked : boolean;
		ngOnInit(): void {
			this.authService.getUserId().pipe(
				switchMap((idt: number) => this.userService.findOne(idt).pipe(
				tap((user) => {
					this.user$.subscribe(val => {
						if (!val || val.ban) this.router.navigate(['../../page-not-found'],{ relativeTo: this.activatedRoute })
						else if (val.id == user.id) {
							this.router.navigate(['../../profile'],{ relativeTo: this.activatedRoute })
						}
						else {
							this.history = this.historyService.findAllByUserId(val.id);
							this.getImageFromService(val.id);
							this.idProfile = val.id;
							this.isFriend();
							this.isblockedUser();
						}
						});
				  })
				))
			).subscribe()
		  }

		doSearch(term: string) {
			let test = parseInt(term);
			if (isNaN(test)) {
			  this.router.navigate(['../../page-not-found'],{ relativeTo: this.activatedRoute })
			}

		  }

		addFriend(){
			  this.friendsService.sendFriendRequest(this.idProfile.toString()).subscribe(
				  (data) => {
					  this.yourFriend = 1;
				  }
			  )
		}

		sendMessage() {
			
		}

		isFriend(){
			this.yourFriend = 0;
			this.friendsService.statusFriendRequest(this.idProfile.toString()).pipe(
				tap((x) => {
						this.idRequest = x.id;
						if(x.status == 'not-sent'){
							this.yourFriend = 0;
						}
						else if(x.status == 'pending'){
							this.yourFriend = 1;
						}
						else if(x.status == 'accepted'){
							this.yourFriend = 2;
						}
						else if(x.status == 'declined'){
							this.yourFriend = 3;
						}
						else if(x.status == 'waiting-for-current-user-response'){
							this.yourFriend = 4;
						}
						else if(x.status == 'blocked'){
							this.yourFriend = 5;
						}

				})
			).subscribe();
		}

		blockUser(){
			this.friendsService.blockOrUnblockUsers(this.idProfile.toString()).subscribe(
				(data) => {
					this.yourBlocked = !this.yourBlocked;
				})
		}

		spectateGame(){
			let _user: number;

			this.authService.getUserId().pipe(
				switchMap((idt: number) => this.userService.findOne(idt).pipe(
					tap((user) => {
					_user = user.id;
					this.chatService.spectate(this.idProfile, _user);
					this.router.navigate(['../../match'],{ relativeTo: this.activatedRoute })
					})
				))
				).subscribe()
		}

		isblockedUser(){
			this.yourBlocked = false;
			this.blocked$.pipe(
				tap((x) => {
					for (let index = 0; index < x.length; index++) {
						if (x[index].receiver.id == this.idProfile)
							this.yourBlocked = true;
			}})).subscribe();
		  }

		removeFriend(){
			this.friendsService.removeFriendRequest(this.idProfile.toString()).subscribe(
				(data) => {
					this.yourFriend = 0;
				})
		}

		responseToFriend(res:string){
			this.friendsService.responseFriendRequest(this.idRequest.toString(),res).subscribe(
				(data) => {
					if (data.status == 'accepted')
						this.yourFriend = 2;
					if (data.status == 'declined')
						this.yourFriend = 3;
				}
			)
		}


		createImageFromBlob(image: Blob) {
			let reader = new FileReader();
			reader.addEventListener("load", () => {
			   this.imageToShow = reader.result;
			}, false);

			if (image) {
			   reader.readAsDataURL(image);
			}
		}

		getImageFromService(id:number) {
			this.isImageLoading = true;

			this.userService.getImage("/api/users/avatarById/" + id.toString()).subscribe(data => {
			  this.createImageFromBlob(data);
			  this.isImageLoading = false;
			}, error => {
			  this.isImageLoading = false;
			});
		}

		onSelectOpp(event: MatSelectionListChange) {
			this.user$.pipe(
				tap((x) =>{
					if (event.source.selectedOptions.selected[0])
					{
						if (x.id == event.source.selectedOptions.selected[0].value.playerOne.id)
							this.router.navigate(['../' + event.source.selectedOptions.selected[0].value.playerTwo.id], { relativeTo: this.activatedRoute });
						else
							this.router.navigate(['../' + event.source.selectedOptions.selected[0].value.playerOne.id], { relativeTo: this.activatedRoute });
					}
				}
				)
			).subscribe()
		}

	}

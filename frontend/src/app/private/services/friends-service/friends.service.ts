import { HttpClient } from '@angular/common/http';
import { HostListener, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MessageI, MessagePaginateI } from 'src/app/model/chat/message.interface';
import { RoomI, RoomPaginateI } from 'src/app/model/chat/room.interface';
import { FriendRequest, FriendRequestStatus } from 'src/app/model/friends/friends.interface';
import { GameStateI } from 'src/app/model/game-state.interface';
import { UserI } from 'src/app/model/user/user.interface';
import { AuthService } from 'src/app/public/services/auth-service/auth.service';
import { CustomSocket } from '../../sockets/custom-socket';

@Injectable({
  providedIn: 'root'
})
export class FriendsService {

  constructor(
	private http: HttpClient,
    private socket: CustomSocket,
    private snackbar: MatSnackBar,
    private authService: AuthService,
    ) {}

	sendFriendRequest(userId: string): Observable<FriendRequest | { error: string }> {
		return this.http.post<FriendRequest | { error: string }>(`/api/friend/friend-request/send/` + userId, {});
	}
	
	statusFriendRequest(userId: string): Observable<FriendRequestStatus> {
		return this.http.get<FriendRequestStatus>(`/api/friend/friend-request/status/` + userId);
	}
	
	responseFriendRequest(requestId: string, res:string): Observable<FriendRequestStatus> {
		return this.http.put<FriendRequestStatus>(`/api/friend/friend-request/response/` + requestId, {res});
	}
	
	blockOrUnblockUsers(userId: string): Observable<FriendRequest | { error: string } | { success: string }> {
		return this.http.post<FriendRequest | { error: string } | { success: string }>(`/api/friend/friend-request/block/` + userId,{});
	}
	
	getFriendRequests(): Observable<FriendRequestStatus[]> {
		return this.http.get<FriendRequest[]>(`/api/friend/friend-request/me/received-requests`);
	}
	
	getMyFriends(): Observable<FriendRequestStatus[] | undefined> {
		return this.http.get<FriendRequest[] | undefined>(`/api/friend/friend-request/me/my-friends`);
	}
	
	getMyBlockedUsers(): Observable<FriendRequest[] | undefined> {
		return this.http.get<FriendRequest[] | undefined>(`/api/friend/friend-request/me/my-blocked`);
	}
	
	removeFriendRequest(userId: string): Observable<FriendRequest | { error: string }> {
		return this.http.post<FriendRequest | { error: string }>(`/api/friend/friend-request/remove/` + userId, {});
	}
}

import { UserI } from "src/user/model/user.interface";

export type FriendRequest_Status =
  | 'not-sent'
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'waiting-for-current-user-response'
  | 'blocked';

export interface FriendRequestStatus {
  status?: FriendRequest_Status;
}

export interface FriendRequest {
  id?: number;
  creator?: UserI;
  receiver?: UserI	;
  status?: FriendRequest_Status;
}
import { UserI } from "../user/user.interface";

export type FriendRequest_Status =
  | 'not-sent'
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'waiting-for-current-user-response'
  | 'blocked';

export interface FriendRequestStatus {
  status?: FriendRequest_Status;
  id?: number;
}

export interface FriendRequest {
  id?: number;
  creator?: UserI;
  receiver?: UserI;
  status?: FriendRequest_Status;
}
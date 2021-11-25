import { Meta } from "@angular/platform-browser";
import { RoomI } from "./room.interface";
import { UserI } from "../user/user.interface";

export interface MessageI {
  id?: number;
  type: number;
  text: string;
  user?: UserI;
  room: RoomI;
  created_at?: Date;
  updated_at?: Date;
}

export interface MessagePaginateI {
  items: MessageI[];
  meta: Meta;
}
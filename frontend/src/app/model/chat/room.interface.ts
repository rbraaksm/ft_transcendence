import { Meta } from "./meta.interface";
import { UserI } from "../user/user.interface";

export enum RoomType {
    PUBLIC = 'public',
    PRIVATE = 'private',
    PROTECTED = 'protected',
}

export interface RoomI {
  id?: number;
  name?: string;
  description?: string;
  password?: string;
  type?: RoomType;
  users?: UserI[];
  admin?: UserI[];
  muted?: UserI[];
  owner?: UserI;
  created_at?: Date;
  updated_at?: Date;
}

export interface RoomPaginateI {
  items: RoomI[];
  meta: Meta;
}
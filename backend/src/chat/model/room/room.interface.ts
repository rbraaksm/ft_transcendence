import { UserI } from "src/user/model/user.interface";

export enum RoomType {
    PUBLIC = 'public',
    PRIVATE = 'private',
    PROTECTED = 'protected',
    CLOSE = 'close',
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

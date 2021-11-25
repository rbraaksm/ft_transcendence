import { CoordinatesI } from "./coordinates.interface";
import { UserI } from "./user/user.interface";
import { Socket } from 'socket.io';

export interface PlayerI {
  user?: UserI;
  socket?: Socket;
  paddle: CoordinatesI;
  points: number;
}
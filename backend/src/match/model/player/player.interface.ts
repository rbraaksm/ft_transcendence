import { UserI } from "src/user/model/user.interface";
import { CoordinatesI } from "../coordinates/coordinates.interface";
import { Socket } from 'socket.io';

export interface PlayerI {
  user?: UserI;
  socket?: Socket;
  paddle: CoordinatesI;
  points: number;
}
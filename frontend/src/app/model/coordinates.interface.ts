import { PlayerI } from "./player.interface";
import { UserI } from "./user/user.interface";


export interface CoordinatesI {
  x: number;
  y: number;
  width: number;
  height: number;
  dx?: number;
  dy?: number;
  speedmultiplier?: number;
}
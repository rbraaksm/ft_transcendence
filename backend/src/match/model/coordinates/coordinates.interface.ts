import { PlayerI } from "../player/player.interface";
import { UserI } from "src/user/model/user.interface";


export interface CoordinatesI {
  x: number;
  y: number;
  width: number;
  height: number;
  dx?: number;
  dy?: number;
  speedmultiplier?: number;
}
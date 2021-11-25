import { PlayerI } from "./player.interface";
import { CoordinatesI } from "./coordinates.interface";
import { PowerI } from "./power.interface";
import { UserI } from "./user/user.interface";

export interface GameStateI {
    id?: NodeJS.Timeout;
    player1: PlayerI;
    player2: PlayerI;
    spectators?: PlayerI[];
    ball: CoordinatesI;
    type: number;
    powers?: PowerI[];
}
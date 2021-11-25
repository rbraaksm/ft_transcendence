import { PlayerI } from "../player/player.interface";
import { CoordinatesI } from "../coordinates/coordinates.interface";
import { UserService } from "src/user/service/user-service/user.service";
import { PowerI } from "../powers/powers.interface";
import { HistoryService } from 'src/history/service/history.service';
import { RoomI } from "src/chat/model/room/room.interface";

export interface GameStateI {
    userServices?: UserService;
    historyServices?: HistoryService;
    id?: NodeJS.Timeout;
    p_id?: number;
    player1: PlayerI;
    player2: PlayerI;
    spectators?: PlayerI[];
    ball: CoordinatesI;
    type: number;
    powers?: PowerI[];
    room?: RoomI;
}
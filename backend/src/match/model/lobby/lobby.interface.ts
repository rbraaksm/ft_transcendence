import { GameStateI } from "../game-state/game-state.interface";

export interface LobbyI {
    normalRooms: GameStateI[];
    blitzRooms: GameStateI[];
    privateRooms: GameStateI[];
}

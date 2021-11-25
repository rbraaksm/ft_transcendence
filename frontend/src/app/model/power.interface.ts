import { CoordinatesI } from "./coordinates.interface";

export interface PowerI {
    pos: CoordinatesI,
    player: number,
    duration: number,
    color: string,
    activate(n_player: number): void,
    deactivate(n_player: number): void,
}
import { UserI } from "src/user/model/user.interface";

export interface HistoryI {
  id?: number;
  playerOne?: UserI;
  playerTwo?: UserI;
  playerOneScore?: number;
  playerTwoScore?: number;
  game?: string;
  date?: Date;
}
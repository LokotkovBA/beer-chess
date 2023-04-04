import { type GameStatus } from "@prisma/client";
import { type Socket } from "socket.io-client";
import { type PromoteData } from "~/components/ChessBoard";
import { type PieceCoordinates } from "~/utils/PieceNotation";

export type PositionStatus = "PLAYABLE" | "STALEMATE" | "CHECK" | "CHECKMATE" | "DEAD" | "ERROR";
export type ChessState = {
    //whitePlayerName: string,
    //blackPlayerName: string,
    pieceMap: PieceCoordinates | null,
    pieceLegalMoves: string[][], //legal moves of current piece
    allLegalMoves: string[][],
    promoteData: PromoteData[],
    showPromotionMenu: boolean,
    whiteTurn: boolean,
    timeLeftWhite: number,
    timeLeftBlack: number,
    gameStatus: GameStatus,
    positionStatus: PositionStatus,
    canMove: () => boolean,
    setGameId: (gameId: string) => void,
    setShowPromotionMenu: (show: boolean) => void,
    setPromoteData: (promoteData: PromoteData[]) => void,
    setPieceLegalMoves: (legalMoves: string[][]) => void,
    movePiece: (oldCoords: string, newCoords: string) => void,
    makeMove: (moveIndex: number, oldCoords: string, newCoords: string, socket: Socket) => void,
    subscribeToMoves: (socket: Socket, gameId: string) => void,
    unsubscribeFromMoves: (socket: Socket, gameId: string) => void,
    decrementTimer: () => void,
}

const positionStatusValues = ["PLAYABLE", "STALEMATE", "CHECK", "CHECKMATE", "DEAD", "ERROR"];
export function isPositionStatus(value: string): value is PositionStatus {
    return positionStatusValues.includes(value);
}

const gameStatusValues = ["INITIALIZING", "FM", "STARTED", "TIE", "BLACKWON", "WHITEWON"];
export function isGameStatus(value: string): value is GameStatus {
    return gameStatusValues.includes(value);
}
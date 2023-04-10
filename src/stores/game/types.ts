import { type GameStatus } from "@prisma/client";
import { type UseMutateFunction } from "@tanstack/react-query";
import { type TRPCClientErrorLike } from "@trpc/react-query";
import { type inferProcedureOutput, type inferProcedureInput } from "@trpc/server";
import { type Socket } from "socket.io-client";
import { type PromoteData } from "~/components/ChessBoard";
import { type AppRouter } from "~/server/api/root";
import { type PieceCoordinates } from "~/utils/PieceNotation";


type GameUpdateType = AppRouter["games"]["update"];
type PositionUseMutationFunction = UseMutateFunction<inferProcedureOutput<GameUpdateType>, TRPCClientErrorLike<GameUpdateType>, inferProcedureInput<GameUpdateType>, unknown>;

export type PositionStatus = "PLAYABLE" | "STALEMATE" | "CHECK" | "CHECKMATE" | "DEAD" | "ERROR";
export type ChessState = {
    playerWhite: string,
    playerBlack: string,
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
    lastMoveFrom: string,
    lastMoveTo: string,
    capturedPieces: [string, number][]
    decrementTimer: () => void,
    canMove: () => boolean,
    setShowPromotionMenu: (show: boolean) => void,
    setPromoteData: (promoteData: PromoteData[]) => void,
    setPieceLegalMoves: (legalMoves: string[][]) => void,
    movePiece: (oldCoords: string, newCoords: string) => void,
    makeMove: (moveIndex: number, oldCoords: string, newCoords: string, socket: Socket, secretName: string, updateDB: PositionUseMutationFunction) => void,
    subscribeToMoves: (socket: Socket) => void,
    unsubscribeFromMoves: (socket: Socket, gameId: string) => void,
}

const positionStatusValues = ["PLAYABLE", "STALEMATE", "CHECK", "CHECKMATE", "DEAD", "ERROR"];
export function isPositionStatus(value: string): value is PositionStatus {
    return positionStatusValues.includes(value);
}

const gameStatusValues = ["INITIALIZING", "FM", "STARTED", "TIE", "BLACKWON", "WHITEWON"];
export function isGameStatus(value: string): value is GameStatus {
    return gameStatusValues.includes(value);
}
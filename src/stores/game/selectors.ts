import { type ChessState } from "./types";

export function boardSelector(state: ChessState) { //selector for the entire board
    return {
        playerWhite: state.playerWhite,
        playerBlack: state.playerBlack,
        allLegalMoves: state.allLegalMoves,
        pieceMap: state.pieceMap,
        pieceLegalMoves: state.pieceLegalMoves,
        showPromotionMenu: state.showPromotionMenu,
        whiteTurn: state.whiteTurn,
        promoteData: state.promoteData,
        lastMoveFrom: state.lastMoveFrom,
        lastMoveTo: state.lastMoveTo,
        canMove: state.canMove,
        setPieceLegalMoves: state.setPieceLegalMoves,
        makeMove: state.makeMove
    } as const;
}

export function gameStatusSelector(state: ChessState) {
    return [state.gameStatus, state.positionStatus] as const;
}

export function moveSubSelector(state: ChessState) {
    return [state.subscribeToMoves, state.unsubscribeFromMoves] as const;
}

export function playersSelector(state: ChessState) {
    return [state.playerWhite, state.playerBlack] as const;
}

export function timerSelector(state: ChessState) {
    return [state.timeLeftWhite, state.timeLeftBlack, state.gameStatus, state.decrementTimer] as const;
}

export function pieceSelector(state: ChessState) { //selector for a piece
    return state.makeMove;
}

export function capturedPiecesSelector(state: ChessState) { //selector for a piece
    return state.capturedPieces;
}
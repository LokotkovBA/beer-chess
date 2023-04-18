import { type GameState } from "./types";

export function boardSelector(state: GameState) { //selector for the entire board
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

export function gameStatusSelector(state: GameState) {
    return [state.gameStatus, state.positionStatus] as const;
}

export function moveSubSelector(state: GameState) {
    return [state.subscribeToMoves, state.unsubscribeFromMoves] as const;
}

export function playersSelector(state: GameState) {
    return [state.playerWhite, state.playerBlack] as const;
}

export function timerSelector(state: GameState) {
    return [state.timeLeftWhite, state.timeLeftBlack, state.gameStatus, state.decrementTimer] as const;
}

export function pieceSelector(state: GameState) { //selector for a piece
    return state.makeMove;
}

export function capturedPiecesSelector(state: GameState) { //selector for a piece
    return state.capturedPieces;
}

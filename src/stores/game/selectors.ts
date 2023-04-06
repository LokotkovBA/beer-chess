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
        makeMove: state.makeMove,
        subscribeToMoves: state.subscribeToMoves,
        unsubscribeFromMoves: state.unsubscribeFromMoves,
    } as const;
}
export function timerSelector(state: ChessState) {
    return [state.timeLeftWhite, state.timeLeftBlack, state.whiteTurn, state.gameStatus] as const;
}

export function pieceSelector(state: ChessState) { //selector for a piece
    return state.makeMove;
}
import React, { type PropsWithChildren, useEffect, useRef } from "react";
import { shallow } from "zustand/shallow";
import { capturedPiecesSelector, timerSelector } from "~/stores/game/selectors";
import { subscribeToGameStore } from "~/stores/game/store";
import { GenericPiece } from "./ChessPiece";

type GameInfoPanelProps = {
    gameId: string
    boardAlignment: boolean
}

const GameInfoPanel: React.FC<GameInfoPanelProps> = ({ boardAlignment, gameId }) => {
    return (
        <CapturedPieces size="3rem" gameId={gameId} boardAlignment={boardAlignment}>
            <GameTimer gameId={gameId} boardAlignment={boardAlignment}>
                <div></div>
            </GameTimer>
        </CapturedPieces>
    );
};
export default GameInfoPanel;

type CapturedPiecesProps = {
    gameId: string
    boardAlignment: boolean
    size: string
}

const CapturedPieces: React.FC<CapturedPiecesProps & PropsWithChildren> = ({ gameId, children, boardAlignment, size }) => {
    const useChessStore = subscribeToGameStore(gameId);
    const capturedPieces = useChessStore(capturedPiecesSelector, shallow);
    return (
        <div className="panel-wrapper">
            {capturedPieces.filter(([piece,]) => boardAlignment ? (piece.toUpperCase() === piece) : (piece.toLowerCase() === piece)).map(([piece, count]) => {
                return (
                    <React.Fragment key={piece}>
                        <GenericPiece key={piece} size={size} piece={piece} />
                        {count > 1 && `x${count}`}
                    </React.Fragment>
                );
            })}
            <div style={{ width: size, height: size, display: "inline-block" }} />
            {children}
            {capturedPieces.filter(([piece,]) => boardAlignment ? (piece.toLowerCase() === piece) : (piece.toUpperCase() === piece)).map(([piece, count]) => {
                return (
                    <React.Fragment key={piece}>
                        <GenericPiece size={size} piece={piece} />
                        {count > 1 && `X${count}`}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

type GameTimerProps = {
    gameId: string
    boardAlignment: boolean
}

function parseTime(ms: number) {
    return new Date(ms).toISOString().slice(14, 19);
}

export const GameTimer: React.FC<GameTimerProps & PropsWithChildren> = ({ gameId, children, boardAlignment }) => {
    const useChessStore = subscribeToGameStore(gameId);
    const [
        timeLeftWhite,
        timeLeftBlack,
        gameStatus,
        decrementTimer
    ] = useChessStore(timerSelector, shallow);
    const intervalRef = useRef<ReturnType<typeof setInterval>>();

    useEffect(() => {
        if (gameStatus === "STARTED") {
            intervalRef.current = setInterval(() => {
                decrementTimer();
            }, 1000);
        }
        return () => {
            clearInterval(intervalRef.current);
        };
    }, [gameStatus, decrementTimer]);

    return (
        <div>
            <h2>{parseTime(boardAlignment ? timeLeftBlack : timeLeftWhite)}</h2>
            {children}
            <h2>{parseTime(boardAlignment ? timeLeftWhite : timeLeftBlack)}</h2>
        </div>
    );
};

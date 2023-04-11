import React, { type PropsWithChildren, useEffect, useRef, useState, memo } from "react";
import { shallow } from "zustand/shallow";
import { capturedPiecesSelector, playersSelector, timerSelector } from "~/stores/game/selectors";
import { subscribeToGameStore } from "~/stores/game/store";
import { GenericPiece } from "./ChessPiece";
import { useSession } from "next-auth/react";
import Flag from "~/assets/Flag";
import { api } from "~/utils/api";
import { socket } from "~/server/gameServer";
import { toast } from "react-hot-toast";
import Cross from "~/assets/Cross";

type GameInfoPanelProps = {
    gameId: string
    boardAlignment: boolean
}

const GameInfoPanel: React.FC<GameInfoPanelProps> = ({ boardAlignment, gameId }) => {
    const useChessStore = subscribeToGameStore(gameId);
    const [playerWhite, playerBlack] = useChessStore(playersSelector);
    const [commitForfeit, setCommitForfeit] = useState(false);
    const { data: sessionData } = useSession();
    const { data: secretName } = api.games.getSecretName.useQuery();

    function forfeit() {
        if (commitForfeit) {
            socket.emit("forfeit", { gameId, secretName });
        }
        setCommitForfeit(true);
    }

    function suggestDraw() {
        socket.emit("suggest draw", { gameId, secretName });
        toast.success("Предложение отправлено");
    }
    return (
        <div className="panel-wrapper">
            <CapturedPieces size="3rem" gameId={gameId} boardAlignment={boardAlignment}>
                <GameTimer gameId={gameId} boardAlignment={boardAlignment}>
                    {
                        (sessionData?.user.uniqueName === playerWhite || sessionData?.user.uniqueName === playerBlack)
                        &&
                        <div className="panel-wrapper__actions">
                            <button onClick={suggestDraw} className="link"><span className="icon-draw">½</span></button>
                            <button onClick={forfeit} className={`link${commitForfeit ? " link--sure" : ""}`}><Flag size="3rem" /></button>
                            {commitForfeit && <button onClick={() => setCommitForfeit(false)} className="link"><Cross size="1.5rem" /></button>}
                        </div>
                    }
                </GameTimer>
            </CapturedPieces>
        </div>
    );
};
export default GameInfoPanel;

type CapturedPiecesProps = {
    gameId: string
    boardAlignment: boolean
    size: string
}

const CapturedPieces: React.FC<CapturedPiecesProps & PropsWithChildren> = memo(function CapturedPieces({ gameId, children, boardAlignment, size }) {
    const useChessStore = subscribeToGameStore(gameId);
    const capturedPieces = useChessStore(capturedPiecesSelector, shallow);
    return (
        <>
            <div className="panel-wrapper__pieces panel-wrapper__pieces--upper">
                {capturedPieces.filter(([piece,]) => boardAlignment ? (piece.toUpperCase() === piece) : (piece.toLowerCase() === piece)).map(([piece, count]) => {
                    return (
                        <React.Fragment key={piece}>
                            <GenericPiece key={piece} size={size} piece={piece} />
                            {count > 1 && `x${count}`}
                        </React.Fragment>
                    );
                })}
            </div>
            {children}
            <div className="panel-wrapper__pieces panel-wrapper__pieces--lower">
                {capturedPieces.filter(([piece,]) => boardAlignment ? (piece.toLowerCase() === piece) : (piece.toUpperCase() === piece)).map(([piece, count]) => {
                    return (
                        <React.Fragment key={piece}>
                            <GenericPiece size={size} piece={piece} />
                            {count > 1 && `X${count}`}
                        </React.Fragment>
                    );
                })}
            </div>
        </>
    );
});

type GameTimerProps = {
    gameId: string
    boardAlignment: boolean
}

function parseTime(ms: number) {
    return new Date(ms).toISOString().slice(14, 19);
}

export const GameTimer: React.FC<GameTimerProps & PropsWithChildren> = memo(function GameTimer({ gameId, children, boardAlignment }) {
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
        <>
            <h2 className="panel-wrapper__time--upper">{parseTime(boardAlignment ? timeLeftBlack : timeLeftWhite)}</h2>
            {children}
            <h2 className="panel-wrapper__time--lower">{parseTime(boardAlignment ? timeLeftWhite : timeLeftBlack)}</h2>
        </>
    );
});
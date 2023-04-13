import React, { type PropsWithChildren, useEffect, useRef, useState, memo, useMemo } from "react";
import { shallow } from "zustand/shallow";
import { capturedPiecesSelector, gameStatusSelector, playersSelector, timerSelector } from "~/stores/game/selectors";
import { subscribeToGameStore } from "~/stores/game/store";
import { GenericPiece } from "./ChessPiece";
import { useSession } from "next-auth/react";
import Flag from "~/assets/Flag";
import { api } from "~/utils/api";
import { socket } from "~/server/gameServer";
import { toast } from "react-hot-toast";
import { type GameStatus } from "@prisma/client";
import { type PositionStatus } from "~/stores/game/types";
import { Check, CircledCross, Cross } from "~/assets/ChoiceIcons";

type GameInfoPanelProps = {
    gameId: string,
    boardAlignment: boolean,
    roomId: string
}

const GameInfoPanel: React.FC<GameInfoPanelProps> = ({ boardAlignment, gameId, roomId }) => {
    const useChessStore = subscribeToGameStore(gameId);
    const [playerWhite, playerBlack] = useChessStore(playersSelector);
    const [gameStatus, positionStatus] = useChessStore(gameStatusSelector);

    const { data: sessionData } = useSession();
    return (
        <div className="panel-wrapper">
            <CapturedPieces size="3rem" gameId={gameId} boardAlignment={boardAlignment}>
                <GameTimer gameId={gameId} boardAlignment={boardAlignment}>
                    {
                        (sessionData?.user.uniqueName === playerWhite || sessionData?.user.uniqueName === playerBlack)
                            ?
                            <div className="panel-wrapper__actions">
                                <ActionsPanel roomId={roomId} gameId={gameId} />
                            </div>
                            :
                            <h3>
                                {getEndgameMessage(gameStatus, positionStatus)}
                            </h3>
                    }
                </GameTimer>
            </CapturedPieces>
        </div>
    );
};
export default GameInfoPanel;

function getEndgameMessage(gameStatus: GameStatus, positionStatus: PositionStatus) {
    let message = "";
    switch (gameStatus) {
        case "TIE":
            message = "Ничья";
            break;
        case "BLACKWON":
            message = "Победа чёрных";
            break;
        case "WHITEWON":
            message = "Победа белых";
            break;
        case "INITIALIZING":
            return "Игра вот вот начнётся";
        case "FM":
        case "STARTED":
            return "Игра в процессе";
    }
    switch (positionStatus) {
        case "STALEMATE":
            message = `Пат • ${message}`;
            break;
        case "CHECKMATE":
            message = `Мат • ${message}`;
            break;
        case "DEAD":
            message = `Мёртвая позиция • ${message}`;
            break;
        case "FORFEIT":
            message = `Игрок сдался • ${message}`;
            break;
        default:
            message = `Игра окончена • ${message}`;
            break;
    }
    return message;
}

function isPlaying(gameStatus: GameStatus) {
    switch (gameStatus) {
        case "INITIALIZING":
        case "FM":
        case "STARTED":
            return true;
        default:
            return false;
    }
}

type ActionsPanelProps = {
    gameId: string,
    roomId: string
}

const ActionsPanel: React.FC<ActionsPanelProps> = ({ gameId, roomId }) => {
    const useChessStore = subscribeToGameStore(gameId);
    const [gameStatus, positionStatus] = useChessStore(gameStatusSelector);
    const [commitForfeit, setCommitForfeit] = useState(false);
    const [suggestReceived, setSuggestReceived] = useState(false);
    const { data: secretName } = api.games.getSecretName.useQuery();
    const socketMessage = useMemo(() => ({ gameId, secretName }), [gameId, secretName]);
    function forfeit() {
        if (commitForfeit) {
            socket.emit("forfeit", socketMessage);
        }
        setCommitForfeit(true);
    }

    function suggestTie() {
        socket.emit("suggest tie", socketMessage);
        toast.success("Предложение отправлено");
    }

    useEffect(() => {
        socket.on(`${gameId} request`, () => {
            setSuggestReceived(true);
        });
        return () => {
            socket.off(`${gameId} request`);
        };
    }, [gameId]);

    function acceptTie() {
        socket.emit("tie", socketMessage);
        setSuggestReceived(false);
    }

    if (isPlaying(gameStatus)) {
        return (suggestReceived ?
            <>
                <h3>Ничья?</h3>
                <button type="button" className="link" onClick={acceptTie}><Check size="1.5rem" /></button>
                <button type="button" className="link" onClick={() => setSuggestReceived(false)}><Cross size="1.5rem" /></button>
            </>
            :
            <>
                <button type="button" onClick={suggestTie} className="link" title="Предложить ничью"><span className="icon-tie">½</span></button>
                <button type="button" onClick={forfeit} className={`link${commitForfeit ? " link--sure" : ""}`}><Flag size="3rem" /></button>
                {commitForfeit && <button onClick={() => setCommitForfeit(false)} className="link"><CircledCross size="1.5rem" /></button>}
            </>
        );
    }

    if (suggestReceived) {
        return <RematchDialog gameId={gameId} roomId={roomId} changeVisibility={setSuggestReceived} />;
    }

    return (
        <div className="endgame-message">
            <h3 className="endgame-message__heading">{getEndgameMessage(gameStatus, positionStatus)}</h3>
            <button onClick={() => socket.emit("rematch", socketMessage)} className="button endgame-message__button">Ещё одну!</button>
        </div>
    );
};


type RematchDialogProps = {
    roomId: string,
    gameId: string,
    changeVisibility: React.Dispatch<React.SetStateAction<boolean>>
}

const RematchDialog: React.FC<RematchDialogProps> = ({ gameId, changeVisibility, roomId }) => {
    const useChessStore = subscribeToGameStore(gameId);
    const [whiteUsername, blackUsername] = useChessStore(playersSelector);
    const initialGameData = useRef({ blackUsername: whiteUsername, whiteUsername: blackUsername, timeRule: "", title: "", gameId: "", maxTime: 0, roomId, secretName: "" });
    api.games.getSecretName.useQuery(undefined, {
        onSuccess(secretName) {
            initialGameData.current.secretName = secretName;
        }
    });

    api.games.get.useQuery({ gameId }, {
        onSuccess: (gameData) => {
            if (gameData) {
                initialGameData.current.timeRule = gameData.timeRule;
                initialGameData.current.title = gameData.title;
            }
        }
    });

    const { mutate: createGame } = api.games.create.useMutation({
        onSuccess: ({ id }) => {
            socket.emit("game ready", { roomId });
            initialGameData.current.gameId = id;
            socket.emit("start game", initialGameData.current);
        }
    });

    function onClickYes() {
        initialGameData.current.maxTime = Number(initialGameData.current.timeRule.split("/")[0]) * 60 * 1000;
        if (initialGameData.current.maxTime) {
            createGame(initialGameData.current);
        }
    }

    return (
        <>
            <h3>Ещё одну?</h3>
            <button onClick={onClickYes} type="button" className="link"><Check size="1.5rem" /></button>
            <button onClick={() => changeVisibility(false)} type="button" className="link"><Cross size="1.5rem" /></button>
        </>
    );
};

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
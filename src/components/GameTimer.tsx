import React, { useEffect, useRef, useState } from "react";
import { timerSelector } from "~/stores/game/selectors";
import { subscribeToGameStore } from "~/stores/game/store";

type GameTimerProps = {
    gameId: string
}


function parseTime(ms: number) {
    return new Date(ms).toISOString().slice(14, 19);
}

export const GameTimer: React.FC<GameTimerProps> = ({ gameId }) => {
    const useChessStore = subscribeToGameStore(gameId);
    const [
        timeLeftWhite,
        timeLeftBlack,
        whiteTurn,
        gameStatus
    ] = useChessStore(timerSelector);
    const intervalRef = useRef<ReturnType<typeof setInterval>>();
    const [curTimeLeftWhite, setCurTimeLeftWhite] = useState(timeLeftWhite);
    const [curTimeLeftBlack, setCutTimeLeftBlack] = useState(timeLeftBlack);

    useEffect(() => {
        setCurTimeLeftWhite(timeLeftWhite); //re-render triggers re-render
    }, [timeLeftWhite]);

    useEffect(() => {
        setCutTimeLeftBlack(timeLeftBlack);
    }, [timeLeftBlack]);

    useEffect(() => {
        if (gameStatus === "STARTED") {
            intervalRef.current = setInterval(() => {
                setCurTimeLeftWhite(timeLeft => timeLeft - (whiteTurn ? 1000 : 0));
                setCutTimeLeftBlack(timeLeft => timeLeft - (whiteTurn ? 0 : 1000));
            }, 1000);
        }
        return () => {
            clearInterval(intervalRef.current);
        };
    }, [whiteTurn, gameStatus]);

    return (
        <div>
            <h2>{parseTime(curTimeLeftBlack)}</h2>
            <h2>{parseTime(curTimeLeftWhite)}</h2>
        </div>
    );
};
import React, { useEffect, useRef } from "react";
import { timerSelector } from "~/stores/game/selectors";
import { subscribeToGameStore } from "~/stores/game/store";
import { shallow } from "zustand/shallow";


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
            <h2>{parseTime(timeLeftBlack)}</h2>
            <h2>{parseTime(timeLeftWhite)}</h2>
        </div>
    );
};
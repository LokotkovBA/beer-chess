import { useDroppable } from "@dnd-kit/core";
import React from "react";
import { socket } from "~/server/gameServer";
import { pieceSelector } from "~/stores/game/selectors";
import { subscribeToGameStore } from "~/stores/game/store";
import { api } from "~/utils/api";


interface DotProps {
    gameId: string;
    size: string;
    id: string;
    capturingPieceCoords: string;
    coords: string;
    moveIndex: number;
    blackColor?: string;
}

export const Dot: React.FC<DotProps> = ({ size, blackColor = "var(--piece-color-black)", id, moveIndex, coords, capturingPieceCoords, gameId }) => {
    const { setNodeRef } = useDroppable({ id: id, data: { moveIndex, newCoords: coords } });
    const { data: secretName } = api.games.getSecretName.useQuery();
    const { mutate: updateGame } = api.games.update.useMutation();
    const useChessStore = subscribeToGameStore(gameId);
    const makeMove = useChessStore(pieceSelector);
    return (
        <div onClick={() => secretName && makeMove(moveIndex, capturingPieceCoords, coords, socket, secretName, gameId, updateGame)} className="chess-piece--capture" ref={setNodeRef}>
            <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 33C28.9706 33 33 28.9706 33 24C33 19.0294 28.9706 15 24 15C19.0294 15 15 19.0294 15 24C15 28.9706 19.0294 33 24 33Z" fill={blackColor} />
            </svg>
        </div>
    );
};




import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import React from "react";
import GenericPiece from "~/assets/GenericPiece";
import { socket } from "~/server/gameServer";
import { pieceSelector } from "~/stores/game/selectors";
import { subscribeToGameStore } from "~/stores/game/store";
import { type PieceNotation } from "~/utils/PieceNotation";
import { api } from "~/utils/api";

type GenericChessPieceProps = {
    gameId: string,
    piece: PieceNotation,
    coords: string,
    id: string,
    capturingPieceCoords: string,
    moveIndex?: number,
    disabled?: boolean,
    isLegal?: boolean,
    whiteColor?: string,
    blackColor?: string
}

const ChessPiece: React.FC<GenericChessPieceProps> = ({ gameId, piece, id, coords, moveIndex = -1, capturingPieceCoords, disabled = false, isLegal = false, whiteColor = "var(--piece-color-white)", blackColor = "var(--piece-color-black)" }) => {
    const useChessStore = subscribeToGameStore(gameId);
    const makeMove = useChessStore(pieceSelector);
    const { data: secretName } = api.games.getSecretName.useQuery();
    const { setNodeRef, attributes: { role, tabIndex }, listeners, transform, isDragging } = useDraggable({ id: id, disabled, data: { coords } });
    const { setNodeRef: setDroppable } = useDroppable({ id: id, disabled: !isLegal, data: { moveIndex, newCoords: coords } });
    const { mutate: updateGame } = api.games.update.useMutation();
    return (
        <div onClick={() => secretName && makeMove(moveIndex, capturingPieceCoords, coords, socket, secretName, gameId, updateGame)}
            className={`chess-piece${disabled ? "" : " chess-piece--active"}${isDragging ? " chess-piece--dragging" : ""}${isLegal ? " chess-piece--capture" : ""}`}
            style={{ transform: CSS.Transform.toString(transform) }} role={role} tabIndex={tabIndex} ref={setNodeRef} {...listeners} >
            <div ref={setDroppable}>
                <GenericPiece piece={piece} whiteColor={whiteColor} blackColor={blackColor} />
            </div>
        </div>
    );
};

export default ChessPiece;

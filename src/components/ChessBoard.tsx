import { DndContext } from "@dnd-kit/core";
import { type DragStartEvent, type DragEndEvent } from "@dnd-kit/core/dist/types";
import React, { memo, type PropsWithChildren, useMemo, useEffect } from "react";
import { z } from "zod";
import { socket } from "~/server/gameServer";
import ChessPiece from "./ChessPiece";
import { Dot } from "~/assets/Dot";
import { subscribeToGameStore } from "~/stores/game/store";
import { boardSelector, moveSubSelector } from "~/stores/game/selectors";
import { api } from "~/utils/api";
import { useSession } from "next-auth/react";
import { shallow } from "zustand/shallow";
import TileBoard from "./TileBoard";
import useSound from "use-sound";
import GenericPiece from "~/assets/GenericPiece";

type ChessBoardProps = {
    size: string;
    gameId: string;
}

const boardRanks = [1, 2, 3, 4, 5, 6, 7, 8];
const boardFiles = ["a", "b", "c", "d", "e", "f", "g", "h"];

export const ChessBoard: React.FC<ChessBoardProps> = memo(function ChessBoard({ size, gameId }) {
    const { data: sessionData } = useSession();
    const { data: gameData } = api.games.get.useQuery({ gameId });
    const boardAlignment = sessionData?.user.uniqueName !== gameData?.blackUsername;
    const playerBoardRanks = useMemo(() => {
        if (!boardAlignment) {
            return boardRanks;
        }
        const buf = [...boardRanks];
        return buf.reverse();
    }, [boardAlignment]);
    const playerBoardFiles = useMemo(() => {
        if (boardAlignment) {
            return boardFiles;
        }
        const buf = [...boardFiles];
        return buf.reverse();
    }, [boardAlignment]);

    return (
        <InteractiveBoard gameId={gameId} size={size} playerBoardRanks={playerBoardRanks} playerBoardFiles={playerBoardFiles}>
            <TileBoard size={size} ranks={playerBoardRanks} files={playerBoardFiles} />
        </InteractiveBoard>
    );
});

const InteractiveBoard: React.FC<ChessBoardProps & { playerBoardRanks: number[], playerBoardFiles: string[] } & PropsWithChildren> = ({ children, gameId, size, playerBoardFiles, playerBoardRanks }) => {
    const [play] = useSound("/move.placeholder.ogg", { volume: 0.5 });
    const { data: sessionData } = useSession();
    const { data: secretName } = api.games.getSecretName.useQuery();
    const useChessStore = subscribeToGameStore(gameId);
    const gameState = useChessStore(boardSelector, shallow);
    const [subscribeToMoves, unsubscribeFromMoves] = useChessStore(moveSubSelector, shallow);
    useEffect(() => {
        socket.emit("join game", ({ gameId }));
        return () => {
            socket.emit("leave game", ({ gameId }));
        };
    }, [gameId]);
    useEffect(() => {
        subscribeToMoves(socket, gameId, play);
        return () => {
            unsubscribeFromMoves(socket, gameId);
        };
    }, [gameId, subscribeToMoves, unsubscribeFromMoves, play]);
    const { mutate: updateGame } = api.games.update.useMutation();

    function onDragEnd(event: DragEndEvent) {
        if (!event.over || !secretName) return;
        const { coords: oldCoords } = z.object({ coords: z.string() }).parse(event.active.data.current);
        const { moveIndex, newCoords } = z.object({ moveIndex: z.number(), newCoords: z.string() }).parse(event.over.data.current);
        gameState.makeMove(moveIndex, oldCoords, newCoords, socket, secretName, gameId, updateGame);
    }

    function onDragStart(event: DragStartEvent) {
        if (!gameState.canMove()) return;
        const { coords } = z.object({ coords: z.string() }).parse(event.active.data.current);
        gameState.setPieceLegalMoves(gameState.allLegalMoves.filter((move) => move[0]?.includes(coords)));
    }
    return (
        <div className="game-wrapper" onClick={() => gameState.setPieceLegalMoves([])}>
            {children}
            <DndContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
                <div style={{ fontSize: size }} className="chess-board chess-board--pieces">
                    {playerBoardRanks.map((rank) => {
                        const files = playerBoardFiles.map((file) => {
                            const tileId = `${file}${rank}`;
                            const curPiece = gameState.pieceMap?.get(tileId);
                            const isLastMove = tileId === gameState.lastMoveFrom || tileId === gameState.lastMoveTo;
                            let moveIndex = -1;
                            let capturingPieceCoords = "";
                            const isLegal = gameState.pieceLegalMoves.reduce((prevIsLegal, elem, index) => {
                                if (elem[0]?.slice(2).includes(`${file}${rank}`)) {
                                    moveIndex = index;
                                    capturingPieceCoords = elem[0].slice(0, 2);
                                    return true;
                                }
                                return prevIsLegal;
                            }, false);
                            if (curPiece) {
                                const disabled = !((sessionData?.user.uniqueName === gameState.playerWhite && gameState.whiteTurn && curPiece.toUpperCase() === curPiece) ||
                                    (sessionData?.user.uniqueName === gameState.playerBlack && !gameState.whiteTurn && curPiece.toLowerCase() === curPiece));
                                const pieceId = `${curPiece}${file}${rank}`;
                                return (
                                    <EmptyTile isLastMove={isLastMove} key={tileId} isLegal={isLegal}>
                                        <ChessPiece gameId={gameId}
                                            capturingPieceCoords={capturingPieceCoords}
                                            moveIndex={moveIndex}
                                            isLegal={isLegal}
                                            coords={tileId}
                                            id={pieceId}
                                            piece={curPiece}
                                            disabled={disabled} />
                                    </EmptyTile>
                                );
                            }
                            return (
                                <EmptyTile isLastMove={isLastMove} key={tileId} >
                                    {isLegal && <Dot gameId={gameId} capturingPieceCoords={capturingPieceCoords} coords={tileId} moveIndex={moveIndex} id={tileId} size={size} />}
                                </EmptyTile>
                            );
                        });
                        return <div key={rank} className="chess-board__row">{files}</div>;
                    })}
                </div>
            </DndContext>
            {gameState.showPromotionMenu && <PromotionMenu promoteData={gameState.promoteData} isWhite={gameState.whiteTurn} size={size} gameId={gameId} />}
        </div>
    );
};

type TileColor = "white" | "black" | "selected";

type TileProps = {
    isLastMove?: boolean,
    color?: TileColor;
    isLegal?: boolean;
}

const EmptyTile: React.FC<TileProps & PropsWithChildren> = ({ isLegal = false, children, isLastMove }) => {
    return (
        <div className={`chess-tile${isLastMove ? " chess-tile--last-move" : ""}${(children && isLegal) ? " chess-tile--capture" : ""}`} >
            {children}
        </div>
    );
};

type PromotionMenuProps = {
    size: string;
    isWhite: boolean;
    gameId: string;
    promoteData: PromoteData[];
}
export type PromoteData = { piece: string, index: string };
const PromotionMenu: React.FC<PromotionMenuProps> = ({ size, isWhite, promoteData, gameId }) => {
    const { data: secretName } = api.games.getSecretName.useQuery();
    function selectPiece(index: string) {
        socket.emit("move", { gameId: gameId, move: index, secretName: secretName });
    }
    return (
        <menu className="promotion-menu">
            {promoteData.map(({ piece, index }) => {
                return (
                    <li className="chess-piece--capture" key={index} onClick={() => selectPiece(index)}>
                        <GenericPiece size={size} piece={isWhite ? piece.toUpperCase() : piece} />
                    </li>
                );
            })}
        </menu>
    );
};

import { DndContext } from "@dnd-kit/core";
import { type DragStartEvent, type DragEndEvent } from "@dnd-kit/core/dist/types";
import React, { memo, type PropsWithChildren, useMemo, useEffect } from "react";
import { z } from "zod";
import { socket } from "~/server/gameServer";
import ChessPiece, { GenericPiece } from "./ChessPiece";
import { Dot } from "~/assets/Dot";
import { subscribeToGameStore } from "~/stores/game/store";
import { boardSelector } from "~/stores/game/selectors";

type ChessBoardProps = {
    size: string;
    gameId: string;
    boardDefault?: boolean;
}

let curColor: TileColor = "black";
const boardRanks = [1, 2, 3, 4, 5, 6, 7, 8];
const boardFiles = ["a", "b", "c", "d", "e", "f", "g", "h"];

export const ChessBoard: React.FC<ChessBoardProps> = memo(function ChessBoard({ size, boardDefault = true, gameId }) {
    const playerBoardRanks = useMemo(() => {
        if (!boardDefault) {
            return boardRanks;
        }
        const buf = [...boardRanks];
        return buf.reverse();
    }, [boardDefault]);
    const playerBoardFiles = useMemo(() => {
        if (boardDefault) {
            return boardFiles;
        }
        const buf = [...boardFiles];
        return buf.reverse();
    }, [boardDefault]);

    return (
        <InteractiveBoard gameId={gameId} size={size} playerBoardRanks={playerBoardRanks} playerBoardFiles={playerBoardFiles}>
            <TileBoard ranks={playerBoardRanks} files={playerBoardFiles} size={size} />
        </InteractiveBoard>
    );
});

const InteractiveBoard: React.FC<ChessBoardProps & { playerBoardRanks: number[], playerBoardFiles: string[] } & PropsWithChildren> = ({ children, gameId, size, playerBoardFiles, playerBoardRanks }) => {
    const useChessStore = subscribeToGameStore(gameId);
    const {
        allLegalMoves,
        pieceMap,
        pieceLegalMoves,
        showPromotionMenu,
        whiteTurn,
        promoteData,
        lastMoveFrom,
        lastMoveTo,
        canMove,
        makeMove,
        setPieceLegalMoves,
        subscribeToMoves,
        unsubscribeFromMoves
    } = useChessStore(boardSelector);
    useEffect(() => {
        socket.emit("join game", ({ gameId }));
        return () => {
            socket.emit("leave game", ({ gameId }));
        };
    }, [gameId]);
    useEffect(() => {
        subscribeToMoves(socket, gameId);
        return () => {
            unsubscribeFromMoves(socket, gameId);
        };
    }, [gameId, subscribeToMoves, unsubscribeFromMoves]);

    function onDragEnd(event: DragEndEvent) {
        if (!event.over) return;
        const { coords: oldCoords } = z.object({ coords: z.string() }).parse(event.active.data.current);
        const { moveIndex, newCoords } = z.object({ moveIndex: z.number(), newCoords: z.string() }).parse(event.over.data.current);
        makeMove(moveIndex, oldCoords, newCoords, socket);
    }

    function onDragStart(event: DragStartEvent) {
        if (!canMove()) return;
        const { coords } = z.object({ coords: z.string() }).parse(event.active.data.current);
        setPieceLegalMoves(allLegalMoves.filter((move) => move[0]?.includes(coords)));
    }
    return (
        <div className="game-wrapper">
            {children}
            <DndContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
                <div className="chess-board chess-board--pieces">
                    {playerBoardRanks.map((rank) => {
                        const files = playerBoardFiles.map((file) => {
                            const tileId = `${file}${rank}`;
                            const curPiece = pieceMap?.get(tileId);
                            const isLastMove = tileId === lastMoveFrom || tileId === lastMoveTo;
                            let moveIndex = -1;
                            let capturingPieceCoords = "";
                            const isLegal = pieceLegalMoves.reduce((prevIsLegal, elem, index) => {
                                if (elem[0]?.slice(2).includes(`${file}${rank}`)) {
                                    moveIndex = index;
                                    capturingPieceCoords = elem[0].slice(0, 2);
                                    return true;
                                }
                                return prevIsLegal;
                            }, false);
                            if (curPiece) {
                                const disabled = !((whiteTurn && curPiece.toUpperCase() === curPiece) || (!whiteTurn && curPiece.toLowerCase() === curPiece));
                                const pieceId = `${curPiece}${file}${rank}`;
                                return (
                                    <EmptyTile isLastMove={isLastMove} key={tileId} size={size} isLegal={isLegal}>
                                        <ChessPiece gameId={gameId}
                                            capturingPieceCoords={capturingPieceCoords}
                                            moveIndex={moveIndex}
                                            isLegal={isLegal}
                                            coords={tileId}
                                            id={pieceId}
                                            size={size}
                                            piece={curPiece}
                                            disabled={disabled} />
                                    </EmptyTile>
                                );
                            }
                            return (
                                <EmptyTile isLastMove={isLastMove} key={tileId} size={size} >
                                    {isLegal && <Dot gameId={gameId} capturingPieceCoords={capturingPieceCoords} coords={tileId} moveIndex={moveIndex} id={tileId} size={size} />}
                                </EmptyTile>
                            );
                        });
                        return <div key={rank} className="chess-board__row">{files}</div>;
                    })}
                </div>
            </DndContext>
            {showPromotionMenu && <PromotionMenu promoteData={promoteData} isWhite={whiteTurn} size={size} gameId={gameId} />}
        </div>
    );
};

type TileColor = "white" | "black" | "selected";

type TileProps = {
    isLastMove?: boolean,
    color?: TileColor;
    size: string;
    isLegal?: boolean;
}

const Tile: React.FC<TileProps> = ({ color = "black", size }) => {
    return <div style={{ minWidth: size, height: size }} className={`chess-tile chess-tile--${color}`} />;
};

const EmptyTile: React.FC<TileProps & PropsWithChildren> = ({ size, isLegal = false, children, isLastMove }) => {
    return (
        <div style={{ minWidth: size, height: size }} className={`chess-tile${isLastMove ? " chess-tile--last-move" : ""}${(children && isLegal) ? " chess-tile--capture" : ""}`} >
            {children}
        </div>
    );
};

const TileBoard: React.FC<{ ranks: number[], files: string[], size: string }> = ({ ranks, files, size }) => {
    return (
        <div className="chess-board">
            {ranks.map(rank => {
                const entireRank = files.map(file => {
                    curColor = curColor === "white" ? "black" : "white";
                    const tileId = `${file}${rank}`;
                    return <Tile size={size} key={tileId} color={curColor} />;
                });
                curColor = curColor === "white" ? "black" : "white";
                return <div key={rank} className="chess-board__row">{entireRank}</div>;
            })}
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
    function selectPiece(index: string) {
        socket.emit("move", { gameId: gameId, move: index });
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

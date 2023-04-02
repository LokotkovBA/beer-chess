import { DndContext } from "@dnd-kit/core";
import { type DragStartEvent, type DragEndEvent } from "@dnd-kit/core/dist/types";
import React, { memo, type PropsWithChildren, useMemo, useEffect, useCallback } from "react";
import { z } from "zod";
import { socket } from "~/server/gameServer";
import ChessPiece, { GenericPiece } from "./ChessPiece";
import { Dot } from "~/assets/Dot";
import { isPieceNotation } from "~/utils/PieceNotation";
import { subscribeToGameStore } from "~/stores/gameStore";

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
        <>
            <InteractiveBoard gameId={gameId} size={size} playerBoardRanks={playerBoardRanks} playerBoardFiles={playerBoardFiles}>
                <TileBoard ranks={playerBoardRanks} files={playerBoardFiles} size={size} />
            </InteractiveBoard>
        </>
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
        makeMove,
        setPieceLegalMoves,
        subscribeToMoves,
        unsubscribeFromMoves
    } = useChessStore(useCallback(state => ({
        allLegalMoves: state.allLegalMoves,
        pieceMap: state.pieceMap,
        pieceLegalMoves: state.pieceLegalMoves,
        showPromotionMenu: state.showPromotionMenu,
        whiteTurn: state.whiteTurn,
        promoteData: state.promoteData,
        setPieceLegalMoves: state.setPieceLegalMoves,
        makeMove: state.makeMove,
        setShowPromotionMenu: state.setShowPromotionMenu,
        subscribeToMoves: state.subscribeToMoves,
        unsubscribeFromMoves: state.unsubscribeFromMoves,
    }), [])); //
    // const [playerIsWhite, setPlayerIsWhite] = useState(true);  // set when player joins
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
        try {
            const { coords: oldCoords, piece } = z.object({ coords: z.string(), piece: z.string() }).parse(event.active.data.current);
            const { moveIndex, newCoords } = z.object({ moveIndex: z.number(), newCoords: z.string() }).parse(event.over.data.current);
            if (!isPieceNotation(piece)) throw new z.ZodError([{ code: z.ZodIssueCode.invalid_string, message: "Invalid piece notation", path: ["piece"], validation: "cuid" }]);
            makeMove(moveIndex, oldCoords, newCoords, socket);
        } catch (error) {
            if (error instanceof z.ZodError) {
                socket.emit("error", { error: error.issues.map((issue) => ({ message: issue.message, path: issue.path })) });
                return;
            }
            socket.emit("error", { message: "unknown error", error: error });
        }
    }

    function onDragStart(event: DragStartEvent) {
        let { coords } = event.active.data.current as { coords: string };
        coords = coords.replace("/", "");
        setPieceLegalMoves(allLegalMoves.filter((move) => move[0]?.includes(coords)));
    }
    return (
        <div className="game-wrapper">
            {children}
            <DndContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
                <div className="chess-board chess-board--pieces">
                    {playerBoardRanks.map((rank) => {
                        const files = playerBoardFiles.map((file) => {
                            const curPiece = pieceMap.get(`${file}/${rank}`);
                            const tileId = `${file}/${rank}`;
                            let moveIndex = -1;
                            let capturingPieceCoords = "";
                            const isLegal = pieceLegalMoves.reduce((prevIsLegal, elem, index) => {
                                if (elem[0]?.slice(2).includes(`${file}${rank}`)) {
                                    moveIndex = index;
                                    capturingPieceCoords = elem[0].slice(0, -2);
                                    return true;
                                }
                                return prevIsLegal;
                            }, false);
                            if (curPiece) {
                                const disabled = !((whiteTurn && curPiece.toUpperCase() === curPiece) || (!whiteTurn && curPiece.toLowerCase() === curPiece));
                                const pieceId = `${curPiece}${file}${rank}`;
                                return (
                                    <EmptyTile key={tileId} size={size} isLegal={isLegal}>
                                        <ChessPiece gameId={gameId}
                                            capturingPieceCoords={capturingPieceCoords}
                                            moveIndex={moveIndex}
                                            isLegal={isLegal}
                                            coords={`${file}/${rank}`}
                                            id={pieceId}
                                            size={size}
                                            piece={curPiece}
                                            disabled={disabled} />
                                    </EmptyTile>
                                );
                            }
                            return (
                                <EmptyTile key={tileId} size={size} >
                                    {isLegal && <Dot gameId={gameId} capturingPiece={capturingPieceCoords} coords={`${file}/${rank}`} moveIndex={moveIndex} id={tileId} size={size} />}
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
    color?: TileColor;
    size: string;
    isLegal?: boolean;
}

const Tile: React.FC<TileProps> = ({ color = "black", size }) => {
    return <div style={{ minWidth: size, height: size }} className={`chess-tile chess-tile--${color}`} />;
};

const EmptyTile: React.FC<TileProps & PropsWithChildren> = ({ size, isLegal = false, children }) => {
    return (
        <div style={{ minWidth: size, height: size }} className={`chess-tile ${(children && isLegal) ? " chess-tile--capture" : ""}`} >
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

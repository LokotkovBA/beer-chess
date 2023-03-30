
import { DndContext } from "@dnd-kit/core";
import { type DragStartEvent, type DragEndEvent } from "@dnd-kit/core/dist/types";
import React, { memo, type PropsWithChildren, useMemo, useState, useEffect, useRef } from "react";
import { z } from "zod";
import { socket } from "~/server/gameServer";
import ChessPiece, { GenericPiece, getCoordsFromPosition, type PieceCoordinates, type PieceNotation } from "./ChessPiece";
import { Dot } from "~/assets/Dot";

type ChessBoardProps = {
    size: string;
    gameId: string;
    boardDefault: boolean;
    boardFiles?: string[];
    boardRanks?: number[];
}

let curColor: TileColor = "black";

const successSocketMessageSchema = z.object({
    legalMoves: z.array(z.string()),
    turn: z.union([z.literal("w"), z.literal("b")]),
    position: z.string()
});

export const ChessBoard: React.FC<ChessBoardProps> = memo(function ChessBoard({ boardRanks = [1, 2, 3, 4, 5, 6, 7, 8], boardFiles = ["a", "b", "c", "d", "e", "f", "g", "h"], size, boardDefault, gameId }) {
    const [availableLegalMoves, setAvailableLegalMoves] = useState<string[][]>([]);
    const [showPromotionMenu, setShowPromotionMenu] = useState(false);
    const promoteData = useRef<PromoteData[]>([]);
    const legalMoves = useRef<string[][]>([]);
    // const [playerIsWhite, setPlayerIsWhite] = useState(true);  // set when player joins
    const [whiteTurn, setWhiteTurn] = useState(true);
    useEffect(() => {
        socket.emit("join game", ({ gameId }));
        return () => {
            socket.emit("leave game", ({ gameId }));
        };
    }, [gameId]);
    useEffect(() => {
        socket.on("success", (message) => {
            console.log(message);
            const { legalMoves: newLegalMoves, turn, position: newPosition } = successSocketMessageSchema.parse(message);
            legalMoves.current = newLegalMoves.map((move) => move.split("/"));
            setWhiteTurn(turn === "w");
            setPieceCoords(getCoordsFromPosition(boardRanks, boardFiles, newPosition));
            setShowPromotionMenu(false);
        });

        return () => {
            socket.off("success");
        };
    }, [gameId, boardRanks, boardFiles]);
    const playerBoardRanks = useMemo(() => {
        if (!boardDefault) {
            return boardRanks;
        }
        const buf = [...boardRanks];
        return buf.reverse();
    }, [boardDefault, boardRanks]);
    const playerBoardFiles = useMemo(() => {
        if (boardDefault) {
            return boardFiles;
        }
        const buf = [...boardFiles];
        return buf.reverse();
    }, [boardDefault, boardFiles]);
    const [pieceCoords, setPieceCoords] = useState<PieceCoordinates>();

    function onDragEnd(event: DragEndEvent) {
        if (!event.over) return;
        const { coords: oldCoords, piece } = z.object({ coords: z.string(), piece: z.string() }).parse(event.active.data.current);
        const { moveIndex, newCoords } = z.object({ moveIndex: z.number(), newCoords: z.string() }).parse(event.over.data.current);
        if (event.over) {
            setAvailableLegalMoves([]);
            const currentMove = availableLegalMoves[moveIndex];
            if (currentMove) {
                const moveData = currentMove[currentMove.length - 1];
                if (!currentMove.includes("Promotion")) {
                    socket.emit("move", { gameId: gameId, move: moveData });
                } else {
                    const currentMoveNotaion = currentMove[0]?.slice(0, -1);
                    if (!currentMoveNotaion) return;
                    promoteData.current = legalMoves.current.filter((move) => move[0]?.includes(currentMoveNotaion)).map(move => {
                        const currentPiece = move[0]?.slice(-1);
                        if (!currentPiece) return { piece: "", index: "" };
                        const currrentIndex = move[move.length - 1];
                        if (!currrentIndex) return { piece: "", index: "" };

                        return { piece: currentPiece, index: currrentIndex };
                    });

                    setShowPromotionMenu(true);
                }
                setPieceCoords((prevPieceCoords) => {
                    if (!event.over) return prevPieceCoords;
                    const buf = structuredClone(prevPieceCoords);
                    buf?.delete(oldCoords);
                    buf?.set(newCoords, piece as PieceNotation);
                    return buf;
                });
            }

        }
    }

    function onDragStart(event: DragStartEvent) {
        let { coords } = event.active.data.current as { coords: string };
        coords = coords.replace("/", "");
        setAvailableLegalMoves(legalMoves.current.filter((move) => move[0]?.includes(coords)));
    }
    return (
        <>
            <DndContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
                <div className="chess-board">
                    {playerBoardRanks.map((rank) => {
                        const files = playerBoardFiles.map((file) => {
                            curColor = curColor === "white" ? "black" : "white";
                            const curPiece = pieceCoords?.get(`${file}/${rank}`);
                            const tileId = `${file}/${rank}`;
                            let moveIndex = -1;
                            const isLegal = availableLegalMoves.reduce((prevIsLegal, elem, index) => {
                                if (elem[0]?.slice(2).includes(`${file}${rank}`)) {
                                    moveIndex = index;
                                    return true;
                                }
                                return prevIsLegal;
                            }, false);
                            if (curPiece) {
                                const disabled = !((whiteTurn && curPiece.toUpperCase() === curPiece) || (!whiteTurn && curPiece.toLowerCase() === curPiece));
                                const pieceId = `${curPiece}${file}${rank}`;
                                return (
                                    <Tile hasPiece={true} isLegal={isLegal} size={size} key={tileId} color={curColor}>
                                        <ChessPiece moveIndex={moveIndex} isLegal={isLegal} coords={`${file}/${rank}`} key={pieceId} id={pieceId} size={size} piece={curPiece} disabled={disabled} />
                                    </Tile>
                                );
                            }
                            return (
                                <Tile isLegal={isLegal} size="5rem" key={tileId} color={curColor}>
                                    {isLegal && <Dot coords={`${file}/${rank}`} moveIndex={moveIndex} key={`dot${tileId}`} id={tileId} size={size} />}
                                </Tile>
                            );
                        });
                        curColor = curColor === "white" ? "black" : "white";
                        return <div key={rank} id={`${rank}`} className='chess-board__row'>{files}</div>;
                    })}
                </div>
            </DndContext>
            {showPromotionMenu && <PromotionMenu promoteData={promoteData.current} isWhite={boardDefault} size={size} gameId={gameId} />}
        </>
    );
});

type TileColor = "white" | "black" | "selected";

type TileProps = {
    color: TileColor;
    size: string;
    hasPiece?: boolean;
    isLegal?: boolean;
}

const Tile: React.FC<TileProps & PropsWithChildren> = ({ color, size, children, isLegal = false, hasPiece = false }) => {
    const [hovering, setHovering] = useState(false);
    const style = useMemo(() => ({ width: size, height: size }), [size]);
    function onMouseEnter() {
        if (isLegal) {
            setHovering(true);
        }
    }

    function onMouseLeave() {
        if (isLegal) {
            setHovering(false);
        }
    }
    return (
        <div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={style}
            className={`chess-tile chess-tile--${color}${hovering ? " chess-tile--selected" : ""}${(hasPiece && isLegal) ? " chess-tile--capture" : ""}`}
        >
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
type PromoteData = { piece: string, index: string };
const PromotionMenu: React.FC<PromotionMenuProps> = ({ size, isWhite, promoteData, gameId }) => {
    function selectPiece(index: string) {
        socket.emit("move", { gameId: gameId, move: index });
    }
    return (
        <menu>
            {promoteData.map(({ piece, index }) => {
                return (
                    <li key={index} onClick={() => selectPiece(index)}>
                        <GenericPiece size={size} piece={isWhite ? piece.toUpperCase() : piece} />
                    </li>
                );
            })}
        </menu>
    );
};

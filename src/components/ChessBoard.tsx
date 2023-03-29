
import { DndContext } from "@dnd-kit/core";
import { type DragStartEvent, type DragEndEvent } from "@dnd-kit/core/dist/types";
import React, { memo, type PropsWithChildren, useMemo, useState, useLayoutEffect, useEffect } from "react";
import { z } from "zod";
import { socket } from "~/server/gameServer";
import ChessPiece, { getCoordsFromPosition, type PieceCoordinates, type PieceNotation } from "./ChessPiece";
import { Dot } from "~/assets/Dot";

type ChessBoardProps = {
    size: string;
    gameId: string;
    isWhite: boolean;
    boardFiles?: string[];
    boardRanks?: number[];
}

let curColor: TileColor = "black";

const successSocketMessageSchema = z.object({
    legalMoves: z.array(z.string()),
    turn: z.union([z.literal("w"), z.literal("b")]),
    position: z.string()
});

let legalMoves: string[] = [];
export const ChessBoard: React.FC<ChessBoardProps> = memo(function ChessBoard({ boardRanks = [1, 2, 3, 4, 5, 6, 7, 8], boardFiles = ["a", "b", "c", "d", "e", "f", "g", "h"], size, isWhite, gameId }) {
    const [availableLegalMoves, setAvailableLegalMoves] = useState<string[]>([]);
    const [whiteTurn, setWhiteTurn] = useState(true);
    useEffect(() => {
        socket.emit("join game", ({ gameId }));
        return () => {
            socket.emit("leave game", ({ gameId }));
        };
    }, [gameId]);
    useLayoutEffect(() => { //todo: pawn promotion
        socket.on("success", (message) => {
            console.log(message);
            const { legalMoves: newLegalMoves, turn, position: newPosition } = successSocketMessageSchema.parse(message);
            legalMoves = newLegalMoves;
            console.log(newLegalMoves);
            setWhiteTurn(turn === "w");
            setPieceCoords(getCoordsFromPosition(boardRanks, boardFiles, newPosition));
        });

        return () => {
            socket.off("success");
        };
    }, [gameId, boardRanks, boardFiles]);
    const playerBoardRanks = useMemo(() => {
        if (!isWhite) {
            return boardRanks;
        }
        const buf = [...boardRanks];
        return buf.reverse();
    }, [isWhite, boardRanks]);
    const playerBoardFiles = useMemo(() => {
        if (isWhite) {
            return boardFiles;
        }
        const buf = [...boardFiles];
        return buf.reverse();
    }, [isWhite, boardFiles]);
    const [pieceCoords, setPieceCoords] = useState<PieceCoordinates>();

    function onDragEnd(event: DragEndEvent) {
        if (!event.over) return;
        console.log(event);
        const { coords: oldCoords, piece } = z.object({ coords: z.string(), piece: z.string() }).parse(event.active.data.current);
        const { moveIndex } = z.object({ moveIndex: z.number() }).parse(event.over.data.current);
        if (event.over) {
            setAvailableLegalMoves([]);
            const move = availableLegalMoves[moveIndex]?.slice(2);
            socket.emit("move", { gameId: gameId, move: move });
            setPieceCoords((prevPieceCoords) => {
                if (!event.over) return prevPieceCoords;
                const buf = structuredClone(prevPieceCoords);
                buf?.delete(oldCoords);
                buf?.set(event.over.id as string, piece as PieceNotation);
                return buf;
            });
        }
    }

    function onDragStart(event: DragStartEvent) {
        let { coords } = event.active.data.current as { coords: string };
        coords = coords.split("/").join("");
        console.log(coords);
        setAvailableLegalMoves(legalMoves.filter((move) => move.includes(coords)).map((move) => move.slice(2)));
    }
    return (
        <DndContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
            <div className="chess-board">
                {playerBoardRanks.map((rank) => {
                    const files = playerBoardFiles.map((file) => {
                        curColor = curColor === "white" ? "black" : "white";
                        const curPiece = pieceCoords?.get(`${file}/${rank}`);
                        const tileId = `${file}/${rank}`;
                        let moveIndex = -1;
                        const isLegal = availableLegalMoves.reduce((prevIsLegal, elem, index) => {
                            if (elem.includes(`${file}${rank}`)) {
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
                                {isLegal && <Dot moveIndex={moveIndex} key={`dot${tileId}`} id={tileId} size={size} />}
                            </Tile>
                        );
                    });
                    curColor = curColor === "white" ? "black" : "white";
                    return <div key={rank} id={`${rank}`} className='chess-board__row'>{files}</div>;
                })}
            </div>
        </DndContext>
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


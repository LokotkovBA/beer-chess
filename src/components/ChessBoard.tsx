
import { DndContext } from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { type DragStartEvent, type DragEndEvent } from "@dnd-kit/core/dist/types";
import React, { memo, type PropsWithChildren, useMemo, useState, useEffect } from "react";
import { z } from "zod";
import { socket } from "~/server/gameServer";
import ChessPiece, { getCoordsFromPosition, type PieceNotation } from "./ChessPiece";

type ChessBoardProps = {
    position?: string;
    size: string;
    gameId: string;
    isWhite: boolean;
    whiteTurn: boolean;
    boardFiles?: string[];
    boardRanks?: number[];
}

let curColor: TileColor = "black";

export const ChessBoard = memo(function ChessBoard({ boardRanks = [1, 2, 3, 4, 5, 6, 7, 8], boardFiles = ["a", "b", "c", "d", "e", "f", "g", "h"], size, position, isWhite, whiteTurn, gameId }: ChessBoardProps) {
    const [legalMoves, setLegalMoves] = useState<string[]>([]);
    useEffect(() => {
        socket.emit("join game", ({ gameId }));
        socket.on("success", (message) => {
            const { legalMoves } = z.object({ legalMoves: z.array(z.string()) }).parse(message);
            setLegalMoves(legalMoves);
        });

        return () => {
            socket.emit("leave game", ({ gameId }));
        };
    }, [gameId]);
    const [pieceCoords, setPieceCoords] = useState(getCoordsFromPosition(boardRanks, boardFiles, position));
    const playerBoardRank = useMemo(() => {
        if (!isWhite) {
            return boardRanks;
        }
        const buf = [...boardRanks];
        return buf.reverse();
    }, [isWhite, boardRanks]);
    const playerBoardFile = useMemo(() => {
        if (isWhite) {
            return boardFiles;
        }
        const buf = [...boardFiles];
        return buf.reverse();
    }, [isWhite, boardFiles]);

    function onDragEnd(event: DragEndEvent) {
        if (!event.over) return;
        const { coords: oldCoords, piece } = event.active.data.current as { coords: string, piece: PieceNotation };
        setPieceCoords((prevPieceCoords) => {
            if (!event.over || oldCoords === event.over.id) return prevPieceCoords;
            const buf = structuredClone(prevPieceCoords);
            buf.delete(oldCoords);
            buf.set(event.over.id as string, piece);
            return buf;
        });
    }

    function onDragStart(event: DragStartEvent) {
        let { coords } = event.active.data.current as { coords: string };
        coords = coords.split("/").join("");
        console.log(coords);
        const avialableLegalMoves = legalMoves.filter((move) => move.includes(coords)).map((move) => move.slice(2));
        console.log(avialableLegalMoves);
    }
    return (
        <DndContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
            <div className="chess-board">
                {playerBoardRank.map((rank) => {
                    const files = playerBoardFile.map((file) => {
                        curColor = curColor === "white" ? "black" : "white";
                        const curPiece = pieceCoords.get(`${file}/${rank}`);
                        const tileId = `${file}/${rank}`;
                        if (curPiece) {
                            const disabled = !((whiteTurn && curPiece.toUpperCase() === curPiece) || (!whiteTurn && curPiece.toLowerCase() === curPiece));
                            const pieceId = `${curPiece}${file}${rank}`;
                            return (
                                <Tile size={size} key={tileId} color={curColor} id={tileId}>
                                    <ChessPiece coords={`${file}/${rank}`} key={pieceId} id={pieceId} size={size} piece={curPiece} disabled={disabled} />
                                </Tile>);
                        }
                        return <Tile size="5rem" key={tileId} color={curColor} id={tileId} />;
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
    id: string;
    size: string;
}
const Tile: React.FC<TileProps & PropsWithChildren> = ({ color, id, size, children }) => {
    const { setNodeRef } = useDroppable({ id: id });
    const style = useMemo(() => ({ width: size, height: size }), [size]);
    return <div ref={setNodeRef} style={style} className={`chess-tile chess-tile--${color}`}>{children}</div>;
};








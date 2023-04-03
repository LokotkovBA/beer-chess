import { type Socket } from "socket.io-client";
import { z } from "zod";
import { create, type UseBoundStore, type StateCreator, type StoreApi } from "zustand";
import { type PromoteData } from "~/components/ChessBoard";
import { isPieceNotation, PieceCoordinates } from "~/utils/PieceNotation";

type ChessState = {
    pieceMap: PieceCoordinates | null,
    pieceLegalMoves: string[][], //legal moves of current piece
    allLegalMoves: string[][],
    promoteData: PromoteData[],
    showPromotionMenu: boolean,
    whiteTurn: boolean,
    setGameId: (gameId: string) => void,
    setShowPromotionMenu: (show: boolean) => void,
    setPromoteData: (promoteData: PromoteData[]) => void,
    setPieceLegalMoves: (legalMoves: string[][]) => void,
    movePiece: (oldCoords: string, newCoords: string) => void,
    makeMove: (moveIndex: number, oldCoords: string, newCoords: string, socket: Socket) => void,
    subscribeToMoves: (socket: Socket, gameId: string) => void
    unsubscribeFromMoves: (socket: Socket, gameId: string) => void
}

const gamesStoreMap = new Map<string, UseBoundStore<StoreApi<ChessState>>>();

export function subscribeToGameStore(gameId: string) {
    const gameStore = gamesStoreMap.get(gameId);
    if (gameStore) return gameStore;
    const newGameStore = create(setupChessStore(gameId));
    gamesStoreMap.set(gameId, newGameStore);
    return newGameStore;
}

export function boardSelector(state: ChessState) { //selector for the entire board
    return {
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
    };
}

export function pieceSelector(state: ChessState) { //selector for a piece
    return state.makeMove;
}

function setupChessStore(gameId: string): StateCreator<ChessState, [], []> {
    return (set, get) => ({
        pieceMap: null,
        pieceLegalMoves: [],
        allLegalMoves: [],
        promoteData: [],
        showPromotionMenu: false,
        whiteTurn: false,
        setGameId: (gameId) => set(state => ({ ...state, gameId: gameId })),
        setShowPromotionMenu: (show) => set(state => ({ ...state, showPromotionMenu: show })),
        setPromoteData: (promoteData) => set(state => ({ ...state, promoteData })),
        setPieceLegalMoves: (legalMoves) => set(state => ({ ...state, pieceLegalMoves: legalMoves })),
        movePiece: (oldCoords, newCoords) => {
            const pieceMap = structuredClone(get().pieceMap);
            const piece = pieceMap?.get(oldCoords);
            if (piece) {
                pieceMap?.delete(oldCoords);
                pieceMap?.set(newCoords, piece);
            }
            set(state => ({ ...state, pieceMap }));
        },
        makeMove: (moveIndex, oldCoords, newCoords, socket) => {
            const { pieceLegalMoves, allLegalMoves, setPieceLegalMoves, setShowPromotionMenu, setPromoteData, movePiece } = get();
            let promoteData: PromoteData[];
            const currentMove = pieceLegalMoves[moveIndex];
            if (currentMove) {
                const moveData = currentMove[currentMove.length - 1];
                if (!currentMove.includes("Promotion")) {
                    socket.emit("move", { gameId, move: moveData });
                } else {
                    const currentMoveNotaion = currentMove[0]?.slice(0, -1);
                    if (!currentMoveNotaion) return;
                    promoteData = allLegalMoves
                        .filter((move) => move[0]?.includes(currentMoveNotaion))
                        .map(move => {
                            const currentPiece = move[0]?.slice(-1);
                            if (!currentPiece) return { piece: "", index: "" };
                            const currrentIndex = move[move.length - 1];
                            if (!currrentIndex) return { piece: "", index: "" };

                            return { piece: currentPiece, index: currrentIndex };
                        });
                    setShowPromotionMenu(true);
                    setPromoteData(promoteData);
                }
                movePiece(oldCoords, newCoords);
            }
            setPieceLegalMoves([]);
        },
        subscribeToMoves: (socket) => {
            socket.on(`${gameId} success`, (message) => {
                console.log(message);
                const { legalMoves: newLegalMoves, turn, position: newPosition } = successSocketMessageSchema.parse(message);
                set(state => ({
                    ...state,
                    allLegalMoves: newLegalMoves.map((move) => move.split("/")),
                    whiteTurn: turn === "w",
                    pieceMap: getCoordsFromPosition(newPosition),
                    showPromotionMenu: false
                }));
            });
        },
        unsubscribeFromMoves: (socket, gameId) => {
            socket.off(`${gameId} success`);
        }
    });
}

const successSocketMessageSchema = z.object({
    legalMoves: z.array(z.string()),
    turn: z.union([z.literal("w"), z.literal("b")]),
    position: z.string()
});

function getCoordsFromPosition(position = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", boardRanks = [1, 2, 3, 4, 5, 6, 7, 8], boardFiles = ["a", "b", "c", "d", "e", "f", "g", "h"]) {
    const pieceMap = new PieceCoordinates();
    let rank = 7;
    let file = 0;
    let positionDone = false;
    let index = 0;
    while (!positionDone && index < position.length) {
        const char = position[index];
        index++;
        switch (char) {
            case " ":
                positionDone = true;
                break;
            case "/":
                rank--;
                file = 0;
                break;
            default:
                const curFile = boardFiles[file];
                const curRank = boardRanks[rank];
                if (isPieceNotation(char) && curRank && curFile) {
                    pieceMap.set(`${curFile}/${curRank}`, char);
                    file++;
                } else if (char) {
                    let numOfEmpty = parseInt(char);
                    while (numOfEmpty > 0) {
                        file++;
                        numOfEmpty--;
                    }
                }
                break;
        }
    }
    return pieceMap;
}

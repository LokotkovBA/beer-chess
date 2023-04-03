export type PieceNotation = "p" | "b" | "n" | "r" | "q" | "k" | "P" | "B" | "N" | "R" | "Q" | "K";
const Pieces = ["p", "b", "n", "r", "q", "k", "P", "B", "N", "R", "Q", "K"];
export function isPieceNotation(value?: string): value is PieceNotation {
    return value ? Pieces.includes(value) : !!value;
}

/**
* Map<key, value>
*
* key - string formated as file/rank
*
* value - PieceNotation in FEN
*/
export class PieceCoordinates extends Map<string, PieceNotation>{
    constructor() {
        super();
    }
}
export type PieceNotation = "p" | "b" | "n" | "r" | "q" | "k" | "P" | "B" | "N" | "R" | "Q" | "K";
const Pieces = ["p", "b", "n", "r", "q", "k", "P", "B", "N", "R", "Q", "K"];
export function isPieceNotation(value: string): value is PieceNotation {
    return Pieces.includes(value);
}

/**
 * key - string formated as file/rank
 * 
 * value - piece in FEN
 */
export type PieceCoordinates = Map<string, PieceNotation>

/**
 * Returns the map of piece coordinates
 * 
 * @param {string} position Position in FEN
 * @returns {Map<string, PieceNotation>} Map of `file/rank`, `piece`
 */

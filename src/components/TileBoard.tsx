import { useRef } from "react";

type TileBoardProps = {
    size?: string,
    ranks?: number[],
    files?: string[]
}

const TileBoard: React.FC<TileBoardProps> = ({ ranks = [8, 7, 6, 5, 4, 3, 2, 1], files = ["a", "b", "c", "d", "e", "f", "g", "h"], size = "5rem" }) => {
    const curColor = useRef<TileColor>("black");
    return (
        <div style={{ fontSize: size }} className="chess-board">
            {ranks.map((rank) => {
                const completeRank = files.map((file) => {
                    curColor.current = reverseTileColor(curColor.current);
                    const tileId = `${file}${rank}`;

                    return <Tile key={tileId} color={curColor.current} />;
                });
                curColor.current = reverseTileColor(curColor.current);
                return <div key={rank} className="chess-board__row">{completeRank}</div>;
            })}
            <div className="ranks">
                {ranks.map((rank) => {
                    curColor.current = reverseTileColor(curColor.current);
                    return <div key={rank} className="chess-tile ranks__chess-tile">
                        <p className={`chess-tile__coord chess-tile__coord--${reverseTileColor(curColor.current)}`}>{rank}</p>
                    </div>;
                })}
            </div>
            <div className="files">
                {files.map((file) => {
                    curColor.current = reverseTileColor(curColor.current);
                    return <div key={file} className="chess-tile files__chess-tile">
                        <p className={`chess-tile__coord chess-tile__coord--${curColor.current}`}>{file}</p>
                    </div>;
                })}
            </div>
        </div>
    );
};

type TileColor = "white" | "black"

function reverseTileColor(color: TileColor) {
    return color === "white" ? "black" : "white";
}

const Tile: React.FC<{ color: string }> = ({ color = "black" }) => {
    return <div className={`chess-tile chess-tile--${color}`} />;
};

export default TileBoard;
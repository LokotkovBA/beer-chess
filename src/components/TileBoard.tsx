import { useRef } from "react";

type TileBoardProps = {
    size?: string,
    ranks?: number[],
    files?: string[],
    addClass?: string
}

const TileBoard: React.FC<TileBoardProps> = ({ ranks = [1, 2, 3, 4, 5, 6, 7, 8], files = ["a", "b", "c", "d", "e", "f", "g", "h"], addClass, size }) => {
    const curColor = useRef("black");
    return (
        <div className={`chess-board${addClass ? " " + addClass : ""}`}>
            {ranks.map(rank => {
                const entireRank = files.map(file => {
                    curColor.current = curColor.current === "white" ? "black" : "white";
                    const tileId = `${file}${rank}`;
                    return <Tile size={size} key={tileId} color={curColor.current} />;
                });
                curColor.current = curColor.current === "white" ? "black" : "white";
                return <div key={rank} className="chess-board__row">{entireRank}</div>;
            })}
        </div>
    );
};

const Tile: React.FC<{ color: string, size?: string }> = ({ color = "black", size }) => {
    return <div style={{ width: size, height: size }} className={`chess-tile chess-tile--${color}`} />;
};

export default TileBoard;
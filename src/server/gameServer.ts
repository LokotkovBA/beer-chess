import { io } from "socket.io-client";
import { env } from "~/env.mjs";

export const socket = io(env.NEXT_PUBLIC_SOCKET_SERVER_URL);

export function sendStartGame(gameId: string, gameTitle: string, playerWhite: string, playerBlack: string, timeRule: string, secretName: string) {
    socket.emit("start game", {
        gameId,
        gameTitle,
        playerWhite,
        playerBlack,
        timeRule,
        secretName
    });
}
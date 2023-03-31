import { type FormEvent, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { socket } from "~/server/gameServer";
import { api } from "~/utils/api";
import { GenericPiece } from "./ChessPiece";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";

export const CreationForm: React.FC<{ roomId: string }> = ({ roomId }) => {
    useEffect(() => {
        socket.on("room ready status", (message) => {
            const { name, roomId: receievedRoomId } = z.object({ name: z.string(), roomId: z.string() }).parse(message);
            if (roomId !== receievedRoomId) return;
            if (name === "") {
                setIsReady(false);
                return toast("not ready");
            }
            toast(`${name} is ready`, { icon: "🍺" });
            if (inviteeUsername.current) {
                inviteeUsername.current.value = name;
            }
            setIsReady(true);
        });
        return () => {
            socket.off("room ready status");
        };
    }, [roomId]);

    const isWhite = useRef<HTMLInputElement>(null);
    const inviteeUsername = useRef<HTMLInputElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [timeControl, setTimeControl] = useState(true);
    const { data: sessionData } = useSession();

    const { mutate: createGame } = api.games.create.useMutation();

    function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (isReady && isWhite.current && inviteeUsername.current?.value) {
            createGame({ roomId: roomId, timeRule: "-1", isWhite: isWhite.current.checked, inviteeUsername: inviteeUsername.current.value });
        }
    }

    return (
        <form method="submit" onSubmit={onSubmit}>
            <input ref={inviteeUsername} placeholder="Имя оппонента" type="text" />
            <button type="button" onClick={() => socket.emit("send invite", { roomId, uniqueName: inviteeUsername.current?.value, name: sessionData?.user.name })}>Отправить приглашение</button>
            <fieldset>
                <legend>Выберите цвет</legend>
                <label htmlFor="white"><GenericPiece size="5rem" piece="K" /></label>
                <input name="color" value="isWhite" id="white" type="radio" ref={isWhite} />
                <label htmlFor="black"><GenericPiece size="5rem" piece="k" /></label>
                <input name="color" value="isBlack" id="black" type="radio" />
            </fieldset>
            <label htmlFor="timeMode">Лимит по времени</label>
            <select onChange={(event) => setTimeControl(event.target.value === "realTime")} defaultValue="realTime" id="timeMode">
                <option value="realTime">Реальное время</option>
                <option value="noLimit">Без лимта</option>
            </select>
            {timeControl &&
                <>
                    <label htmlFor="sideTime">Минут на сторону</label>
                    <input id="sideTime" type="range" min="1" max="20" />
                    <label htmlFor="sideTime">Инкремент за ход</label>
                    <input id="incrementTime" type="range" min="0" max="20" />
                </>}
            <button disabled={!isReady} type="submit">Запуск</button>
        </form>
    );
};
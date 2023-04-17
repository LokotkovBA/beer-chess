import { type FormEvent, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { sendStartGame, socket } from "~/server/gameServer";
import { api } from "~/utils/api";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";
import GenericPiece from "~/assets/GenericPiece";
import { useTimeModeStore } from "~/stores/timeMode/store";
import { timeModeChangeSelector, timeModeValueSelector } from "~/stores/timeMode/selectors";
import { useRouter } from "next/router";
import Link from "next/link";

export const CreationForm: React.FC<{ roomId: string }> = ({ roomId }) => {
    const { data: secretName } = api.games.getSecretName.useQuery();
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
    const titleRef = useRef<HTMLInputElement>(null);
    const isWhite = useRef<HTMLInputElement>(null);
    const inviteeUsername = useRef<HTMLInputElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [timeControl, setTimeControl] = useState(true);
    const { data: sessionData } = useSession();
    const [sideTimeValue, incrementTimeValue] = useTimeModeStore(timeModeValueSelector);

    const { mutate: createGame } = api.games.create.useMutation({
        onSuccess: ({ id, timeRule, blackUsername, whiteUsername, title }) => {
            socket.emit("game ready", { roomId });
            secretName && sendStartGame(id, title, whiteUsername, blackUsername, timeRule, secretName);
            if (pathname === "/rooms") {
                void redirectTo(`/room/${roomId}`);
            }
        }
    });
    function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (isReady && titleRef.current && sessionData && isWhite.current && inviteeUsername.current?.value) {
            let whiteUsername = "";
            let blackUsername = "";
            if (isWhite.current.value) {
                whiteUsername = sessionData.user.uniqueName;
                blackUsername = inviteeUsername.current.value;
            } else {
                whiteUsername = inviteeUsername.current.value;
                blackUsername = sessionData.user.uniqueName;
            }
            let timeRule = "-1/-1";
            if (timeControl) {
                timeRule = `${sideTimeValue}/${incrementTimeValue}`;
            }
            createGame({ title: titleRef.current.value, maxTime: sideTimeValue * 60 * 1000, roomId, timeRule, whiteUsername, blackUsername });
        }
    }
    const { pathname, push: redirectTo } = useRouter();
    return (
        <>
            <form className="creation-form" method="submit" onSubmit={onSubmit}>
                <input className="input" ref={titleRef} placeholder="Название игры" type="text" />
                <input className="input" ref={inviteeUsername} placeholder="Имя оппонента" type="text" />
                <button className="button" type="button" onClick={() => socket.emit("send invite", { roomId, uniqueName: inviteeUsername.current?.value, name: sessionData?.user.name })}>Отправить приглашение</button>
                <fieldset className="fieldset creation-form__fieldset--sidePicker">
                    <legend className="fieldset__legend">Выберите сторону</legend>
                    <input className="radio" name="color" value="isWhite" id="white" type="radio" defaultChecked={true} ref={isWhite} />
                    <label className="radio--styled" htmlFor="white"><GenericPiece size="5rem" piece="K" /></label>
                    <input className="radio" name="color" value="isBlack" id="black" type="radio" />
                    <label className="radio--styled" htmlFor="black"><GenericPiece size="5rem" piece="k" /></label>
                </fieldset>
                <button className="button" disabled={!isReady} type="submit">Запуск</button>
                <fieldset className="fieldset creation-form__fieldset--time-control">
                    <input className="radio" onClick={() => setTimeControl(true)} name="timeControl" value="timeOn" id="timeOn" type="radio" defaultChecked={true} />
                    <label className="radio--styled" htmlFor="timeOn">На время</label>
                    <input className="radio" onClick={() => setTimeControl(false)} name="timeControl" value="timeOff" id="timeOff" type="radio" />
                    <label className="radio--styled" htmlFor="timeOff">Без времени</label>
                </fieldset>
                {timeControl && <TimeSelector />}
            </form>
            {pathname === "/rooms" && <Link className="button" href={`room/${roomId}`}>Перейти в комнату</Link>}
        </>
    );
};


const TimeSelector: React.FC = () => {
    const [sideTimeValue, incrementTimeValue] = useTimeModeStore(timeModeValueSelector);
    const [changeSideTime, changeIncrementTime] = useTimeModeStore(timeModeChangeSelector);
    return (
        <>
            <label htmlFor="sideTime">Минут на сторону</label>
            <input defaultValue={sideTimeValue} onChange={(event) => changeSideTime(event.target.value)} id="sideTime" type="range" min="1" max="36" />
            {sideTimeValue}
            <label htmlFor="incrementTime">Добавление секунд на ход</label>
            <input defaultValue={incrementTimeValue} onChange={(event) => changeIncrementTime(event.target.value)} id="incrementTime" type="range" min="0" max="30" />
            {incrementTimeValue}
        </>
    );
};

import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import { type FormEvent, useRef } from "react";
import { ChessBoard } from "~/components/ChessBoard";




const RoomPage: NextPage<{ id: string }> = ({ id }) => {
    const { data: roomData } = api.rooms.get.useQuery({ roomId: id });

    if (!roomData) {
        return <div>404</div>;
    }



    return (
        <>
            <Head>
                <title>Game Room</title>
                <meta name="description" content={`Game field for room ${id}`} />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <ChessBoard size={"5rem"} isWhite={true} whiteTurn={true} gameId={id} />

        </>
    );
};

export default RoomPage;



const CreationForm: React.FC<{ roomId: string }> = ({ roomId }) => {
    const isWhite = useRef<HTMLInputElement>(null);
    const inviteeUsername = useRef<HTMLInputElement>(null);
    const ready = useRef(false);

    const { mutate: startGame } = api.rooms.start.useMutation();

    function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (isWhite.current && inviteeUsername.current && inviteeUsername.current.value !== "" && ready.current) {
            startGame({ roomId: roomId, isWhite: isWhite.current.checked, inviteeUsername: inviteeUsername.current.value });
        }
    }

    return (
        <form onSubmit={onSubmit}>
            <input ref={inviteeUsername} style={{ backgroundColor: "inherit" }} placeholder="Имя оппонента" type="text" />
            <button type="button">Отправить приглашение</button>
            <fieldset>
                <legend>Выберите цвет</legend>
                <label htmlFor="white">Белый</label>
                <input name="color" value="isWhite" id="white" type="radio" ref={isWhite} />
                <label htmlFor="black">Чёрный</label>
                <input name="color" value="isBlack" id="black" type="radio" />
            </fieldset>
            <button style={{ backgroundColor: "inherit" }} type="submit">Запуск</button>
        </form>
    );
};


export const getStaticProps: GetStaticProps = async (context) => {
    const ssg = generateSSGHelper();

    const id = context.params?.id;

    if (typeof id !== "string") throw new Error("no room id");


    await ssg.rooms.get.prefetch({ roomId: id });

    return {
        props: {
            trpcState: ssg.dehydrate(),
            id
        }
    };
};

export const getStaticPaths: GetStaticPaths = () => {
    return { paths: [], fallback: "blocking" };
};

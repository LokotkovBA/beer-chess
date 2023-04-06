import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import React, { useEffect, useState } from "react";
import { ChessBoard } from "~/components/ChessBoard";
import { socket } from "~/server/gameServer";
import { useSession } from "next-auth/react";
import { CreationForm } from "~/components/CreationForm";
import { type Session } from "next-auth";
import styles from "./[id].module.scss";
import { GameTimer } from "~/components/GameTimer";

const RoomPage: NextPage<{ roomId: string, session: Session | null }> = ({ roomId }) => {
    const { data: roomData } = api.rooms.get.useQuery({ roomId });
    const { data: gamesData } = api.games.getAll.useQuery({ roomId });
    const { data: sessionData } = useSession();
    useEffect(() => {
        if (roomData) {
            socket.emit("join room", { roomId });
        }
        return () => {
            if (roomData) {
                socket.emit("leave room", { roomId });
            }
        };
    }, [roomId, roomData]);

    if (!roomData) {
        return <div>404</div>;
    }
    return (
        <>
            <Head>
                <title>Game Room</title>
                <meta name="description" content={`Room page. Creator: ${roomData.creatorUsername}`} />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className={styles.room}>
                {sessionData?.user.uniqueName === roomData.creatorUsername ?
                    <CreationForm roomId={roomId} />
                    :
                    (sessionData?.user.name) && (roomData.inviteeUsername === sessionData?.user.uniqueName || !roomData.inviteeUsername) &&
                    <ReadyForm roomId={roomId} creatorName={roomData.creatorUsername} name={sessionData?.user.name} />
                }

                {gamesData?.map(({ id }) => (
                    <React.Fragment key={id}>
                        <GameTimer gameId={id} />
                        <ChessBoard size={"5rem"} gameId={id} />
                    </React.Fragment>
                ))}
            </div>
        </>
    );
};

export default RoomPage;

const ReadyForm: React.FC<{ roomId: string, creatorName: string, name: string }> = ({ roomId, creatorName, name }) => {
    const [isReady, setIsReady] = useState(false);

    function sendReady() {
        setIsReady(ready => {
            socket.emit("room ready status", { roomId: roomId, uniqueName: creatorName, name: ready ? "" : name });
            return !ready;
        });
    }

    return <button type="button" onClick={sendReady}>{isReady ? "Не готов" : "Готов"}</button>;
};


export const getStaticProps: GetStaticProps = async (context) => {
    const ssg = generateSSGHelper();

    const roomId = context.params?.id;

    if (typeof roomId !== "string") throw new Error("no room id");

    await ssg.rooms.get.prefetch({ roomId });

    return {
        props: {
            trpcState: ssg.dehydrate(),
            roomId
        }
    };
};

export const getStaticPaths: GetStaticPaths = () => {
    return { paths: [], fallback: "blocking" };
};

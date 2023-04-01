import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import { useEffect, useState } from "react";
import { ChessBoard } from "~/components/ChessBoard";
import { socket } from "~/server/gameServer";
import { useSession } from "next-auth/react";
import { CreationForm } from "~/components/CreationForm";




const RoomPage: NextPage<{ roomId: string }> = ({ roomId }) => {
    const { data: roomData } = api.rooms.get.useQuery({ roomId });
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
    const { data: sessionData } = useSession();

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
            {sessionData?.user.uniqueName === roomData.creatorUsername ?
                <CreationForm roomId={roomId} />
                :
                (sessionData?.user.name) && (roomData.inviteeUsername === sessionData?.user.uniqueName || !roomData.inviteeUsername) &&
                <ReadyForm roomId={roomId} creatorName={roomData.creatorUsername} name={sessionData?.user.name} />
            }
            <ChessBoard size={"5rem"} boardDefault={true} gameId={roomId} />
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

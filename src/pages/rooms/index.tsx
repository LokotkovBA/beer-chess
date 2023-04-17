import { type GetStaticProps, type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import { useRef, useState } from "react";
import { CreationForm } from "~/components/CreationForm";
import { socket } from "~/server/gameServer";
import styles from "./index.module.scss";

const RoomsPage: NextPage = () => {
    const { data } = api.rooms.getAll.useQuery();
    const { status: sessionStatus } = useSession();

    if (!data) {
        return <div>500</div>;
    }

    return (
        <>
            <Head>
                <title>List of rooms</title>
                <meta name="description" content="Beer Chess's list of rooms" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            {sessionStatus === "authenticated" && <CreateRoomSection />}
            <div className={styles.roomsList}>
                {data.map(({ id }, index) => {
                    return <Link className="link" key={id} href={`/room/${id}`}><span>Room {index + 1}</span></Link>;
                })}
            </div>
        </>
    );
};

const CreateRoomSection: React.FC = () => {
    const ctx = api.useContext();
    const [showDialog, setShowDialog] = useState(false);
    const { mutate: createRoom, isLoading: isCreating } = api.rooms.create.useMutation({
        onSuccess: (data) => {
            toast.success("Success");
            void ctx.rooms.invalidate();
            if (data) {
                roomId.current = data.id;
                setShowDialog(true);
            }
        },
        onError: (error) => {
            const errorMessage = error.data?.zodError?.fieldErrors.content;
            if (errorMessage && errorMessage[0]) {
                toast.error(errorMessage[0]);
            }
            toast.error("Failed to create room! Please try again later.", { className: "alert" });
        }
    });

    const roomId = useRef("");

    return (
        <>
            {isCreating && <div>Creating...</div>}
            {showDialog && <dialog className="pop-up">
                <button className="button" type="button" onClick={() => {
                    if (roomId) {
                        socket.emit("leave room", { roomId: roomId.current });
                    }
                    setShowDialog(false);
                }}>Закрыть</button>
                <CreationForm roomId={roomId.current} />
            </dialog>}
            <button disabled={isCreating} type="button" onClick={() => createRoom()}>
                Создать комнату
            </button>
        </>
    );
};

export default RoomsPage;

export const getStaticProps: GetStaticProps = async () => {
    const ssg = generateSSGHelper();

    await ssg.rooms.getAll.prefetch();
    return {
        props: {
            trpcState: ssg.dehydrate()
        }
    };
};

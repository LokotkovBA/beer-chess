import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

const RoomsPage: NextPage = () => {
    const { data, isSuccess, isError } = api.rooms.getAll.useQuery();
    const { status: sessionStatus } = useSession();

    if (isError) {
        toast.error("Failed to load list of rooms");
    }

    return (
        <>
            <Head>
                <title>List of rooms</title>
                <meta name="description" content="Beer Chess's list of rooms" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div>
                {isSuccess && data.map(({ id }, index) => {
                    return <Link key={id} href={`/rooms/${id}`}><span>Room {index + 1}</span></Link>;
                })}
                {sessionStatus === "authenticated" && <CreateRoomSection />}
            </div>
        </>
    );
};

const CreateRoomSection: React.FC = () => {
    const ctx = api.useContext();
    const { mutate: createRoom, isLoading: isCreating } = api.rooms.create.useMutation({
        onSuccess: () => {
            void ctx.rooms.invalidate();
        },
        onError: (error) => {
            const errorMessage = error.data?.zodError?.fieldErrors.content;
            if (errorMessage && errorMessage[0]) {
                toast.error(errorMessage[0]);
            }
            toast.error("Failed to create room! Please try again later.");
        }
    });

    return <button disabled={isCreating} type="button" onClick={() => createRoom()}>
        Create Room
    </button>;
};

export default RoomsPage;

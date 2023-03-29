import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { toast } from "react-hot-toast";
import { api } from "~/utils/api";

const RoomsPage: NextPage = () => {
    const ctx = api.useContext();
    const { data: tournaments, isLoading, isError } = api.tournaments.getAll.useQuery();
    const { mutate: createTournament } = api.tournaments.create.useMutation({
        onSuccess: () => {
            void ctx.invalidate();
        }
    });
    const { data: sessionData } = useSession();

    if (isError) {
        toast.error("Failed to load list of tournaments");
    }


    return (
        <>
            <Head>
                <title>List of tournaments</title>
                <meta name="description" content="Beer Chess's list of tournaments" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div>
                {isLoading && <div className="spinner" />}
                {tournaments?.map((tournament) => {
                    return `${tournament.title} - ${tournament.status}`;
                })}
                {sessionData?.user.role === "ADMIN" && <button type="button" onClick={() => createTournament()}>Создать</button>}
            </div>
        </>
    );
};

export default RoomsPage;


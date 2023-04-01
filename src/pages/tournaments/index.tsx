import { type GetStaticProps, type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { toast } from "react-hot-toast";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import { api } from "~/utils/api";

const RoomsPage: NextPage = () => {
    const ctx = api.useContext();
    const { data: tournaments } = api.tournaments.getAll.useQuery();
    const { mutate: createTournament } = api.tournaments.create.useMutation({
        onSuccess: () => {
            void ctx.invalidate();
            toast.success("Success");
        }
    });
    const { data: sessionData } = useSession();

    return (
        <>
            <Head>
                <title>List of tournaments</title>
                <meta name="description" content="Beer Chess's list of tournaments" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            {tournaments?.map((tournament) => {
                return `${tournament.title} - ${tournament.status}`;
            })}
            {sessionData?.user.role === "ADMIN" && <button type="button" onClick={() => createTournament()}>Создать</button>}
        </>
    );
};

export default RoomsPage;

export const getStaticProps: GetStaticProps = async () => {
    const ssg = generateSSGHelper();
    await ssg.tournaments.getAll.prefetch();

    return {
        props: {
            trpcState: ssg.dehydrate()
        }
    };
};

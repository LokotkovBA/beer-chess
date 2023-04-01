import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import { PageLayout } from "~/components/PageLayout";


const RoomPage: NextPage<{ id: string }> = ({ id }) => {
    const { data: tournamentData, isError } = api.tournaments.get.useQuery({ tournamentId: id });


    if (isError || !tournamentData) {
        return <div>Error loading room</div>;
    }


    return (
        <>
            <Head>
                <title>Tournament</title>
                <meta name="description" content={`Game field for room ${id}`} />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <PageLayout>
                <h1>
                    {tournamentData.title}
                </h1>
                {tournamentData.Groups.map(group => {
                    return (
                        <>
                            <div>Group #{group.groupNumber}</div>
                            <div>{group.user.name}</div>
                            <div>Score: {group.points}</div>
                        </>
                    );
                })}
            </PageLayout>
        </>
    );
};

export default RoomPage;


export const getStaticProps: GetStaticProps = async (context) => {
    const ssg = generateSSGHelper();

    const id = context.params?.id;

    if (typeof id !== "string") throw new Error("no tournament id");

    await ssg.tournaments.get.prefetch({ tournamentId: id });

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

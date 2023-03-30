import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Profile from "~/components/Profile";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import { api } from "~/utils/api";



const ProfilePage: NextPage<{ username: string }> = ({ username }) => {
    const { data: userData } = api.users.get.useQuery({ username });
    if (!userData || !userData.name) {
        return <div>404</div>;
    }

    return (
        <>
            <Head>
                <title>{username}</title>
                <meta name="description" content={`profile ${username}`} />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Profile name={userData.name} image={userData.image} />
        </>
    );
};

export default ProfilePage;

export const getStaticProps: GetStaticProps = async (context) => {
    const slug = context.params?.slug;
    if (typeof slug !== "string") throw new Error("no username");
    const username = slug.replace("@", "");

    const ssg = generateSSGHelper();
    await ssg.users.get.prefetch({ username });
    return {
        props: {
            username,
            trpcState: ssg.dehydrate()
        }
    };
};


export const getStaticPaths: GetStaticPaths = () => {
    return { paths: [], fallback: "blocking" };
};
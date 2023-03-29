import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Profile from "~/components/Profile";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";

type NextPageProps = {
    name: string | null;
    image: string | null;
    gamesAsWhite: {
        roomId: string;
        whiteUserName: string;
        blackUserName: string;
        position: string;
    }[];
    gamesAsBlack: {
        roomId: string;
        whiteUserName: string;
        blackUserName: string;
        position: string;
    }[];
} | null

const ProfilePage: NextPage<NextPageProps> = (props) => {
    console.log(props);
    if (!props || !props.name) {
        return <div>404</div>;
    }

    const { name, image } = props;
    return (
        <>
            <Head>
                <title>{name}</title>
                <meta name="description" content={`profile ${name}`} />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Profile uniqueName={name} image={image} />
        </>
    );
};

export default ProfilePage;

export const getServerSideProps: GetServerSideProps = async (context) => {
    const ssg = generateSSGHelper();
    const slug = context.params?.slug;

    if (typeof slug !== "string") throw new Error("no slug");

    const userName = slug.replace("@", "").toLowerCase();

    const data = await ssg.users.get.fetch({ userName: userName });

    return {
        props: {
            ...data
        }
    };
};

import { type NextPage } from "next";
import Head from "next/head";
import { PageLayout } from "~/components/PageLayout";

const Home: NextPage = () => {

    return (
        <>
            <Head>
                <title>Beer Chess</title>
                <meta name="description" content="Beer Chess main page" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <PageLayout>
            </PageLayout>
        </>
    );
};

export default Home;


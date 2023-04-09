import { type NextPage } from "next";
import Head from "next/head";
import TileBoard from "~/components/TileBoard";

const Home: NextPage = () => {

    return (
        <>
            <Head>
                <title>Beer Chess</title>
                <meta name="description" content="Beer Chess main page" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <article className="home-page">
                <div>
                    <h2>Сайт для пивных турниров <br />и расслабленной игры в шахматы</h2>
                    <div className="button-block">
                        <button className="button-block__button button">Игра 1 на 1</button>
                        <button className="button-block__button button button--brb">Создать турнир</button>
                    </div>
                </div>
                <TileBoard addClass="chess-board--3d" size="2rem" />

            </article>
        </>
    );
};

export default Home;


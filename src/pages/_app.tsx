import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";

import { api } from "~/utils/api";

import "~/styles/globals.scss";
import { Toaster } from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import { memo, useEffect, type PropsWithChildren } from "react";
import { socket } from "~/server/gameServer";

const MyApp: AppType<{ session: Session | null }> = ({
    Component,
    pageProps: { session, ...pageProps },
}) => {
    return (
        <SessionProvider session={session}>
            <Toaster toastOptions={{ style: { backgroundColor: "var(--alert-color)", color: " var(--text-color)" } }} />
            <Layout>
                <Component {...pageProps} />
            </Layout>
        </SessionProvider>
    );
};

export default api.withTRPC(MyApp);


const Layout = ({ children }: PropsWithChildren) => {
    const { data: sessionData } = useSession();
    useEffect(() => {
        const uniqueName = sessionData?.user.uniqueName;
        if (uniqueName) {
            socket.emit("sub to invites", { uniqueName });
        }
        return () => {
            if (uniqueName) {
                socket.emit("unsub from invites", { uniqueName });
            }
        };
    }, [sessionData?.user.uniqueName]);

    return (
        <>
            <header>
                <nav>
                    <MainMenu />
                </nav>
            </header>
            <main>
                {children}
            </main>
        </>);
};

const MainMenu = memo(function MainMenu() {
    return (
        <menu className="menu">
            <li className="menu__item">
                <Link href="/">🍺</Link>
            </li>
            <li className="menu__item">
                <Link href="/rooms">Комнаты</Link>
            </li>
            <li className="menu__item">
                <Link href="/tournaments">Турниры</Link>
            </li>
            <li className="menu__item">
                <Auth />
            </li>
        </menu>
    );
});

const Auth: React.FC = () => {
    const { data: sessionData } = useSession();

    return (
        <div className="menu__profile">
            {sessionData && <Link href={`/${sessionData.user.uniqueName}`}>Профиль {sessionData.user.name}</Link>}
            {sessionData?.user.image && <Image height={24} width={24} alt={`${sessionData.user.uniqueName}'s profile picture`} src={sessionData?.user.image} />}
            <button className={`button ${sessionData ? `button--logout` : `button--login`}`}
                onClick={sessionData ? () => void signOut() : () => void signIn()}
            >
                {sessionData ? "Sign out" : "Sign in"}
            </button>
        </div>
    );
};

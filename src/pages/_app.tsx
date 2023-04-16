import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { type PropsWithChildren, useEffect, useState, memo } from "react";
import { api } from "~/utils/api";
import { Toaster } from "react-hot-toast";
import Profile from "~/components/Profile";
import { socket } from "~/server/gameServer";
import "~/styles/globals.scss";
import "~/styles/home-page.scss";
import "~/styles/chess.scss";
import "~/styles/creation-form.scss";

const MyApp: AppType<{ session: Session | null }> = ({
    Component,
    pageProps: { session, ...pageProps },
}) => {
    return (
        <SessionProvider session={session}>
            <Toaster toastOptions={{ style: { backgroundColor: "var(--alert-color)", color: " var(--text-color)" } }} />
            <PageLayout>
                <Component {...pageProps} />
            </PageLayout>
        </SessionProvider>
    );
};

export default api.withTRPC(MyApp);

const PageLayout: React.FC<PropsWithChildren> = ({ children }) => {
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
            <header className="header">
                <nav>
                    <MainMenu />
                </nav>
            </header>
            <main className="main-content">
                {children}
            </main>
        </>);
};


const MainMenu: React.FC = memo(function MainMenu() {
    const [showProfile, setShowProfile] = useState(false);
    const { data: sessionData } = useSession();
    useEffect(() => {
        function hideProfile() {
            setShowProfile(false);
        }
        document.addEventListener("click", hideProfile);
        () => {
            document.removeEventListener("click", hideProfile);
        };
    }, []);

    return (
        <>
            <menu className="menu">
                <li className="menu__item">
                    <Link className="link" href="/">🍺</Link>
                </li>
                <li className="menu__item">
                    <Link className="link" href="/rooms">Комнаты</Link>
                </li>
                <li className="menu__item">
                    <Link className="link" href="/tournaments">Турниры</Link>
                </li>
                <li className="menu__item">
                    <a onClick={(event) => {
                        event.stopPropagation();
                        setShowProfile(true);
                    }} className="link">
                        Профиль
                        {sessionData?.user.image ? <Image className="profile-picture" width={45} height={45} alt={`Your profile picture`} src={sessionData.user.image} /> : <div className="profile-picture" />}
                    </a>
                </li>
            </menu>
            {showProfile && <div onClick={(event) => event.stopPropagation()} className="pop-up" >
                <AuthButton sessionData={sessionData} />
                {sessionData?.user.name && <Profile name={sessionData.user.name} />}
            </div>}
        </>
    );
});

const AuthButton: React.FC<{ sessionData: Session | null }> = ({ sessionData }) => {
    return (
        <button className={`button ${sessionData ? `button--logout` : `button--login`}`} onClick={sessionData ? () => void signOut() : () => void signIn()}>
            {sessionData ? "Выйти" : "Войти"}
        </button>
    );
};


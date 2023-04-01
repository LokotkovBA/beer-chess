import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import React, { type PropsWithChildren, useEffect, useState } from "react";
import { socket } from "~/server/gameServer";
import Profile from "./Profile";
import { type Session } from "next-auth";


export const PageLayout: React.FC<PropsWithChildren> = ({ children }) => {
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
            <main>
                {children}
            </main>
        </>);
};


const MainMenu: React.FC = () => {
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
                    <Link className="link" href="/rooms">Rooms</Link>
                </li>
                <li className="menu__item">
                    <Link className="link" href="/tournaments">Tournaments</Link>
                </li>
                <li className="menu__item">
                    <button onClick={(event) => {
                        event.stopPropagation();
                        setShowProfile(true);
                    }} className="link">
                        Profile
                        {sessionData?.user.image ? <Image className="profile-picture" width={45} height={45} alt={`Your profile picture`} src={sessionData.user.image} /> : <div className="profile-picture" />}
                    </button>
                </li>
            </menu>
            {showProfile && <div onClick={(event) => event.stopPropagation()} className="pop-up" >
                <AuthButton sessionData={sessionData} />
                {sessionData?.user.name && <Profile name={sessionData.user.name} />}
            </div>}
        </>
    );
};

const AuthButton: React.FC<{ sessionData: Session | null }> = ({ sessionData }) => {

    return (
        <button className={`button ${sessionData ? `button--logout` : `button--login`}`} onClick={sessionData ? () => void signOut() : () => void signIn()}>
            {sessionData ? "Sign out" : "Sign in"}
        </button>
    );
};

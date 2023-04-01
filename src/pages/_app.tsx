import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import { api } from "~/utils/api";

import "~/styles/globals.scss";
import "~/styles/chess.scss";
import { Toaster } from "react-hot-toast";

const MyApp: AppType<{ session: Session | null }> = ({
    Component,
    pageProps: { session, ...pageProps },
}) => {
    return (
        <SessionProvider session={session}>
            <Toaster toastOptions={{ style: { backgroundColor: "var(--alert-color)", color: " var(--text-color)" } }} />
            <Component {...pageProps} />
        </SessionProvider>
    );
};

export default api.withTRPC(MyApp);

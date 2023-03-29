import { createTRPCRouter } from "~/server/api/trpc";
import { roomsRouter } from "./routers/rooms";
import { tournamentsRouter } from "./routers/tournaments";
import { usersRouter } from "./routers/users";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
    rooms: roomsRouter,
    tournaments: tournamentsRouter,
    users: usersRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;

import { z } from "zod";
import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "~/server/api/trpc";

const gameSelector = {
    select: {
        roomId: true,
        position: true,
        whiteUsername: true,
        blackUsername: true
    }
};

export const usersRouter = createTRPCRouter({
    get: publicProcedure
        .input(z.object({ userName: z.string() }))
        .query(({ ctx, input: { userName } }) => {
            return ctx.prisma.user.findUnique({
                where: { uniqueName: userName },
                select: {
                    name: true,
                    image: true,
                    gamesAsBlack: gameSelector,
                    gamesAsWhite: gameSelector
                },
            });
        }),
    changeName: protectedProcedure
        .input(z.object({ name: z.string() }))
        .mutation(({ ctx, input: { name } }) => {
            return ctx.prisma.user.update({
                where: {
                    id: ctx.session.user.id
                },
                data: {
                    name: name,
                    uniqueName: name.toLowerCase()
                }
            });
        })
});

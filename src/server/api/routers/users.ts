import { z } from "zod";
import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "~/server/api/trpc";

const roomsSelector = {
    id: true,
    title: true,
    score: true,
    status: true,
};
export const usersRouter = createTRPCRouter({
    get: publicProcedure
        .input(z.object({ username: z.string() }))
        .query(({ ctx, input: { username } }) => {
            return ctx.prisma.user.findUnique({
                where: { uniqueName: username },
                select: {
                    name: true,
                    image: true,
                    rooms: {
                        select: roomsSelector,
                        orderBy: {
                            createdAt: "desc"
                        }
                    },
                    invites: {
                        select: roomsSelector,
                        orderBy: {
                            createdAt: "desc"
                        }
                    },
                },
            });
        }),
    changeName: protectedProcedure
        .input(z.object({ newName: z.string(), oldName: z.string() }))
        .mutation(async ({ ctx, input: { newName, oldName } }) => {
            await ctx.prisma.user.update({
                where: {
                    id: ctx.session.user.id
                },
                data: {
                    name: newName,
                    uniqueName: newName.toLowerCase()
                }
            });
            await ctx.res?.revalidate(`/@${oldName.toLowerCase()}`);
            return ctx.res?.revalidate(`/@${newName.toLowerCase()}`);
        })
});

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "~/server/api/trpc";
import { createRatelimiter } from "~/server/helpers/rateLimiter";

const rateLimit = createRatelimiter(10, "30 s");

export const roomsRouter = createTRPCRouter({
    getAll: publicProcedure.query(({ ctx }) => {
        return ctx.prisma.room.findMany({
            select: {
                id: true,
                status: true
            }
        });
    }),
    create: protectedProcedure.mutation(async ({ ctx }) => {
        const creatorUsername = ctx.session.user.uniqueName;
        const { success } = await rateLimit.limit(creatorUsername);
        if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

        await ctx.prisma.room.create({ data: { creatorUsername } });
        await ctx.res?.revalidate("/rooms");
        return ctx.prisma.room.findFirst({
            where: { creatorUsername },
            select: { id: true },
            orderBy: { createdAt: "desc" }
        });
    }),
    get: publicProcedure
        .input(z.object({ roomId: z.string() }))
        .query(({ ctx, input: { roomId } }) => {
            return ctx.prisma.room.findFirst({
                where: { id: roomId },
                select: {
                    inviteeUsername: true,
                    creatorUsername: true,
                    status: true,
                }
            });
        }),
    updateInvitee: protectedProcedure
        .input(z.object({ roomId: z.string(), inviteeUsername: z.string() }))
        .mutation(async ({ ctx, input: { roomId, inviteeUsername } }) => {
            await ctx.prisma.room.update({
                where: {
                    id: roomId
                },
                data: {
                    inviteeUsername
                }
            });
            return ctx.res?.revalidate(`/room/${roomId}`);
        })
});

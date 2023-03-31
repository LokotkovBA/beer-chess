import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const gamesRouter = createTRPCRouter({
    create: protectedProcedure
        .input(z.object({ roomId: z.string(), timeRule: z.string(), isWhite: z.boolean(), inviteeUsername: z.string().nonempty() }))
        .mutation(async ({ ctx, input: { roomId, timeRule, isWhite, inviteeUsername } }) => {
            const gameParams = {
                whiteUsername: isWhite ? ctx.session.user.uniqueName : inviteeUsername.toLowerCase(),
                blackUsername: isWhite ? inviteeUsername.toLowerCase() : ctx.session.user.uniqueName,
            };
            await ctx.prisma.game.create({
                data: {
                    ...gameParams,
                    roomId,
                    timeRule
                }
            });
            return ctx.res?.revalidate(`/room/${roomId}`);
        }),
    getAll: publicProcedure
        .input(z.object({ roomId: z.string() }))
        .query(({ ctx, input: { roomId } }) => {
            return ctx.prisma.game.findMany({
                where: { roomId },
                select: {
                    id: true,
                    blackUsername: true,
                    whiteUsername: true,
                    position: true,
                    history: true,
                    status: true,
                },
                orderBy: {
                    createdAt: "desc"
                }
            });
        })
});
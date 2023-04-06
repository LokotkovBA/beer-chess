import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { encrypt } from "~/server/helpers/encryption";

export const gamesRouter = createTRPCRouter({
    getSecretName: protectedProcedure.query(({ ctx }) => {
        return { secretName: encrypt(ctx.session.user.uniqueName) };
    }),
    get: publicProcedure
        .input(z.object({ gameId: z.string() }))
        .query(({ ctx, input: { gameId } }) => {
            return ctx.prisma.game.findUnique({
                where: { id: gameId },
                select: {
                    blackUsername: true,
                    whiteUsername: true,
                    position: true,
                    status: true,
                    timeRule: true,
                    history: true,
                }
            });
        }),
    create: protectedProcedure
        .input(z.object({ roomId: z.string(), timeRule: z.string(), isWhite: z.boolean(), inviteeUsername: z.string().nonempty() }))
        .mutation(async ({ ctx, input: { roomId, timeRule, isWhite, inviteeUsername } }) => {
            const gameParams = {
                whiteUsername: isWhite ? ctx.session.user.uniqueName : inviteeUsername.toLowerCase(),
                blackUsername: isWhite ? inviteeUsername.toLowerCase() : ctx.session.user.uniqueName,
            };
            const game = await ctx.prisma.game.create({
                data: {
                    ...gameParams,
                    roomId,
                    timeRule
                }
            });
            await ctx.res?.revalidate(`/room/${roomId}`);
            return game;
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
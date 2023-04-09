import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { encrypt } from "~/server/helpers/encryption";
import { GameStatus } from "@prisma/client";

export const gamesRouter = createTRPCRouter({
    getSecretName: publicProcedure.query(({ ctx }) => {
        return ctx.session ? encrypt(ctx.session.user.uniqueName) : "unauthorized";
    }),
    get: publicProcedure
        .input(z.object({ gameId: z.string() }))
        .query(({ ctx, input: { gameId } }) => {
            return ctx.prisma.game.findUnique({
                where: { id: gameId },
            });
        }),
    getByRoomId: publicProcedure
        .input(z.object({ roomId: z.string() }))
        .query(({ ctx, input: { roomId } }) => {
            return ctx.prisma.game.findFirst({
                where: { roomId },
                orderBy: { createdAt: "desc" }
            });
        }),
    create: protectedProcedure
        .input(z.object({ roomId: z.string(), title: z.string(), maxTime: z.number(), timeRule: z.string(), isWhite: z.boolean(), inviteeUsername: z.string().nonempty() }))
        .mutation(async ({ ctx, input: { title, roomId, timeRule, isWhite, inviteeUsername, maxTime } }) => {
            const whiteUsername = isWhite ? ctx.session.user.uniqueName : inviteeUsername.toLowerCase();
            const blackUsername = isWhite ? inviteeUsername.toLowerCase() : ctx.session.user.uniqueName;
            const game = await ctx.prisma.game.create({
                data: {
                    whiteUsername,
                    blackUsername,
                    timeLeftWhite: maxTime,
                    timeLeftBlack: maxTime,
                    title,
                    roomId,
                    timeRule,
                }
            });
            await ctx.res?.revalidate(`/room/${roomId}`);
            return game;
        }),
    update: protectedProcedure
        .input(z.object({ gameId: z.string(), position: z.string(), timeLeftWhite: z.number(), timeLeftBlack: z.number(), status: z.string(), history: z.string() }))
        .mutation(({ ctx, input: { gameId, position, status, history, timeLeftBlack, timeLeftWhite } }) => {
            if (!isGameStatus(status)) return null;
            return ctx.prisma.game.update({
                where: { id: gameId },
                data: {
                    status,
                    position,
                    history,
                    timeLeftWhite,
                    timeLeftBlack
                }
            });
        }),
    getAll: publicProcedure
        .input(z.object({ roomId: z.string() }))
        .query(({ ctx, input: { roomId } }) => {
            return ctx.prisma.game.findMany({
                where: { roomId },
                orderBy: { createdAt: "desc" }
            });
        })
});


function isGameStatus(value: string): value is GameStatus {
    return Object.keys(GameStatus).includes(value);
}
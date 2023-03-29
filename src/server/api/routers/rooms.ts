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

        return ctx.prisma.room.create({ data: { creatorUsername } });
    }),
    get: publicProcedure
        .input(z.object({ roomId: z.string() }))
        .query(({ ctx, input: { roomId } }) => {
            return ctx.prisma.room.findFirst({
                where: { id: roomId },
                select: {
                    creatorUser: true,
                    inviteeUsername: true,
                    inviteeUser: true,
                    status: true,
                }
            });
        }),
    getPersistent: publicProcedure
        .input(z.object({ roomId: z.string() }))
        .query(({ ctx, input: { roomId } }) => {
            return ctx.prisma.room.findUnique({
                where: { id: roomId },
                select: {
                    title: true,
                    creatorUser: {
                        select: {
                            name: true,
                            id: true
                        }
                    },

                }
            });
        }),
    updateInvitee: protectedProcedure
        .input(z.object({ roomId: z.string(), inviteeUsername: z.string().nonempty() }))
        .mutation(({ ctx, input: { roomId, inviteeUsername } }) => {
            return ctx.prisma.room.update({
                where: {
                    id: roomId
                },
                data: {
                    inviteeUsername
                }
            });
        }),
    start: protectedProcedure
        .input(z.object({ roomId: z.string(), isWhite: z.boolean(), inviteeUsername: z.string().nonempty() }))
        .mutation(async ({ ctx, input: { roomId, isWhite, inviteeUsername } }) => {
            const gameParams = {
                whiteUsername: isWhite ? ctx.session.user.uniqueName : inviteeUsername,
                blackUsername: isWhite ? inviteeUsername : ctx.session.user.uniqueName,
            };
            return ctx.prisma.game.create({
                data: {
                    ...gameParams,
                    roomId
                }
            });
        })
});

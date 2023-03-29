import { z } from "zod";
import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "~/server/api/trpc";

export const tournamentsRouter = createTRPCRouter({
    create: protectedProcedure
        .mutation(({ ctx }) => {
            if (ctx.session.user.role !== "ADMIN") return;
            return ctx.prisma.tournament.create({
                data: {}
            });
        }),
    getAll: publicProcedure
        .query(({ ctx }) => {
            return ctx.prisma.tournament.findMany({
                select: {
                    id: true,
                    title: true,
                    status: true
                }
            });
        }),
    get: publicProcedure
        .input(z.object({ tournamentId: z.string() }))
        .query(({ ctx, input: { tournamentId } }) => {
            return ctx.prisma.tournament.findFirst({
                where: { id: tournamentId },
                select: {
                    title: true,
                    status: true,
                    inviteOnly: true,
                    withGroups: true,
                    Brackets: true,
                    Groups: {
                        select: {
                            groupNumber: true,
                            points: true,
                            user: {
                                select: {
                                    name: true,
                                    image: true
                                }
                            }
                        },
                        orderBy: {
                            groupNumber: "asc",
                            points: "desc"
                        }
                    },
                    Leaderboard: true
                },
            });
        })
});

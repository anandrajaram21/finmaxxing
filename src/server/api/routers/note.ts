import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { notes } from "@/server/db/schema";

export const noteRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ content: z.string().trim().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(notes).values({
        content: input.content,
        createdById: ctx.session.user.id,
      });
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.notes.findMany({
      where: (notes, { eq }) => eq(notes.createdById, ctx.session.user.id),
      orderBy: (notes, { desc }) => [desc(notes.createdAt)],
    });
  }),
});

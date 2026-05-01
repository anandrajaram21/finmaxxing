import { TRPCError } from "@trpc/server";
import { and, asc, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { type db as database } from "@/server/db";
import { goals } from "@/server/db/schema";

const idInput = z.object({
  id: z.number().int().positive(),
});

const goalCreateInput = z.object({
  name: z.string().trim().min(1).max(255),
  targetAmountMinor: z.number().int().positive(),
  targetYear: z.number().int().positive(),
});

const goalUpdateInput = idInput
  .extend({
    name: z.string().trim().min(1).max(255).optional(),
    targetAmountMinor: z.number().int().positive().optional(),
    targetYear: z.number().int().positive().optional(),
  })
  .refine(
    ({ name, targetAmountMinor, targetYear }) =>
      name !== undefined ||
      targetAmountMinor !== undefined ||
      targetYear !== undefined,
    "At least one goal field must be provided.",
  );

export const goalsRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => {
    return ctx.db
      .select()
      .from(goals)
      .where(eq(goals.userId, ctx.session.user.id))
      .orderBy(asc(goals.targetYear), asc(goals.name));
  }),

  byId: protectedProcedure.input(idInput).query(async ({ ctx, input }) => {
    const goal = await getUserGoal(ctx.db, ctx.session.user.id, input.id);

    if (!goal) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Goal was not found.",
      });
    }

    return goal;
  }),

  create: protectedProcedure
    .input(goalCreateInput)
    .mutation(async ({ ctx, input }) => {
      await assertGoalNameAvailable(ctx.db, ctx.session.user.id, input.name);

      const [goal] = await ctx.db
        .insert(goals)
        .values({
          name: input.name,
          targetAmountMinor: input.targetAmountMinor,
          targetYear: input.targetYear,
          userId: ctx.session.user.id,
        })
        .returning();

      if (!goal) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Goal could not be created.",
        });
      }

      return goal;
    }),

  update: protectedProcedure
    .input(goalUpdateInput)
    .mutation(async ({ ctx, input }) => {
      const existing = await getUserGoal(ctx.db, ctx.session.user.id, input.id);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Goal was not found.",
        });
      }

      if (input.name !== undefined) {
        await assertGoalNameAvailable(
          ctx.db,
          ctx.session.user.id,
          input.name,
          input.id,
        );
      }

      const [goal] = await ctx.db
        .update(goals)
        .set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.targetAmountMinor !== undefined
            ? { targetAmountMinor: input.targetAmountMinor }
            : {}),
          ...(input.targetYear !== undefined
            ? { targetYear: input.targetYear }
            : {}),
          updatedAt: new Date(),
        })
        .where(
          and(eq(goals.id, input.id), eq(goals.userId, ctx.session.user.id)),
        )
        .returning();

      if (!goal) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Goal could not be updated.",
        });
      }

      return goal;
    }),

  delete: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    const [goal] = await ctx.db
      .delete(goals)
      .where(and(eq(goals.id, input.id), eq(goals.userId, ctx.session.user.id)))
      .returning();

    if (!goal) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Goal was not found.",
      });
    }

    return goal;
  }),
});

type Database = typeof database;

async function getUserGoal(db: Database, userId: string, id: number) {
  const [goal] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, id), eq(goals.userId, userId)))
    .limit(1);

  return goal;
}

async function assertGoalNameAvailable(
  db: Database,
  userId: string,
  name: string,
  ignoredGoalId?: number,
) {
  const filters = [eq(goals.userId, userId), eq(goals.name, name)];

  if (ignoredGoalId !== undefined) {
    filters.push(ne(goals.id, ignoredGoalId));
  }

  const [existing] = await db
    .select({ id: goals.id })
    .from(goals)
    .where(and(...filters))
    .limit(1);

  if (existing) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "A goal with this name already exists.",
    });
  }
}

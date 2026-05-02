import { TRPCError } from "@trpc/server";
import { and, asc, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { type db as database } from "@/server/db";
import { allocations, goals, investments } from "@/server/db/schema";

const idInput = z.object({
  id: z.number().int().positive(),
});

const allocationCreateInput = z.object({
  goalId: z.number().int().positive(),
  investmentId: z.number().int().positive(),
  percentage: z.number().positive().max(1),
});

const allocationUpdateInput = idInput
  .extend({
    goalId: z.number().int().positive().optional(),
    investmentId: z.number().int().positive().optional(),
    percentage: z.number().positive().max(1).optional(),
  })
  .refine(
    ({ goalId, investmentId, percentage }) =>
      goalId !== undefined ||
      investmentId !== undefined ||
      percentage !== undefined,
    "At least one allocation field must be provided.",
  );

export const allocationsRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => {
    return ctx.db
      .select({
        goalId: goals.id,
        goalName: goals.name,
        id: allocations.id,
        investmentId: investments.id,
        investmentName: investments.name,
        monthlySipMinor: investments.monthlySipMinor,
        percentage: allocations.percentage,
      })
      .from(allocations)
      .innerJoin(investments, eq(allocations.investmentId, investments.id))
      .innerJoin(goals, eq(allocations.goalId, goals.id))
      .where(eq(allocations.userId, ctx.session.user.id))
      .orderBy(asc(investments.name), asc(goals.targetYear), asc(goals.name));
  }),

  byId: protectedProcedure.input(idInput).query(async ({ ctx, input }) => {
    const allocation = await getUserAllocation(
      ctx.db,
      ctx.session.user.id,
      input.id,
    );

    if (!allocation) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Allocation was not found.",
      });
    }

    return allocation;
  }),

  create: protectedProcedure
    .input(allocationCreateInput)
    .mutation(async ({ ctx, input }) => {
      await Promise.all([
        assertGoalBelongsToUser(ctx.db, ctx.session.user.id, input.goalId),
        assertInvestmentBelongsToUser(
          ctx.db,
          ctx.session.user.id,
          input.investmentId,
        ),
        assertAllocationPairAvailable(ctx.db, input.investmentId, input.goalId),
      ]);

      const [allocation] = await ctx.db
        .insert(allocations)
        .values({
          goalId: input.goalId,
          investmentId: input.investmentId,
          percentage: input.percentage,
          userId: ctx.session.user.id,
        })
        .returning();

      if (!allocation) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Allocation could not be created.",
        });
      }

      return allocation;
    }),

  update: protectedProcedure
    .input(allocationUpdateInput)
    .mutation(async ({ ctx, input }) => {
      const existing = await getUserAllocation(
        ctx.db,
        ctx.session.user.id,
        input.id,
      );

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Allocation was not found.",
        });
      }

      const investmentId = input.investmentId ?? existing.investmentId;
      const goalId = input.goalId ?? existing.goalId;

      await Promise.all([
        input.goalId !== undefined
          ? assertGoalBelongsToUser(ctx.db, ctx.session.user.id, input.goalId)
          : Promise.resolve(),
        input.investmentId !== undefined
          ? assertInvestmentBelongsToUser(
              ctx.db,
              ctx.session.user.id,
              input.investmentId,
            )
          : Promise.resolve(),
        input.goalId !== undefined || input.investmentId !== undefined
          ? assertAllocationPairAvailable(
              ctx.db,
              investmentId,
              goalId,
              input.id,
            )
          : Promise.resolve(),
      ]);

      const [allocation] = await ctx.db
        .update(allocations)
        .set({
          ...(input.goalId !== undefined ? { goalId: input.goalId } : {}),
          ...(input.investmentId !== undefined
            ? { investmentId: input.investmentId }
            : {}),
          ...(input.percentage !== undefined
            ? { percentage: input.percentage }
            : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(allocations.id, input.id),
            eq(allocations.userId, ctx.session.user.id),
          ),
        )
        .returning();

      if (!allocation) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Allocation could not be updated.",
        });
      }

      return allocation;
    }),

  delete: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    const [allocation] = await ctx.db
      .delete(allocations)
      .where(
        and(
          eq(allocations.id, input.id),
          eq(allocations.userId, ctx.session.user.id),
        ),
      )
      .returning();

    if (!allocation) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Allocation was not found.",
      });
    }

    return allocation;
  }),
});

type Database = typeof database;

async function getUserAllocation(db: Database, userId: string, id: number) {
  const [allocation] = await db
    .select()
    .from(allocations)
    .where(and(eq(allocations.id, id), eq(allocations.userId, userId)))
    .limit(1);

  return allocation;
}

async function assertGoalBelongsToUser(
  db: Database,
  userId: string,
  goalId: number,
) {
  const [goal] = await db
    .select({ id: goals.id })
    .from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .limit(1);

  if (!goal) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Goal was not found.",
    });
  }
}

async function assertInvestmentBelongsToUser(
  db: Database,
  userId: string,
  investmentId: number,
) {
  const [investment] = await db
    .select({ id: investments.id })
    .from(investments)
    .where(
      and(eq(investments.id, investmentId), eq(investments.userId, userId)),
    )
    .limit(1);

  if (!investment) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Investment was not found.",
    });
  }
}

async function assertAllocationPairAvailable(
  db: Database,
  investmentId: number,
  goalId: number,
  ignoredAllocationId?: number,
) {
  const filters = [
    eq(allocations.investmentId, investmentId),
    eq(allocations.goalId, goalId),
  ];

  if (ignoredAllocationId !== undefined) {
    filters.push(ne(allocations.id, ignoredAllocationId));
  }

  const [existing] = await db
    .select({ id: allocations.id })
    .from(allocations)
    .where(and(...filters))
    .limit(1);

  if (existing) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "This investment is already allocated to this goal.",
    });
  }
}

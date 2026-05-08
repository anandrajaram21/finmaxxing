import { TRPCError } from "@trpc/server";
import { and, asc, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { type db as database } from "@/server/db";
import { investments } from "@/server/db/schema";
import { getInvestmentMarketQuotes } from "@/server/investment-market-quotes";
import { investmentTypes } from "@/lib/investments";

const idInput = z.object({
  id: z.number().int().positive(),
});

const optionalTextInput = (max: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().max(max).nullable().optional(),
  );

const investmentCreateInput = z.object({
  investmentType: z.enum(investmentTypes).default("stock"),
  monthlySipMinor: z.number().int().nonnegative(),
  name: z.string().trim().min(1).max(255),
  tickerSymbol: z.string().trim().min(1).max(64),
});

const investmentUpdateInput = idInput
  .extend({
    category: optionalTextInput(128),
    currentNav: z.number().positive().nullable().optional(),
    investmentType: z.enum(investmentTypes).optional(),
    isActive: z.boolean().optional(),
    isin: optionalTextInput(32),
    monthlySipMinor: z.number().int().nonnegative().optional(),
    name: z.string().trim().min(1).max(255).optional(),
    tickerSymbol: z.string().trim().min(1).max(64).optional(),
  })
  .refine(
    ({
      category,
      currentNav,
      investmentType,
      isActive,
      isin,
      monthlySipMinor,
      name,
      tickerSymbol,
    }) =>
      category !== undefined ||
      currentNav !== undefined ||
      investmentType !== undefined ||
      isActive !== undefined ||
      isin !== undefined ||
      monthlySipMinor !== undefined ||
      name !== undefined ||
      tickerSymbol !== undefined,
    "At least one investment field must be provided.",
  );

export const investmentsRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => {
    return ctx.db
      .select()
      .from(investments)
      .where(eq(investments.userId, ctx.session.user.id))
      .orderBy(asc(investments.name));
  }),

  byId: protectedProcedure.input(idInput).query(async ({ ctx, input }) => {
    const investment = await getUserInvestment(
      ctx.db,
      ctx.session.user.id,
      input.id,
    );

    if (!investment) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Investment was not found.",
      });
    }

    return investment;
  }),

  create: protectedProcedure
    .input(investmentCreateInput)
    .mutation(async ({ ctx, input }) => {
      await assertInvestmentTickerAvailable(
        ctx.db,
        ctx.session.user.id,
        input.tickerSymbol,
      );

      const [investment] = await ctx.db
        .insert(investments)
        .values({
          monthlySipMinor: input.monthlySipMinor,
          investmentType: input.investmentType,
          name: input.name,
          tickerSymbol: input.tickerSymbol,
          userId: ctx.session.user.id,
        })
        .returning();

      if (!investment) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Investment could not be created.",
        });
      }

      return investment;
    }),

  update: protectedProcedure
    .input(investmentUpdateInput)
    .mutation(async ({ ctx, input }) => {
      const existing = await getUserInvestment(
        ctx.db,
        ctx.session.user.id,
        input.id,
      );

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Investment was not found.",
        });
      }

      if (input.tickerSymbol !== undefined) {
        await assertInvestmentTickerAvailable(
          ctx.db,
          ctx.session.user.id,
          input.tickerSymbol,
          input.id,
        );
      }

      const [investment] = await ctx.db
        .update(investments)
        .set({
          ...(input.category !== undefined ? { category: input.category } : {}),
          ...(input.currentNav !== undefined
            ? {
                currentNav: input.currentNav,
                navUpdatedAt: input.currentNav === null ? null : new Date(),
              }
            : {}),
          ...(input.investmentType !== undefined
            ? { investmentType: input.investmentType }
            : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          ...(input.isin !== undefined ? { isin: input.isin } : {}),
          ...(input.monthlySipMinor !== undefined
            ? { monthlySipMinor: input.monthlySipMinor }
            : {}),
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.tickerSymbol !== undefined
            ? { tickerSymbol: input.tickerSymbol }
            : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(investments.id, input.id),
            eq(investments.userId, ctx.session.user.id),
          ),
        )
        .returning();

      if (!investment) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Investment could not be updated.",
        });
      }

      return investment;
    }),

  delete: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    const [investment] = await ctx.db
      .delete(investments)
      .where(
        and(
          eq(investments.id, input.id),
          eq(investments.userId, ctx.session.user.id),
        ),
      )
      .returning();

    if (!investment) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Investment was not found.",
      });
    }

    return investment;
  }),

  refreshMarketValues: protectedProcedure.mutation(async ({ ctx }) => {
    const userInvestments = await ctx.db
      .select({
        id: investments.id,
        investmentType: investments.investmentType,
        tickerSymbol: investments.tickerSymbol,
      })
      .from(investments)
      .where(eq(investments.userId, ctx.session.user.id))
      .orderBy(asc(investments.name));

    const marketQuotes = await getInvestmentMarketQuotes(userInvestments);

    const now = new Date();
    let updated = 0;

    for (const investment of userInvestments) {
      const marketQuote = marketQuotes.get(investment.tickerSymbol.trim());
      if (!marketQuote) continue;

      await ctx.db
        .update(investments)
        .set({
          currentNav: marketQuote.price,
          navUpdatedAt: marketQuote.regularMarketTime ?? now,
          updatedAt: now,
        })
        .where(
          and(
            eq(investments.id, investment.id),
            eq(investments.userId, ctx.session.user.id),
          ),
        );

      updated += 1;
    }

    return {
      skipped: userInvestments.length - updated,
      total: userInvestments.length,
      updated,
    };
  }),
});

type Database = typeof database;

async function getUserInvestment(db: Database, userId: string, id: number) {
  const [investment] = await db
    .select()
    .from(investments)
    .where(and(eq(investments.id, id), eq(investments.userId, userId)))
    .limit(1);

  return investment;
}

async function assertInvestmentTickerAvailable(
  db: Database,
  userId: string,
  tickerSymbol: string,
  ignoredInvestmentId?: number,
) {
  const filters = [
    eq(investments.userId, userId),
    eq(investments.tickerSymbol, tickerSymbol),
  ];

  if (ignoredInvestmentId !== undefined) {
    filters.push(ne(investments.id, ignoredInvestmentId));
  }

  const [existing] = await db
    .select({ id: investments.id })
    .from(investments)
    .where(and(...filters))
    .limit(1);

  if (existing) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "An investment with this ticker symbol already exists.",
    });
  }
}

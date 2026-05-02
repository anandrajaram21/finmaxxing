import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { type db as database } from "@/server/db";
import { investments, transactions } from "@/server/db/schema";

const idInput = z.object({
  id: z.number().int().positive(),
});

const optionalNotesInput = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().max(1024).nullable().optional(),
);

const transactionCreateInput = z.object({
  amountMinor: z.number().int().positive(),
  investmentId: z.number().int().positive(),
  nav: z.number().positive(),
  notes: optionalNotesInput,
  transactionDate: z.date(),
  type: z.enum(["buy", "sell"]),
  units: z.number().positive(),
});

const transactionUpdateInput = idInput
  .extend({
    amountMinor: z.number().int().positive().optional(),
    investmentId: z.number().int().positive().optional(),
    nav: z.number().positive().optional(),
    notes: optionalNotesInput,
    transactionDate: z.date().optional(),
    type: z.enum(["buy", "sell"]).optional(),
    units: z.number().positive().optional(),
  })
  .refine(
    ({ amountMinor, investmentId, nav, notes, transactionDate, type, units }) =>
      amountMinor !== undefined ||
      investmentId !== undefined ||
      nav !== undefined ||
      notes !== undefined ||
      transactionDate !== undefined ||
      type !== undefined ||
      units !== undefined,
    "At least one transaction field must be provided.",
  );

export const transactionsRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => {
    return ctx.db
      .select({
        amountMinor: transactions.amountMinor,
        id: transactions.id,
        investmentId: transactions.investmentId,
        nav: transactions.nav,
        notes: transactions.notes,
        transactionDate: transactions.transactionDate,
        type: transactions.type,
        units: transactions.units,
      })
      .from(transactions)
      .where(eq(transactions.userId, ctx.session.user.id))
      .orderBy(desc(transactions.transactionDate), desc(transactions.id));
  }),

  byId: protectedProcedure.input(idInput).query(async ({ ctx, input }) => {
    const transaction = await getUserTransaction(
      ctx.db,
      ctx.session.user.id,
      input.id,
    );

    if (!transaction) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Transaction was not found.",
      });
    }

    return transaction;
  }),

  create: protectedProcedure
    .input(transactionCreateInput)
    .mutation(async ({ ctx, input }) => {
      await assertInvestmentBelongsToUser(
        ctx.db,
        ctx.session.user.id,
        input.investmentId,
      );

      const [transaction] = await ctx.db
        .insert(transactions)
        .values({
          amountMinor: input.amountMinor,
          investmentId: input.investmentId,
          nav: input.nav,
          notes: input.notes ?? null,
          transactionDate: input.transactionDate,
          type: input.type,
          units: input.units,
          userId: ctx.session.user.id,
        })
        .returning();

      if (!transaction) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Transaction could not be created.",
        });
      }

      return transaction;
    }),

  update: protectedProcedure
    .input(transactionUpdateInput)
    .mutation(async ({ ctx, input }) => {
      const existing = await getUserTransaction(
        ctx.db,
        ctx.session.user.id,
        input.id,
      );

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Transaction was not found.",
        });
      }

      if (input.investmentId !== undefined) {
        await assertInvestmentBelongsToUser(
          ctx.db,
          ctx.session.user.id,
          input.investmentId,
        );
      }

      const [transaction] = await ctx.db
        .update(transactions)
        .set({
          ...(input.amountMinor !== undefined
            ? { amountMinor: input.amountMinor }
            : {}),
          ...(input.investmentId !== undefined
            ? { investmentId: input.investmentId }
            : {}),
          ...(input.nav !== undefined ? { nav: input.nav } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          ...(input.transactionDate !== undefined
            ? { transactionDate: input.transactionDate }
            : {}),
          ...(input.type !== undefined ? { type: input.type } : {}),
          ...(input.units !== undefined ? { units: input.units } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(transactions.id, input.id),
            eq(transactions.userId, ctx.session.user.id),
          ),
        )
        .returning();

      if (!transaction) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Transaction could not be updated.",
        });
      }

      return transaction;
    }),

  delete: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    const [transaction] = await ctx.db
      .delete(transactions)
      .where(
        and(
          eq(transactions.id, input.id),
          eq(transactions.userId, ctx.session.user.id),
        ),
      )
      .returning();

    if (!transaction) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Transaction was not found.",
      });
    }

    return transaction;
  }),
});

type Database = typeof database;

async function getUserTransaction(db: Database, userId: string, id: number) {
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .limit(1);

  return transaction;
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

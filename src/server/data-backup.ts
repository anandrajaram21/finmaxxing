import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { investmentTypes } from "@/lib/investments";
import { db } from "@/server/db";
import {
  allocations,
  goals,
  investments,
  portfolioAssumptions,
  transactions,
} from "@/server/db/schema";

const backupDate = z.string().datetime();

const nullableBackupDate = backupDate.nullable();

const backupSchema = z.object({
  app: z.literal("finmaxxing"),
  exportedAt: backupDate,
  formatVersion: z.literal(1),
  data: z.object({
    allocations: z.array(
      z.object({
        createdAt: backupDate,
        goalId: z.number().int().positive(),
        id: z.number().int().positive(),
        investmentId: z.number().int().positive(),
        percentage: z.number().positive().max(1),
        updatedAt: nullableBackupDate,
      }),
    ),
    assumptions: z
      .object({
        createdAt: backupDate,
        currentYear: z.number().int().positive(),
        expectedReturnRate: z.number().nonnegative(),
        id: z.number().int().positive(),
        inflationRate: z.number().nonnegative(),
        updatedAt: nullableBackupDate,
      })
      .nullable(),
    goals: z.array(
      z.object({
        createdAt: backupDate,
        id: z.number().int().positive(),
        name: z.string().trim().min(1).max(255),
        targetAmountMinor: z.number().int().positive(),
        targetYear: z.number().int().positive(),
        updatedAt: nullableBackupDate,
      }),
    ),
    investments: z.array(
      z.object({
        category: z.string().max(128).nullable(),
        createdAt: backupDate,
        currentNav: z.number().positive().nullable(),
        id: z.number().int().positive(),
        investmentType: z.enum(investmentTypes).default("stock"),
        isActive: z.boolean(),
        isin: z.string().max(32).nullable(),
        monthlySipMinor: z.number().int().nonnegative(),
        name: z.string().trim().min(1).max(255),
        navUpdatedAt: nullableBackupDate,
        tickerSymbol: z.string().trim().min(1).max(64),
        updatedAt: nullableBackupDate,
      }),
    ),
    transactions: z.array(
      z.object({
        amountMinor: z.number().int().positive(),
        createdAt: backupDate,
        id: z.number().int().positive(),
        investmentId: z.number().int().positive(),
        nav: z.number().positive(),
        notes: z.string().max(1024).nullable(),
        transactionDate: backupDate,
        type: z.enum(["buy", "sell"]),
        units: z.number().positive(),
        updatedAt: nullableBackupDate,
      }),
    ),
  }),
});

export type FinanceBackup = z.infer<typeof backupSchema>;

export async function exportFinanceBackup(
  userId: string,
): Promise<FinanceBackup> {
  const [assumptionRows, goalRows, investmentRows, allocationRows, txRows] =
    await Promise.all([
      db
        .select()
        .from(portfolioAssumptions)
        .where(eq(portfolioAssumptions.userId, userId))
        .limit(1),
      db
        .select()
        .from(goals)
        .where(eq(goals.userId, userId))
        .orderBy(asc(goals.id)),
      db
        .select()
        .from(investments)
        .where(eq(investments.userId, userId))
        .orderBy(asc(investments.id)),
      db
        .select()
        .from(allocations)
        .where(eq(allocations.userId, userId))
        .orderBy(asc(allocations.id)),
      db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.transactionDate), desc(transactions.id)),
    ]);

  const assumption = assumptionRows[0];

  return {
    app: "finmaxxing",
    data: {
      allocations: allocationRows.map((allocation) => ({
        createdAt: toIsoDate(allocation.createdAt),
        goalId: allocation.goalId,
        id: allocation.id,
        investmentId: allocation.investmentId,
        percentage: allocation.percentage,
        updatedAt: toNullableIsoDate(allocation.updatedAt),
      })),
      assumptions: assumption
        ? {
            createdAt: toIsoDate(assumption.createdAt),
            currentYear: assumption.currentYear,
            expectedReturnRate: assumption.expectedReturnRate,
            id: assumption.id,
            inflationRate: assumption.inflationRate,
            updatedAt: toNullableIsoDate(assumption.updatedAt),
          }
        : null,
      goals: goalRows.map((goal) => ({
        createdAt: toIsoDate(goal.createdAt),
        id: goal.id,
        name: goal.name,
        targetAmountMinor: goal.targetAmountMinor,
        targetYear: goal.targetYear,
        updatedAt: toNullableIsoDate(goal.updatedAt),
      })),
      investments: investmentRows.map((investment) => ({
        category: investment.category,
        createdAt: toIsoDate(investment.createdAt),
        currentNav: investment.currentNav,
        id: investment.id,
        investmentType: investment.investmentType,
        isActive: investment.isActive,
        isin: investment.isin,
        monthlySipMinor: investment.monthlySipMinor,
        name: investment.name,
        navUpdatedAt: toNullableIsoDate(investment.navUpdatedAt),
        tickerSymbol: investment.tickerSymbol,
        updatedAt: toNullableIsoDate(investment.updatedAt),
      })),
      transactions: txRows.map((transaction) => ({
        amountMinor: transaction.amountMinor,
        createdAt: toIsoDate(transaction.createdAt),
        id: transaction.id,
        investmentId: transaction.investmentId,
        nav: transaction.nav,
        notes: transaction.notes,
        transactionDate: toIsoDate(transaction.transactionDate),
        type: transaction.type,
        units: transaction.units,
        updatedAt: toNullableIsoDate(transaction.updatedAt),
      })),
    },
    exportedAt: new Date().toISOString(),
    formatVersion: 1,
  };
}

export async function importFinanceBackup(userId: string, input: unknown) {
  const backup = backupSchema.parse(input);
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.delete(transactions).where(eq(transactions.userId, userId));
    await tx.delete(allocations).where(eq(allocations.userId, userId));
    await tx
      .delete(portfolioAssumptions)
      .where(eq(portfolioAssumptions.userId, userId));
    await tx.delete(goals).where(eq(goals.userId, userId));
    await tx.delete(investments).where(eq(investments.userId, userId));

    if (backup.data.assumptions) {
      await tx.insert(portfolioAssumptions).values({
        createdAt: parseBackupDate(backup.data.assumptions.createdAt),
        currentYear: backup.data.assumptions.currentYear,
        expectedReturnRate: backup.data.assumptions.expectedReturnRate,
        inflationRate: backup.data.assumptions.inflationRate,
        updatedAt: parseNullableBackupDate(backup.data.assumptions.updatedAt),
        userId,
      });
    }

    const goalIdMap = new Map<number, number>();
    for (const goal of backup.data.goals) {
      const [insertedGoal] = await tx
        .insert(goals)
        .values({
          createdAt: parseBackupDate(goal.createdAt),
          name: goal.name,
          targetAmountMinor: goal.targetAmountMinor,
          targetYear: goal.targetYear,
          updatedAt: parseNullableBackupDate(goal.updatedAt),
          userId,
        })
        .returning({ id: goals.id });

      if (insertedGoal) goalIdMap.set(goal.id, insertedGoal.id);
    }

    const investmentIdMap = new Map<number, number>();
    for (const investment of backup.data.investments) {
      const [insertedInvestment] = await tx
        .insert(investments)
        .values({
          category: investment.category,
          createdAt: parseBackupDate(investment.createdAt),
          currentNav: investment.currentNav,
          investmentType: investment.investmentType,
          isActive: investment.isActive,
          isin: investment.isin,
          monthlySipMinor: investment.monthlySipMinor,
          name: investment.name,
          navUpdatedAt: parseNullableBackupDate(investment.navUpdatedAt),
          tickerSymbol: investment.tickerSymbol,
          updatedAt: parseNullableBackupDate(investment.updatedAt),
          userId,
        })
        .returning({ id: investments.id });

      if (insertedInvestment) {
        investmentIdMap.set(investment.id, insertedInvestment.id);
      }
    }

    for (const allocation of backup.data.allocations) {
      const goalId = goalIdMap.get(allocation.goalId);
      const investmentId = investmentIdMap.get(allocation.investmentId);
      if (!goalId || !investmentId) {
        throw new Error(
          "Backup contains an allocation with missing relations.",
        );
      }

      await tx.insert(allocations).values({
        createdAt: parseBackupDate(allocation.createdAt),
        goalId,
        investmentId,
        percentage: allocation.percentage,
        updatedAt: parseNullableBackupDate(allocation.updatedAt),
        userId,
      });
    }

    for (const transaction of backup.data.transactions) {
      const investmentId = investmentIdMap.get(transaction.investmentId);
      if (!investmentId) {
        throw new Error(
          "Backup contains a transaction with missing relations.",
        );
      }

      await tx.insert(transactions).values({
        amountMinor: transaction.amountMinor,
        createdAt: parseBackupDate(transaction.createdAt),
        investmentId,
        nav: transaction.nav,
        notes: transaction.notes,
        transactionDate: parseBackupDate(transaction.transactionDate),
        type: transaction.type,
        units: transaction.units,
        updatedAt: parseNullableBackupDate(transaction.updatedAt),
        userId,
      });
    }
  });

  return {
    allocations: backup.data.allocations.length,
    assumptions: backup.data.assumptions ? 1 : 0,
    goals: backup.data.goals.length,
    importedAt: now.toISOString(),
    investments: backup.data.investments.length,
    transactions: backup.data.transactions.length,
  };
}

function parseBackupDate(value: string) {
  return new Date(value);
}

function parseNullableBackupDate(value: string | null) {
  return value ? parseBackupDate(value) : null;
}

function toNullableIsoDate(value: Date | number | null) {
  return value === null ? null : toIsoDate(value);
}

function toIsoDate(value: Date | number) {
  const date = value instanceof Date ? value : new Date(value * 1000);
  return date.toISOString();
}

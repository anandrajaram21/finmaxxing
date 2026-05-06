import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import {
  allocations,
  goals,
  investments,
  portfolioAssumptions,
  transactions,
} from "@/server/db/schema";

export type SetupStepKey =
  | "assumptions"
  | "goals"
  | "investments"
  | "transactions"
  | "allocations";

export type SetupStepState = {
  actionLabel: string;
  disabled: boolean;
  done: boolean;
  href: string;
  key: SetupStepKey;
  label: string;
  status: string;
};

export type SetupProgress = {
  completed: number;
  nextStep: SetupStepState | null;
  percent: number;
  steps: SetupStepState[];
  total: number;
};

type SetupSnapshot = {
  allocationCount: number;
  assumptionCount: number;
  goalCount: number;
  investmentCount: number;
  mappedSipMinor: number;
  totalMonthlySipMinor: number;
  transactionCount: number;
};

export async function getSetupState(userId: string): Promise<SetupStepState[]> {
  const snapshot = await getSetupSnapshot(userId);
  const hasAssumptions = snapshot.assumptionCount > 0;
  const hasGoals = snapshot.goalCount > 0;
  const hasInvestments = snapshot.investmentCount > 0;
  const hasTransactions = snapshot.transactionCount > 0;
  const hasAllocations =
    snapshot.allocationCount > 0 && snapshot.mappedSipMinor > 0;

  return [
    {
      actionLabel: hasAssumptions ? "Review assumptions" : "Set assumptions",
      disabled: false,
      done: hasAssumptions,
      href: "/assumptions",
      key: "assumptions",
      label: "Set assumptions",
      status: hasAssumptions
        ? "Projection inputs saved"
        : "Choose inflation and return assumptions",
    },
    {
      actionLabel: hasGoals ? "Review goals" : "Add goal",
      disabled: false,
      done: hasGoals,
      href: "/goals",
      key: "goals",
      label: "Add goals",
      status: hasGoals
        ? `${snapshot.goalCount} goal${snapshot.goalCount === 1 ? "" : "s"} saved`
        : "Define at least one target",
    },
    {
      actionLabel: hasInvestments ? "Review investments" : "Add investment",
      disabled: false,
      done: hasInvestments,
      href: "/investments",
      key: "investments",
      label: "Add investments",
      status: hasInvestments
        ? `${snapshot.investmentCount} instrument${
            snapshot.investmentCount === 1 ? "" : "s"
          } tracked`
        : "Add funds, ETFs, stocks, or cash buckets",
    },
    {
      actionLabel: hasTransactions ? "Review ledger" : "Record transaction",
      disabled: !hasInvestments,
      done: hasTransactions,
      href: "/transactions",
      key: "transactions",
      label: "Record transactions",
      status: hasInvestments
        ? hasTransactions
          ? `${snapshot.transactionCount} transaction${
              snapshot.transactionCount === 1 ? "" : "s"
            } recorded`
          : "Record your first buy or sell"
        : "Add an investment first",
    },
    {
      actionLabel: hasAllocations ? "Review allocations" : "Map allocations",
      disabled: !hasGoals || !hasInvestments,
      done: hasAllocations,
      href: "/allocations",
      key: "allocations",
      label: "Map allocations",
      status:
        hasGoals && hasInvestments
          ? hasAllocations
            ? `${formatPercent(
                snapshot.totalMonthlySipMinor > 0
                  ? snapshot.mappedSipMinor / snapshot.totalMonthlySipMinor
                  : 1,
              )} of monthly SIP mapped`
            : "Map investments to goals"
          : "Add goals and investments first",
    },
  ];
}

export async function getSetupProgress(userId: string): Promise<SetupProgress> {
  const steps = await getSetupState(userId);
  const total = steps.length;
  const completed = steps.filter((step) => step.done).length;
  const nextStep =
    steps.find((step) => !step.done && !step.disabled) ??
    steps.find((step) => !step.done) ??
    null;

  return {
    completed,
    nextStep,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    steps,
    total,
  };
}

async function getSetupSnapshot(userId: string): Promise<SetupSnapshot> {
  const [
    assumptionRows,
    goalRows,
    investmentRows,
    allocationRows,
    transactionRows,
  ] = await Promise.all([
    db
      .select({ id: portfolioAssumptions.id })
      .from(portfolioAssumptions)
      .where(eq(portfolioAssumptions.userId, userId))
      .limit(1),
    db.select({ id: goals.id }).from(goals).where(eq(goals.userId, userId)),
    db
      .select({
        id: investments.id,
        isActive: investments.isActive,
        monthlySipMinor: investments.monthlySipMinor,
      })
      .from(investments)
      .where(eq(investments.userId, userId)),
    db
      .select({
        monthlySipMinor: investments.monthlySipMinor,
        percentage: allocations.percentage,
      })
      .from(allocations)
      .innerJoin(investments, eq(allocations.investmentId, investments.id))
      .where(eq(allocations.userId, userId)),
    db
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.userId, userId)),
  ]);

  return {
    allocationCount: allocationRows.length,
    assumptionCount: assumptionRows.length,
    goalCount: goalRows.length,
    investmentCount: investmentRows.length,
    mappedSipMinor: allocationRows.reduce(
      (sum, allocation) =>
        sum + allocation.monthlySipMinor * allocation.percentage,
      0,
    ),
    totalMonthlySipMinor: investmentRows.reduce(
      (sum, investment) =>
        investment.isActive ? sum + investment.monthlySipMinor : sum,
      0,
    ),
    transactionCount: transactionRows.length,
  };
}

function formatPercent(value: number) {
  return value.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: "percent",
  });
}

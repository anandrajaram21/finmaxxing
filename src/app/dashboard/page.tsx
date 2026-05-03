import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import {
  ArrowRightIcon,
  ReceiptIcon,
  TrendUpIcon,
} from "@phosphor-icons/react/ssr";

import { Button } from "@/components/ui/button";
import { Sidebar, WorkspaceContent } from "@/app/_components/finance-workspace";
import { getSession } from "@/server/better-auth/server";
import { db } from "@/server/db";
import {
  allocations,
  goals,
  investments,
  portfolioAssumptions,
  transactions,
} from "@/server/db/schema";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <main className="bg-background text-foreground h-screen overflow-hidden">
      <div className="flex h-full w-full flex-col lg:flex-row">
        <Sidebar activeKey="dashboard" />
        <WorkspaceContent>
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
            <section>
              <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wider uppercase">
                    <TrendUpIcon className="size-4" weight="bold" />
                    Dashboard
                  </div>
                  <h1 className="mt-3 text-3xl font-semibold tracking-normal text-balance sm:text-4xl lg:text-5xl">
                    Money map for the next big decisions.
                  </h1>
                  <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-6">
                    A compact view of goal pressure, portfolio momentum, monthly
                    flow, and the records that need attention.
                  </p>
                </div>
                <Button asChild size="lg" variant="outline">
                  <Link href="/transactions">
                    Add activity
                    <ReceiptIcon className="size-4" weight="bold" />
                  </Link>
                </Button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {data.metrics.map((metric) => (
                  <div
                    className="border-border bg-card/90 text-card-foreground border px-4 py-4 shadow-[0_16px_48px_oklch(0_0_0/0.07)] backdrop-blur"
                    key={metric.label}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-muted-foreground text-xs">
                        {metric.label}
                      </p>
                      <span className={cn("size-2", metric.dot)} />
                    </div>
                    <p className="mt-3 text-3xl font-semibold tracking-normal">
                      {metric.value}
                    </p>
                    <p className="text-muted-foreground mt-2 text-xs">
                      {metric.detail}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 grid gap-6 pb-8 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
              <div className="space-y-6">
                <div className="border-border bg-card text-card-foreground border">
                  <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">
                        Monthly trajectory
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Planned SIP momentum
                      </p>
                    </div>
                    <p className="text-2xl font-semibold tracking-normal">
                      {data.monthlySip}
                    </p>
                  </div>
                  {data.monthlyBars.length > 0 ? (
                    <div className="flex h-64 items-end gap-2 px-4 py-5">
                      {data.monthlyBars.map((bar) => (
                        <div
                          className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2"
                          key={bar.label}
                        >
                          <div className="bg-muted relative min-h-8 overflow-hidden">
                            <div
                              className="absolute inset-x-0 bottom-0 bg-teal-500"
                              style={{ height: `${bar.value}%` }}
                            />
                          </div>
                          <p className="text-muted-foreground truncate text-center text-xs">
                            {bar.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      actionHref="/transactions"
                      actionLabel="Add transaction"
                      title="No transaction history yet"
                    />
                  )}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="border-border bg-card text-card-foreground border">
                    <div className="border-b px-4 py-3">
                      <p className="text-sm font-semibold">Goal funding</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        SIP allocation by target
                      </p>
                    </div>
                    {data.allocationRows.length > 0 ? (
                      <div className="space-y-4 p-4">
                        {data.allocationRows.map((row) => (
                          <div key={row.label}>
                            <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                              <span className="truncate">{row.label}</span>
                              <span className="text-muted-foreground shrink-0">
                                {row.amount}
                              </span>
                            </div>
                            <div className="bg-muted h-2 overflow-hidden">
                              <div
                                className="h-full bg-indigo-500"
                                style={{
                                  width: `${Math.min(100, Math.max(row.value, 6))}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        actionHref="/allocations"
                        actionLabel="Map allocations"
                        title="No goal allocations yet"
                      />
                    )}
                  </div>

                  <div className="border-border bg-card text-card-foreground border">
                    <div className="border-b px-4 py-3">
                      <p className="text-sm font-semibold">Setup health</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Data needed for useful projections
                      </p>
                    </div>
                    <div className="grid gap-2 p-4">
                      {data.checklist.map((item) => (
                        <div
                          className="border-border flex items-center justify-between gap-3 border px-3 py-2"
                          key={item.label}
                        >
                          <span className="truncate text-sm">{item.label}</span>
                          <span
                            className={cn(
                              "px-2 py-1 text-xs font-medium",
                              item.done
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                : "bg-amber-500/10 text-amber-700 dark:text-amber-300",
                            )}
                          >
                            {item.done ? "Done" : "Needs data"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="border-border bg-card text-card-foreground border">
                  <div className="border-b px-4 py-3">
                    <p className="text-sm font-semibold">Closest goals</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Sorted by target year
                    </p>
                  </div>
                  {data.goalRows.length > 0 ? (
                    <div className="divide-border divide-y">
                      {data.goalRows.map((goal) => (
                        <div
                          className="flex items-center justify-between gap-4 px-4 py-3"
                          key={goal.label}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {goal.label}
                            </p>
                            <p className="text-muted-foreground mt-1 text-xs">
                              {goal.year}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold">
                            {goal.amount}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      actionHref="/goals"
                      actionLabel="Add goal"
                      title="No goals yet"
                    />
                  )}
                </div>

                <div className="border-border bg-card text-card-foreground border">
                  <div className="border-b px-4 py-3">
                    <p className="text-sm font-semibold">Recent activity</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Latest ledger entries
                    </p>
                  </div>
                  {data.recentRows.length > 0 ? (
                    <div className="divide-border divide-y">
                      {data.recentRows.map((row) => (
                        <div
                          className="flex items-center justify-between gap-4 px-4 py-3"
                          key={`${row.date}-${row.label}-${row.amount}`}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {row.label}
                            </p>
                            <p className="text-muted-foreground mt-1 text-xs">
                              {row.date}
                            </p>
                          </div>
                          <p
                            className={cn(
                              "shrink-0 text-sm font-semibold",
                              row.type === "sell"
                                ? "text-amber-700 dark:text-amber-300"
                                : "text-emerald-700 dark:text-emerald-300",
                            )}
                          >
                            {row.amount}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      actionHref="/transactions"
                      actionLabel="Add transaction"
                      title="No recent activity"
                    />
                  )}
                </div>
              </div>
            </section>
          </div>
        </WorkspaceContent>
      </div>
    </main>
  );
}

async function getDashboardData() {
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) redirect("/?auth=required");

  const [
    assumptionRows,
    goalRows,
    investmentRows,
    allocationRows,
    transactionRows,
  ] = await Promise.all([
    db
      .select()
      .from(portfolioAssumptions)
      .where(eq(portfolioAssumptions.userId, userId))
      .limit(1),
    db.select().from(goals).where(eq(goals.userId, userId)),
    db.select().from(investments).where(eq(investments.userId, userId)),
    db
      .select({
        goalId: goals.id,
        goalName: goals.name,
        investmentId: investments.id,
        monthlySipMinor: investments.monthlySipMinor,
        percentage: allocations.percentage,
      })
      .from(allocations)
      .innerJoin(goals, eq(allocations.goalId, goals.id))
      .innerJoin(investments, eq(allocations.investmentId, investments.id))
      .where(eq(allocations.userId, userId)),
    db
      .select({
        amountMinor: transactions.amountMinor,
        id: transactions.id,
        investmentId: transactions.investmentId,
        investmentName: investments.name,
        nav: transactions.nav,
        transactionDate: transactions.transactionDate,
        type: transactions.type,
        units: transactions.units,
      })
      .from(transactions)
      .innerJoin(investments, eq(transactions.investmentId, investments.id))
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.transactionDate), desc(transactions.id)),
  ]);

  const totalMonthlySipMinor = investmentRows.reduce(
    (sum, investment) =>
      investment.isActive ? sum + investment.monthlySipMinor : sum,
    0,
  );
  const totalGoalMinor = goalRows.reduce(
    (sum, goal) => sum + goal.targetAmountMinor,
    0,
  );
  const netInvestedMinor = transactionRows.reduce(
    (sum, transaction) =>
      transaction.type === "buy"
        ? sum + transaction.amountMinor
        : sum - transaction.amountMinor,
    0,
  );
  const netUnitsByInvestment = new Map<number, number>();

  for (const transaction of transactionRows) {
    const signedUnits =
      transaction.type === "buy" ? transaction.units : -transaction.units;
    netUnitsByInvestment.set(
      transaction.investmentId,
      (netUnitsByInvestment.get(transaction.investmentId) ?? 0) + signedUnits,
    );
  }

  const currentValueMinor = investmentRows.reduce((sum, investment) => {
    const netUnits = netUnitsByInvestment.get(investment.id) ?? 0;
    if (!investment.currentNav || netUnits <= 0) return sum;

    return sum + Math.round(netUnits * investment.currentNav * 100);
  }, 0);
  const mappedSipMinor = allocationRows.reduce(
    (sum, allocation) =>
      sum + allocation.monthlySipMinor * allocation.percentage,
    0,
  );
  const mappedPercent =
    totalMonthlySipMinor > 0
      ? Math.round((mappedSipMinor / totalMonthlySipMinor) * 100)
      : 0;
  const allocationByGoal = new Map<string, number>();

  for (const allocation of allocationRows) {
    allocationByGoal.set(
      allocation.goalName,
      (allocationByGoal.get(allocation.goalName) ?? 0) +
        allocation.monthlySipMinor * allocation.percentage,
    );
  }

  const dashboardAllocationRows = Array.from(allocationByGoal.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, amountMinor]) => ({
      amount: formatMoney(amountMinor),
      label,
      value:
        mappedSipMinor > 0
          ? Math.round((amountMinor / mappedSipMinor) * 100)
          : 0,
    }));
  const sortedGoals = [...goalRows].sort((a, b) =>
    a.targetYear === b.targetYear
      ? a.name.localeCompare(b.name)
      : a.targetYear - b.targetYear,
  );
  const dashboardGoalRows = sortedGoals.slice(0, 5).map((goal) => ({
    amount: formatMoney(goal.targetAmountMinor),
    label: goal.name,
    year: String(goal.targetYear),
  }));
  const recentRows = transactionRows.slice(0, 5).map((transaction) => ({
    amount: `${transaction.type === "sell" ? "-" : "+"}${formatMoney(
      transaction.amountMinor,
    )}`,
    date: formatDate(transaction.transactionDate),
    label: transaction.investmentName,
    type: transaction.type,
  }));

  return {
    allocationRows: dashboardAllocationRows,
    checklist: [
      { done: assumptionRows.length > 0, label: "Projection assumptions" },
      { done: goalRows.length > 0, label: "At least one goal" },
      { done: investmentRows.length > 0, label: "Investment universe" },
      { done: allocationRows.length > 0, label: "Goal allocations" },
      { done: transactionRows.length > 0, label: "Transaction history" },
    ],
    goalRows: dashboardGoalRows,
    metrics: [
      {
        detail: `${goalRows.length} active targets`,
        dot: "bg-teal-500",
        label: "Goal corpus",
        value: formatMoney(totalGoalMinor),
      },
      {
        detail: `${investmentRows.length} instruments`,
        dot: "bg-cyan-500",
        label: "Current value",
        value: currentValueMinor > 0 ? formatMoney(currentValueMinor) : "n/a",
      },
      {
        detail: `${transactionRows.length} ledger entries`,
        dot: "bg-indigo-500",
        label: "Net invested",
        value: formatMoney(netInvestedMinor),
      },
      {
        detail: `${mappedPercent}% of SIP mapped`,
        dot: "bg-amber-500",
        label: "Monthly SIP",
        value: formatMoney(totalMonthlySipMinor),
      },
    ],
    monthlyBars: getMonthlyTransactionBars(transactionRows),
    monthlySip: formatMoney(totalMonthlySipMinor),
    recentRows,
  };
}

function EmptyState({
  actionHref,
  actionLabel,
  title,
}: {
  actionHref: string;
  actionLabel: string;
  title: string;
}) {
  return (
    <div className="flex min-h-36 flex-col items-start justify-center gap-3 p-4">
      <p className="text-muted-foreground text-sm">{title}</p>
      <Button asChild size="sm" variant="outline">
        <Link href={actionHref}>
          {actionLabel}
          <ArrowRightIcon className="size-4" weight="bold" />
        </Link>
      </Button>
    </div>
  );
}

function getMonthlyTransactionBars(
  transactionRows: {
    amountMinor: number;
    transactionDate: Date | number;
    type: "buy" | "sell";
  }[],
) {
  const today = new Date();
  const months = Array.from({ length: 8 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - 7 + index, 1);

    return {
      amountMinor: 0,
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(date),
    };
  });
  const monthByKey = new Map(months.map((month) => [month.key, month]));

  for (const transaction of transactionRows) {
    const date =
      transaction.transactionDate instanceof Date
        ? transaction.transactionDate
        : new Date(transaction.transactionDate * 1000);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const month = monthByKey.get(key);

    if (!month || transaction.type !== "buy") continue;
    month.amountMinor += transaction.amountMinor;
  }

  const activeMonths = months.filter((month) => month.amountMinor > 0);
  const maxAmountMinor = Math.max(
    ...activeMonths.map((month) => month.amountMinor),
    0,
  );

  if (maxAmountMinor === 0) return [];

  return months.map((month) => ({
    label: month.label,
    value:
      month.amountMinor > 0
        ? Math.max(8, Math.round((month.amountMinor / maxAmountMinor) * 100))
        : 0,
  }));
}

function formatMoney(valueMinor: number) {
  const sign = valueMinor < 0 ? "-" : "";
  const absValue = Math.abs(valueMinor) / 100;

  if (absValue >= 10_000_000) {
    return `${sign}INR ${(absValue / 10_000_000).toFixed(2)}Cr`;
  }

  if (absValue >= 100_000) {
    return `${sign}INR ${(absValue / 100_000).toFixed(1)}L`;
  }

  if (absValue >= 1_000) {
    return `${sign}INR ${Math.round(absValue / 1_000)}k`;
  }

  return `${sign}INR ${Math.round(absValue)}`;
}

function formatDate(value: Date | number) {
  const date = value instanceof Date ? value : new Date(value * 1000);

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import {
  ArrowsSplitIcon,
  ChartLineUpIcon,
  CurrencyInrIcon,
  ReceiptIcon,
  SignOutIcon,
  TargetIcon,
} from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { auth } from "@/server/better-auth";
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
import { ThemeToggle } from "./theme-toggle";
import { ResourceDialog } from "./resource-dialog";
import { ResourceTable } from "./resource-table";

type SectionKey = "goals" | "investments" | "transactions" | "allocations";

type Field = {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
};

type FieldOption = {
  label: string;
  value: string;
};

type FieldOptions = Partial<
  Record<SectionKey, Partial<Record<string, FieldOption[]>>>
>;

type TableColumn = {
  label: string;
  align?: "left" | "right" | "center";
};

type TableRow = {
  cells: string[];
  details?: {
    label: string;
    value: string;
  }[];
  tone?: "normal" | "muted" | "accent";
};

type Stat = {
  label: string;
  value: string;
  detail: string;
};

type Section = {
  key: SectionKey;
  href: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: Icon;
  actionLabel: string;
  stats: Stat[];
  fields: Field[];
  tableColumns: TableColumn[];
  rows: TableRow[];
};

const sections: Record<SectionKey, Section> = {
  goals: {
    key: "goals",
    href: "/goals",
    label: "Goals",
    eyebrow: "Planning",
    title: "Goals",
    description:
      "Define target amounts, target years, and ordering for every financial goal.",
    icon: TargetIcon,
    actionLabel: "Add goal",
    stats: [
      { label: "Active goals", value: "4", detail: "Ordered by priority" },
      {
        label: "Projected need",
        value: "INR 4.27Cr",
        detail: "6% inflation from 2026",
      },
      {
        label: "Monthly investing",
        value: "INR 61k",
        detail: "Static allocated SIP",
      },
    ],
    fields: [
      { label: "Goal name", name: "name", placeholder: "Retirement corpus" },
      {
        label: "Target amount",
        name: "targetAmountMinor",
        placeholder: "5000000",
        type: "number",
      },
      {
        label: "Target year",
        name: "targetYear",
        placeholder: "2034",
        type: "number",
      },
      {
        label: "Sort order",
        name: "sortOrder",
        placeholder: "1",
        type: "number",
      },
    ],
    tableColumns: [
      { label: "Goal" },
      { label: "Goal amount", align: "right" },
      { label: "Projected need", align: "right" },
      { label: "SIP needed", align: "right" },
      { label: "Actual SIP", align: "right" },
      { label: "Year", align: "center" },
    ],
    rows: [
      {
        cells: [
          "Retirement corpus",
          "INR 1.20Cr",
          "INR 3.63Cr",
          "INR 56.8k",
          "INR 41.5k",
          "2045",
        ],
        tone: "accent",
      },
      {
        cells: [
          "Home down payment",
          "INR 35L",
          "INR 44.2L",
          "INR 75.9k",
          "INR 7.5k",
          "2030",
        ],
      },
      {
        cells: [
          "Emergency reserve",
          "INR 12L",
          "INR 12.7L",
          "INR 1.02L",
          "INR 12k",
          "2027",
        ],
      },
      {
        cells: [
          "Travel fund",
          "INR 6L",
          "INR 6.74L",
          "INR 25.7k",
          "INR 0",
          "2028",
        ],
        tone: "muted",
      },
    ],
  },
  investments: {
    key: "investments",
    href: "/investments",
    label: "Investments",
    eyebrow: "Portfolio",
    title: "Investments",
    description:
      "Maintain each instrument, ticker, category, SIP amount, and current NAV.",
    icon: ChartLineUpIcon,
    actionLabel: "Add investment",
    stats: [
      { label: "Instruments", value: "8", detail: "Active holdings" },
      { label: "Monthly SIP", value: "INR 82k", detail: "Across investments" },
      { label: "NAV freshness", value: "2d", detail: "Latest update age" },
    ],
    fields: [
      { label: "Investment name", name: "name", placeholder: "Nifty 50 Index" },
      {
        label: "Ticker symbol",
        name: "tickerSymbol",
        placeholder: "NIFTYBEES",
      },
      { label: "ISIN", name: "isin", placeholder: "INF204KB16I7" },
      { label: "Category", name: "category", placeholder: "Equity index" },
      {
        label: "Monthly SIP",
        name: "monthlySipMinor",
        placeholder: "25000",
        type: "number",
      },
      {
        label: "Current NAV",
        name: "currentNav",
        placeholder: "248.52",
        type: "number",
      },
    ],
    tableColumns: [
      { label: "Mutual fund / stock / ETF name" },
      { label: "Ticker symbol", align: "center" },
      { label: "Avg NAV", align: "right" },
      { label: "Current NAV", align: "right" },
      { label: "Units", align: "right" },
      { label: "Current value", align: "right" },
      { label: "XIRR", align: "right" },
      { label: "SIP amount", align: "right" },
    ],
    rows: [
      {
        cells: [
          "Nifty 50 Index",
          "NIFTYBEES",
          "Equity index",
          "INR 25k",
          "248.52",
        ],
        tone: "accent",
      },
      {
        cells: ["Flexi Cap Fund", "FLEXCAP", "Equity fund", "INR 30k", "92.31"],
      },
      {
        cells: [
          "Short Duration Debt",
          "SDFUND",
          "Debt fund",
          "INR 12k",
          "41.88",
        ],
      },
      { cells: ["Gold ETF", "GOLDBEES", "Commodity", "INR 15k", "63.44"] },
    ],
  },
  transactions: {
    key: "transactions",
    href: "/transactions",
    label: "Transactions",
    eyebrow: "Ledger",
    title: "Transactions",
    description:
      "Record buy and sell activity with amount, units, NAV, notes, and date.",
    icon: ReceiptIcon,
    actionLabel: "Add transaction",
    stats: [
      { label: "This month", value: "9", detail: "Ledger entries" },
      { label: "Invested", value: "INR 1.14L", detail: "Buy transactions" },
      { label: "Avg NAV", value: "86.7", detail: "Weighted entry price" },
    ],
    fields: [
      {
        label: "Investment",
        name: "investmentId",
        placeholder: "Nifty 50 Index",
      },
      {
        label: "Date",
        name: "transactionDate",
        placeholder: "2026-05-01",
        type: "date",
      },
      { label: "Type", name: "type", placeholder: "buy or sell" },
      {
        label: "Amount",
        name: "amountMinor",
        placeholder: "25000",
        type: "number",
      },
      { label: "Units", name: "units", placeholder: "100.596", type: "number" },
      { label: "NAV", name: "nav", placeholder: "248.52", type: "number" },
      { label: "Notes", name: "notes", placeholder: "Monthly SIP" },
    ],
    tableColumns: [
      { label: "Date" },
      { label: "Investment" },
      { label: "Type", align: "center" },
      { label: "Amount", align: "right" },
      { label: "Units", align: "right" },
      { label: "NAV", align: "right" },
    ],
    rows: [
      {
        cells: [
          "2026-05-01",
          "Nifty 50 Index",
          "Buy",
          "INR 25k",
          "100.596",
          "248.52",
        ],
        tone: "accent",
      },
      {
        cells: [
          "2026-05-01",
          "Flexi Cap Fund",
          "Buy",
          "INR 30k",
          "324.64",
          "92.41",
        ],
      },
      {
        cells: ["2026-04-15", "Gold ETF", "Buy", "INR 15k", "236.44", "63.44"],
      },
      {
        cells: ["2026-04-01", "Debt Fund", "Buy", "INR 12k", "286.53", "41.88"],
      },
    ],
  },
  allocations: {
    key: "allocations",
    href: "/allocations",
    label: "Allocations",
    eyebrow: "Mapping",
    title: "Allocations",
    description:
      "Map investments to goals with percentages between 0 and 100 percent.",
    icon: ArrowsSplitIcon,
    actionLabel: "Add allocation",
    stats: [
      {
        label: "Mapped pairs",
        value: "11",
        detail: "Investment to goal links",
      },
      { label: "Largest goal", value: "64%", detail: "Retirement corpus" },
      { label: "Unallocated", value: "6%", detail: "Needs assignment" },
    ],
    fields: [
      {
        label: "Investment",
        name: "investmentId",
        placeholder: "Nifty 50 Index",
      },
      { label: "Goal", name: "goalId", placeholder: "Retirement corpus" },
      {
        label: "Percentage",
        name: "percentage",
        placeholder: "0.70",
        type: "number",
      },
    ],
    tableColumns: [
      { label: "Investment" },
      { label: "Goal" },
      { label: "Allocation", align: "right" },
      { label: "Monthly flow", align: "right" },
    ],
    rows: [
      {
        cells: ["Nifty 50 Index", "Retirement corpus", "70%", "INR 17.5k"],
        tone: "accent",
      },
      { cells: ["Nifty 50 Index", "Home down payment", "30%", "INR 7.5k"] },
      { cells: ["Flexi Cap Fund", "Retirement corpus", "80%", "INR 24k"] },
      { cells: ["Debt Fund", "Emergency reserve", "100%", "INR 12k"] },
    ],
  },
};

const navItems = Object.values(sections);

type SectionData = {
  rows: TableRow[];
  stats: Stat[];
};

type WorkspaceData = {
  fieldOptions: FieldOptions;
  sections: Record<SectionKey, SectionData>;
};

type InvestmentReturn = {
  averageNav: number | null;
  buyCount: number;
  currentValueMinor: number;
  netUnits: number;
  sellCount: number;
  totalBoughtMinor: number;
  totalSoldMinor: number;
  xirr: number | null;
};

export async function FinanceWorkspace({
  fieldOptions,
  sectionKey,
}: {
  fieldOptions?: FieldOptions;
  sectionKey: SectionKey;
}) {
  const workspaceData = await getWorkspaceData();
  const section = {
    ...sections[sectionKey],
    ...workspaceData.sections[sectionKey],
  };
  const sectionFieldOptions = {
    ...fieldOptions?.[sectionKey],
    ...workspaceData.fieldOptions[sectionKey],
  };

  return (
    <main className="bg-background text-foreground h-screen overflow-hidden">
      <div className="flex h-full w-full flex-col lg:flex-row">
        <Sidebar activeKey={sectionKey} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <WorkspaceHeader
            fieldOptions={sectionFieldOptions}
            section={section}
          />
          <section className="min-h-0 flex-1 space-y-6 overflow-auto px-4 py-5 sm:px-6 lg:px-10">
            <StatsGrid stats={section.stats} />
            <ResourceTable
              label={section.label}
              rows={section.rows}
              tableColumns={section.tableColumns}
            />
          </section>
        </div>
      </div>
    </main>
  );
}

async function getWorkspaceData(): Promise<WorkspaceData> {
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) return getEmptyWorkspaceData();

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
        .orderBy(asc(goals.sortOrder), asc(goals.name)),
      db
        .select()
        .from(investments)
        .where(eq(investments.userId, userId))
        .orderBy(asc(investments.name)),
      db
        .select({
          goalId: goals.id,
          goalName: goals.name,
          investmentId: investments.id,
          investmentName: investments.name,
          monthlySipMinor: investments.monthlySipMinor,
          percentage: allocations.percentage,
        })
        .from(allocations)
        .innerJoin(investments, eq(allocations.investmentId, investments.id))
        .innerJoin(goals, eq(allocations.goalId, goals.id))
        .where(eq(allocations.userId, userId))
        .orderBy(asc(investments.name), asc(goals.sortOrder)),
      db
        .select({
          amountMinor: transactions.amountMinor,
          investmentId: investments.id,
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

  const assumption = assumptionRows[0] ?? {
    currentYear: new Date().getFullYear(),
    expectedReturnRate: 0.1,
    inflationRate: 0.06,
  };
  const totalMonthlySipMinor = investmentRows.reduce(
    (sum, investment) =>
      investment.isActive ? sum + investment.monthlySipMinor : sum,
    0,
  );
  const allocatedSipByGoal = new Map<number, number>();
  const allocatedPercentByInvestment = new Map<number, number>();

  for (const allocation of allocationRows) {
    const monthlyFlowMinor = allocation.monthlySipMinor * allocation.percentage;
    allocatedSipByGoal.set(
      allocation.goalId,
      (allocatedSipByGoal.get(allocation.goalId) ?? 0) + monthlyFlowMinor,
    );
    allocatedPercentByInvestment.set(
      allocation.investmentId,
      (allocatedPercentByInvestment.get(allocation.investmentId) ?? 0) +
        allocation.percentage,
    );
  }

  const projectedGoalRows = goalRows.map((goal) => {
    const projectedNeedMinor = projectAmountMinor(
      goal.targetAmountMinor,
      goal.targetYear,
      assumption.currentYear,
      assumption.inflationRate,
    );

    return {
      ...goal,
      actualSipMinor: allocatedSipByGoal.get(goal.id) ?? 0,
      projectedNeedMinor,
      sipNeededMinor: getMonthlyInvestmentNeededMinor(
        projectedNeedMinor,
        goal.targetYear,
        assumption.currentYear,
        assumption.expectedReturnRate,
      ),
    };
  });

  const totalProjectedNeedMinor = projectedGoalRows.reduce(
    (sum, goal) => sum + goal.projectedNeedMinor,
    0,
  );
  const latestNavUpdatedAt = investmentRows.reduce<Date | null>(
    (latest, investment) => {
      if (!investment.navUpdatedAt) return latest;
      const updatedAt = toDate(investment.navUpdatedAt);
      return !latest || updatedAt > latest ? updatedAt : latest;
    },
    null,
  );
  const buyTransactions = txRows.filter((transaction) => {
    return transaction.type === "buy";
  });
  const totalBuyAmountMinor = buyTransactions.reduce(
    (sum, transaction) => sum + transaction.amountMinor,
    0,
  );
  const totalBuyUnits = buyTransactions.reduce(
    (sum, transaction) => sum + transaction.units,
    0,
  );
  const weightedAverageNav =
    totalBuyUnits > 0 ? totalBuyAmountMinor / 100 / totalBuyUnits : 0;
  const investmentReturns = new Map<number, InvestmentReturn>();

  for (const investment of investmentRows) {
    const investmentTransactions = txRows.filter(
      (transaction) => transaction.investmentId === investment.id,
    );
    const netUnits = investmentTransactions.reduce((sum, transaction) => {
      return transaction.type === "buy"
        ? sum + transaction.units
        : sum - transaction.units;
    }, 0);
    const investmentBuyTransactions = investmentTransactions.filter(
      (transaction) => transaction.type === "buy",
    );
    const investmentSellTransactions = investmentTransactions.filter(
      (transaction) => transaction.type === "sell",
    );
    const totalBoughtMinor = investmentBuyTransactions.reduce(
      (sum, transaction) => sum + transaction.amountMinor,
      0,
    );
    const totalBoughtUnits = investmentBuyTransactions.reduce(
      (sum, transaction) => sum + transaction.units,
      0,
    );
    const totalSoldMinor = investmentSellTransactions.reduce(
      (sum, transaction) => sum + transaction.amountMinor,
      0,
    );
    const averageNav =
      totalBoughtUnits > 0 ? totalBoughtMinor / 100 / totalBoughtUnits : null;
    const currentValueMinor =
      investment.currentNav && netUnits > 0
        ? Math.round(netUnits * investment.currentNav * 100)
        : 0;
    const terminalDate = investment.navUpdatedAt
      ? toDate(investment.navUpdatedAt)
      : new Date();
    const cashFlows = [
      ...investmentTransactions.map((transaction) => ({
        amount:
          transaction.type === "buy"
            ? -transaction.amountMinor
            : transaction.amountMinor,
        date: toDate(transaction.transactionDate),
      })),
      ...(currentValueMinor > 0
        ? [{ amount: currentValueMinor, date: terminalDate }]
        : []),
    ];

    investmentReturns.set(investment.id, {
      averageNav,
      buyCount: investmentBuyTransactions.length,
      currentValueMinor,
      netUnits,
      sellCount: investmentSellTransactions.length,
      totalBoughtMinor,
      totalSoldMinor,
      xirr: calculateXirr(cashFlows),
    });
  }

  const portfolioCashFlows = [
    ...txRows.map((transaction) => ({
      amount:
        transaction.type === "buy"
          ? -transaction.amountMinor
          : transaction.amountMinor,
      date: toDate(transaction.transactionDate),
    })),
    ...investmentRows.flatMap((investment) => {
      const investmentReturn = investmentReturns.get(investment.id);
      if (!investmentReturn || investmentReturn.currentValueMinor <= 0) {
        return [];
      }

      return [
        {
          amount: investmentReturn.currentValueMinor,
          date: investment.navUpdatedAt
            ? toDate(investment.navUpdatedAt)
            : new Date(),
        },
      ];
    }),
  ];
  const portfolioXirr = calculateXirr(portfolioCashFlows);
  const currentMonthTransactions = txRows.filter((transaction) =>
    isInCurrentMonth(toDate(transaction.transactionDate)),
  );
  const investedThisMonthMinor = currentMonthTransactions.reduce(
    (sum, transaction) =>
      transaction.type === "buy" ? sum + transaction.amountMinor : sum,
    0,
  );
  const flowByGoalName = new Map<string, number>();
  for (const allocation of allocationRows) {
    flowByGoalName.set(
      allocation.goalName,
      (flowByGoalName.get(allocation.goalName) ?? 0) +
        allocation.monthlySipMinor * allocation.percentage,
    );
  }
  const largestGoal = Array.from(flowByGoalName.entries()).sort(
    (a, b) => b[1] - a[1],
  )[0];
  const allocatedMonthlySipMinor = investmentRows.reduce((sum, investment) => {
    const allocatedPercent = Math.min(
      allocatedPercentByInvestment.get(investment.id) ?? 0,
      1,
    );
    return sum + investment.monthlySipMinor * allocatedPercent;
  }, 0);
  const unallocatedPercent =
    totalMonthlySipMinor > 0
      ? Math.max(0, 1 - allocatedMonthlySipMinor / totalMonthlySipMinor)
      : 0;

  const investmentOptions = investmentRows.map((investment) => ({
    label: investment.name,
    value: String(investment.id),
  }));
  const goalOptions = goalRows.map((goal) => ({
    label: goal.name,
    value: String(goal.id),
  }));

  return {
    fieldOptions: {
      allocations: {
        goalId: goalOptions,
        investmentId: investmentOptions,
      },
      transactions: {
        investmentId: investmentOptions,
        type: [
          { label: "Buy", value: "buy" },
          { label: "Sell", value: "sell" },
        ],
      },
    },
    sections: {
      allocations: {
        stats: [
          {
            detail: "Investment to goal links",
            label: "Mapped pairs",
            value: String(allocationRows.length),
          },
          {
            detail: largestGoal?.[0] ?? "No mapped goal",
            label: "Largest goal",
            value: largestGoal
              ? formatPercent(largestGoal[1] / totalMonthlySipMinor)
              : "0%",
          },
          {
            detail: "Needs assignment",
            label: "Unallocated",
            value: formatPercent(unallocatedPercent),
          },
        ],
        rows: allocationRows.map((allocation, index) => ({
          cells: [
            allocation.investmentName,
            allocation.goalName,
            formatPercent(allocation.percentage),
            formatInrMinor(allocation.monthlySipMinor * allocation.percentage),
          ],
          tone: index === 0 ? "accent" : "normal",
        })),
      },
      goals: {
        stats: [
          {
            detail: "Ordered by priority",
            label: "Active goals",
            value: String(goalRows.length),
          },
          {
            detail: `${formatPercent(assumption.inflationRate)} inflation from ${
              assumption.currentYear
            }`,
            label: "Projected need",
            value: formatInrMinor(totalProjectedNeedMinor),
          },
          {
            detail: "Across active investments",
            label: "Monthly investing",
            value: formatInrMinor(totalMonthlySipMinor),
          },
        ],
        rows: projectedGoalRows.map((goal, index) => ({
          cells: [
            goal.name,
            formatInrMinor(goal.targetAmountMinor),
            formatInrMinor(goal.projectedNeedMinor),
            formatInrMinor(goal.sipNeededMinor),
            formatInrMinor(goal.actualSipMinor),
            String(goal.targetYear),
          ],
          tone:
            index === 0
              ? "accent"
              : goal.actualSipMinor === 0
                ? "muted"
                : "normal",
        })),
      },
      investments: {
        stats: [
          {
            detail: "Active holdings",
            label: "Instruments",
            value: String(
              investmentRows.filter((investment) => investment.isActive).length,
            ),
          },
          {
            detail: "Across investments",
            label: "Monthly SIP",
            value: formatInrMinor(totalMonthlySipMinor),
          },
          {
            detail: latestNavUpdatedAt
              ? `Latest NAV ${formatDate(latestNavUpdatedAt)}`
              : "Needs transactions and NAVs",
            label: "Portfolio XIRR",
            value: formatXirr(portfolioXirr),
          },
        ],
        rows: investmentRows.map((investment, index) => ({
          ...getInvestmentRow(
            investment,
            investmentReturns.get(investment.id),
            index,
          ),
        })),
      },
      transactions: {
        stats: [
          {
            detail: "Ledger entries",
            label: "This month",
            value: String(currentMonthTransactions.length),
          },
          {
            detail: "Buy transactions this month",
            label: "Invested",
            value: formatInrMinor(investedThisMonthMinor),
          },
          {
            detail: "Weighted entry price",
            label: "Avg NAV",
            value: weightedAverageNav > 0 ? weightedAverageNav.toFixed(1) : "0",
          },
        ],
        rows: txRows.map((transaction, index) => ({
          cells: [
            formatDate(toDate(transaction.transactionDate)),
            transaction.investmentName,
            toTitleCase(transaction.type),
            formatInrMinor(transaction.amountMinor),
            transaction.units.toFixed(3),
            transaction.nav.toFixed(2),
          ],
          tone: index === 0 ? "accent" : "normal",
        })),
      },
    },
  };
}

function getInvestmentRow(
  investment: typeof investments.$inferSelect,
  investmentReturn: InvestmentReturn | undefined,
  index: number,
): TableRow {
  const averageNav = investmentReturn?.averageNav ?? null;
  const currentValueMinor = investmentReturn?.currentValueMinor ?? 0;
  const netUnits = investmentReturn?.netUnits ?? 0;
  const xirr = investmentReturn?.xirr ?? null;

  return {
    cells: [
      investment.name,
      investment.tickerSymbol,
      formatNav(averageNav),
      formatNav(investment.currentNav ?? null),
      formatUnits(netUnits),
      formatInrMinor(currentValueMinor),
      formatXirr(xirr),
      formatInrMinor(investment.monthlySipMinor),
    ],
    details: [
      { label: "Name", value: investment.name },
      { label: "Ticker symbol", value: investment.tickerSymbol },
      { label: "Category", value: investment.category ?? "Uncategorised" },
      { label: "ISIN", value: investment.isin ?? "n/a" },
      { label: "Average NAV", value: formatNav(averageNav) },
      { label: "Current NAV", value: formatNav(investment.currentNav ?? null) },
      { label: "Units", value: formatUnits(netUnits) },
      { label: "Current value", value: formatInrMinor(currentValueMinor) },
      { label: "XIRR", value: formatXirr(xirr) },
      {
        label: "SIP amount",
        value: formatInrMinor(investment.monthlySipMinor),
      },
      {
        label: "Total bought",
        value: formatInrMinor(investmentReturn?.totalBoughtMinor ?? 0),
      },
      {
        label: "Total sold",
        value: formatInrMinor(investmentReturn?.totalSoldMinor ?? 0),
      },
      {
        label: "Transactions",
        value: `${investmentReturn?.buyCount ?? 0} buy / ${
          investmentReturn?.sellCount ?? 0
        } sell`,
      },
      {
        label: "NAV updated",
        value: investment.navUpdatedAt
          ? formatDate(toDate(investment.navUpdatedAt))
          : "n/a",
      },
      { label: "Status", value: investment.isActive ? "Active" : "Inactive" },
    ],
    tone: index === 0 ? "accent" : investment.isActive ? "normal" : "muted",
  };
}

function getEmptyWorkspaceData(): WorkspaceData {
  const emptyStats: Stat[] = [
    { detail: "Sign in to load records", label: "Records", value: "0" },
    { detail: "No saved data", label: "Monthly SIP", value: "INR 0" },
    { detail: "No saved data", label: "Status", value: "n/a" },
  ];

  return {
    fieldOptions: {},
    sections: {
      allocations: { rows: [], stats: emptyStats },
      goals: { rows: [], stats: emptyStats },
      investments: { rows: [], stats: emptyStats },
      transactions: { rows: [], stats: emptyStats },
    },
  };
}

function projectAmountMinor(
  amountMinor: number,
  targetYear: number,
  currentYear: number,
  inflationRate: number,
) {
  const years = Math.max(0, targetYear - currentYear);
  return Math.round(amountMinor * Math.pow(1 + inflationRate, years));
}

function getMonthlyInvestmentNeededMinor(
  targetAmountMinor: number,
  targetYear: number,
  currentYear: number,
  expectedReturnRate: number,
) {
  const months = Math.max(0, (targetYear - currentYear) * 12);
  if (months === 0) return targetAmountMinor;

  const monthlyReturnRate = expectedReturnRate / 12;
  if (monthlyReturnRate === 0) return Math.round(targetAmountMinor / months);

  return Math.round(
    (targetAmountMinor * monthlyReturnRate) /
      (Math.pow(1 + monthlyReturnRate, months) - 1),
  );
}

type CashFlow = {
  amount: number;
  date: Date;
};

function calculateXirr(cashFlows: CashFlow[]) {
  const validCashFlows = cashFlows.filter((cashFlow) => cashFlow.amount !== 0);
  const hasInflow = validCashFlows.some((cashFlow) => cashFlow.amount > 0);
  const hasOutflow = validCashFlows.some((cashFlow) => cashFlow.amount < 0);
  const firstDate = validCashFlows[0]?.date;

  if (!firstDate || !hasInflow || !hasOutflow) return null;

  const hasDistinctDates = validCashFlows.some(
    (cashFlow) => cashFlow.date.getTime() !== firstDate.getTime(),
  );
  if (!hasDistinctDates) return null;

  const npvAt = (rate: number) =>
    validCashFlows.reduce((sum, cashFlow) => {
      const years =
        (cashFlow.date.getTime() - firstDate.getTime()) / 31_557_600_000;
      return sum + cashFlow.amount / Math.pow(1 + rate, years);
    }, 0);

  let low = -0.9999;
  let high = 1;
  let lowValue = npvAt(low);
  let highValue = npvAt(high);

  for (let index = 0; index < 100 && lowValue * highValue > 0; index += 1) {
    high *= 2;
    highValue = npvAt(high);
  }

  if (!Number.isFinite(lowValue) || !Number.isFinite(highValue)) return null;
  if (lowValue * highValue > 0) return null;

  for (let index = 0; index < 100; index += 1) {
    const mid = (low + high) / 2;
    const midValue = npvAt(mid);

    if (!Number.isFinite(midValue)) return null;
    if (Math.abs(midValue) < 0.01) return mid;

    if (lowValue * midValue <= 0) {
      high = mid;
      highValue = midValue;
    } else {
      low = mid;
      lowValue = midValue;
    }
  }

  return (low + high) / 2;
}

function formatInrMinor(amountMinor: number) {
  const amount = amountMinor / 100;

  if (amount >= 10_000_000)
    return `INR ${formatCompact(amount / 10_000_000)}Cr`;
  if (amount >= 100_000) return `INR ${formatCompact(amount / 100_000)}L`;
  if (amount >= 1_000) return `INR ${formatCompact(amount / 1_000)}k`;

  return `INR ${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

function formatCompact(value: number) {
  return value.toLocaleString("en-IN", {
    maximumFractionDigits: value >= 10 ? 1 : 2,
    minimumFractionDigits: 0,
  });
}

function formatNav(value: number | null) {
  if (value === null) return "n/a";

  return value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatUnits(value: number) {
  return value.toLocaleString("en-IN", {
    maximumFractionDigits: 3,
    minimumFractionDigits: 0,
  });
}

function formatXirr(value: number | null) {
  if (value === null) return "n/a";

  return value.toLocaleString("en-IN", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
    style: "percent",
  });
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isInCurrentMonth(date: Date) {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function toDate(value: Date | number) {
  if (value instanceof Date) return value;
  return new Date(value * 1000);
}

function toTitleCase(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

async function Sidebar({ activeKey }: { activeKey: SectionKey }) {
  const session = await getSession();

  return (
    <aside className="border-border bg-sidebar/70 flex min-h-0 w-full flex-col border-b lg:h-full lg:w-68 lg:border-r lg:border-b-0">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-4 lg:block">
        <Link href="/goals" className="flex items-center gap-3">
          <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-sm">
            <CurrencyInrIcon className="size-5" weight="bold" />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-wide">
              Finmaxxing
            </span>
            <span className="text-muted-foreground block text-xs">
              Portfolio workspace
            </span>
          </span>
        </Link>
        <div className="lg:hidden">
          <AuthAction signedIn={Boolean(session)} />
        </div>
      </div>

      <nav className="grid grid-cols-2 gap-1 p-2 sm:grid-cols-4 lg:grid-cols-1 lg:p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === activeKey;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex h-10 items-center gap-2 rounded-sm px-3 text-sm transition",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4" weight={isActive ? "bold" : "regular"} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t p-3 lg:shrink-0">
        <div className="mb-3">
          <ThemeToggle />
        </div>
        {session ? (
          <div className="space-y-3">
            <div>
              <p className="truncate text-sm font-medium">
                {session.user?.name ?? "Signed in"}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {session.user?.email}
              </p>
            </div>
            <AuthAction signedIn />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-muted-foreground text-xs">
              Sign in to save portfolio records to your account.
            </p>
            <AuthAction signedIn={false} />
          </div>
        )}
      </div>
    </aside>
  );
}

function WorkspaceHeader({
  fieldOptions,
  section,
}: {
  fieldOptions?: Partial<Record<string, FieldOption[]>>;
  section: Section;
}) {
  const Icon = section.icon;

  return (
    <header className="border-border flex flex-col gap-4 border-b px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
      <div className="min-w-0">
        <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wider uppercase">
          <Icon className="size-4" weight="bold" />
          <span>{section.eyebrow}</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal sm:text-3xl">
          {section.title}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
          {section.description}
        </p>
      </div>
      <ResourceDialog
        actionLabel={section.actionLabel}
        fieldOptions={fieldOptions}
        fields={section.fields}
        label={section.label}
      />
    </header>
  );
}

function StatsGrid({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="border-border bg-card text-card-foreground px-4 py-3"
        >
          <p className="text-muted-foreground text-xs">{stat.label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-normal">
            {stat.value}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">{stat.detail}</p>
        </div>
      ))}
    </div>
  );
}

function AuthAction({ signedIn }: { signedIn: boolean }) {
  if (signedIn) {
    return (
      <form>
        <Button
          className="w-full justify-center"
          formAction={async () => {
            "use server";
            await auth.api.signOut({
              headers: await headers(),
            });
            redirect("/");
          }}
          variant="outline"
        >
          <SignOutIcon className="size-4" />
          Sign out
        </Button>
      </form>
    );
  }

  return (
    <form>
      <Button
        className="w-full justify-center"
        formAction={async () => {
          "use server";
          const res = await auth.api.signInSocial({
            body: {
              provider: "google",
              callbackURL: "/goals",
            },
          });
          if (!res.url) {
            throw new Error("No URL returned from signInSocial");
          }
          redirect(res.url);
        }}
      >
        Sign in
      </Button>
    </form>
  );
}

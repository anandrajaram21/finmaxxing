import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  ArrowsSplitIcon,
  BookOpenTextIcon,
  ChartLineUpIcon,
  ReceiptIcon,
  SlidersHorizontalIcon,
  TargetIcon,
  TrendUpIcon,
} from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";

import { getSession } from "@/server/better-auth/server";
import { db } from "@/server/db";
import {
  allocations,
  goals,
  investments,
  portfolioAssumptions,
  transactions,
} from "@/server/db/schema";
import {
  getInvestmentMarketQuotes,
  type InvestmentMarketQuote,
} from "@/server/yahoo-finance";
import {
  getSetupProgress,
  type SetupStepState,
} from "@/server/finance/setup-state";
import { AllocationCreateDialog } from "./allocation-create-dialog";
import { GoalCreateDialog } from "./goal-create-dialog";
import { InvestmentCreateDialog } from "./investment-create-dialog";
import { numberDisplay, type NumberDisplayValue } from "./number-popover";
import { TransactionCreateDialog } from "./transaction-create-dialog";
import { ResourceDialog } from "./resource-dialog";
import { ResourceTable, type TableRowAction } from "./resource-table";
import {
  MetricStrip,
  WorkspacePageHeader,
  WorkspaceShell,
  type Metric,
} from "./workspace-shell";

export type SectionKey =
  | "dashboard"
  | "goals"
  | "investments"
  | "transactions"
  | "allocations"
  | "assumptions"
  | "instructions";

type WorkspaceSectionKey = Exclude<
  SectionKey,
  "assumptions" | "dashboard" | "instructions"
>;

type Field = {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  type?: string;
};

type FieldOption = {
  allocatedPercent?: number;
  currentNav?: number | null;
  label: string;
  monthlySipMinor?: number;
  value: string;
};

type FieldOptions = Partial<
  Record<SectionKey, Partial<Record<string, FieldOption[]>>>
>;

type TableColumn = {
  label: string;
  align?: "left" | "right" | "center";
};

type TableCell =
  | string
  | NumberDisplayValue
  | {
      currentMinor: number;
      kind: "progress";
      totalMinor: number;
    };

type TableRow = {
  action?: TableRowAction;
  cells: TableCell[];
  details?: {
    label: string;
    value: string | NumberDisplayValue;
  }[];
  tone?: "normal" | "muted" | "accent";
};

type Stat = Metric;

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

type WorkspaceSection = Section & {
  key: WorkspaceSectionKey;
};

const sectionActions: Record<
  WorkspaceSectionKey,
  (formData: FormData) => Promise<void>
> = {
  allocations: saveAllocation,
  goals: saveGoal,
  investments: saveInvestment,
  transactions: saveTransaction,
};

const sections: Record<SectionKey, Section> = {
  dashboard: {
    key: "dashboard",
    href: "/dashboard",
    label: "Dashboard",
    eyebrow: "Overview",
    title: "Dashboard",
    description:
      "Review goal pressure, portfolio momentum, monthly flow, and setup health.",
    icon: TrendUpIcon,
    actionLabel: "Open dashboard",
    stats: [
      { label: "Goal corpus", value: "INR 0", detail: "Active targets" },
      { label: "Current value", value: "n/a", detail: "Tracked holdings" },
      { label: "Monthly SIP", value: "INR 0", detail: "Mapped flow" },
    ],
    fields: [],
    tableColumns: [],
    rows: [],
  },
  goals: {
    key: "goals",
    href: "/goals",
    label: "Goals",
    eyebrow: "Planning",
    title: "Goals",
    description:
      "Define target amounts and target years for every financial goal.",
    icon: TargetIcon,
    actionLabel: "Add goal",
    stats: [
      { label: "Active goals", value: "4", detail: "Sorted by target year" },
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
    ],
    tableColumns: [
      { label: "Goal name" },
      { label: "Amount needed", align: "right" },
      { label: "Amount saved", align: "right" },
    ],
    rows: [
      {
        cells: [
          "Retirement corpus",
          "INR 3.63Cr",
          { currentMinor: 9250000, kind: "progress", totalMinor: 36300000 },
        ],
        tone: "accent",
      },
      {
        cells: [
          "Home down payment",
          "INR 44.2L",
          { currentMinor: 820000, kind: "progress", totalMinor: 4420000 },
        ],
      },
      {
        cells: [
          "Emergency reserve",
          "INR 12.7L",
          { currentMinor: 510000, kind: "progress", totalMinor: 1270000 },
        ],
      },
      {
        cells: [
          "Travel fund",
          "INR 6.74L",
          { currentMinor: 0, kind: "progress", totalMinor: 674000 },
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
      "Maintain each instrument, ticker symbol, and recurring SIP amount.",
    icon: ChartLineUpIcon,
    actionLabel: "Add investment",
    stats: [
      { label: "Instruments", value: "8", detail: "Active holdings" },
      { label: "Monthly SIP", value: "INR 82k", detail: "Across investments" },
      { label: "NAV freshness", value: "2d", detail: "Latest update age" },
    ],
    fields: [
      {
        label: "Mutual fund / stock / ETF name",
        name: "name",
        placeholder: "Nifty 50 Index",
      },
      {
        label: "Ticker symbol",
        name: "tickerSymbol",
        placeholder: "NIFTYBEES",
      },
      {
        label: "SIP amount",
        name: "monthlySipMinor",
        placeholder: "25000",
        type: "number",
      },
    ],
    tableColumns: [
      { label: "Fund name" },
      { label: "Invested", align: "right" },
      { label: "Current value", align: "right" },
      { label: "XIRR", align: "right" },
    ],
    rows: [
      {
        cells: ["Nifty 50 Index", "INR 2.1L", "INR 2.5L", "12.4%"],
        tone: "accent",
      },
      { cells: ["Flexi Cap Fund", "INR 1.6L", "INR 1.8L", "10.1%"] },
      { cells: ["Short Duration Debt", "INR 80k", "INR 84k", "7.2%"] },
      { cells: ["Gold ETF", "INR 65k", "INR 72k", "8.6%"] },
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
      {
        label: "Notes",
        name: "notes",
        placeholder: "Monthly SIP",
        required: false,
      },
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
  assumptions: {
    key: "assumptions",
    href: "/assumptions",
    label: "Assumptions",
    eyebrow: "Model",
    title: "Assumptions",
    description:
      "Define the base year, inflation rate, and expected return used in projections.",
    icon: SlidersHorizontalIcon,
    actionLabel: "Update assumptions",
    stats: [
      { label: "Base year", value: "2026", detail: "Projection start" },
      { label: "Inflation", value: "6%", detail: "Annual assumption" },
      { label: "Expected return", value: "10%", detail: "Annual assumption" },
    ],
    fields: [
      {
        label: "Base year",
        name: "currentYear",
        placeholder: "2026",
        type: "number",
      },
      {
        label: "Inflation rate",
        name: "inflationRate",
        placeholder: "6",
        type: "number",
      },
      {
        label: "Expected return",
        name: "expectedReturnRate",
        placeholder: "10",
        type: "number",
      },
    ],
    tableColumns: [
      { label: "Base year", align: "center" },
      { label: "Inflation", align: "right" },
      { label: "Expected return", align: "right" },
    ],
    rows: [],
  },
  instructions: {
    key: "instructions",
    href: "/instructions",
    label: "Instructions",
    eyebrow: "Guide",
    title: "Instructions",
    description:
      "Learn the portfolio workflow and how each page fits together.",
    icon: BookOpenTextIcon,
    actionLabel: "Read guide",
    stats: [
      { label: "Setup", value: "5 steps", detail: "From assumptions to goals" },
      { label: "Tracking", value: "NAV", detail: "Prices come from tickers" },
      { label: "Progress", value: "Live", detail: "Allocations drive goals" },
    ],
    fields: [],
    tableColumns: [],
    rows: [],
  },
};

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

type InvestmentWithMarketQuote = typeof investments.$inferSelect & {
  marketQuote: InvestmentMarketQuote | null;
};

async function saveGoal(formData: FormData) {
  "use server";

  const userId = await getRequiredUserId();
  const name = parseText(formData.get("name"), "Goal name");
  const targetAmountMinor = parseMoneyMinor(
    formData.get("targetAmountMinor"),
    "Target amount",
  );
  const targetYear = parsePositiveInteger(
    formData.get("targetYear"),
    "Target year",
  );

  await db
    .insert(goals)
    .values({
      name,
      targetAmountMinor,
      targetYear,
      userId,
    })
    .onConflictDoUpdate({
      set: {
        targetAmountMinor,
        targetYear,
        updatedAt: new Date(),
      },
      target: [goals.userId, goals.name],
    });

  revalidateWorkspace();
  redirect("/goals");
}

async function saveInvestment(formData: FormData) {
  "use server";

  const userId = await getRequiredUserId();
  const currentNav = parseOptionalPositiveNumber(
    formData.get("currentNav"),
    "Current NAV",
  );

  await db
    .insert(investments)
    .values({
      category: parseOptionalText(formData.get("category")),
      currentNav,
      isin: parseOptionalText(formData.get("isin")),
      monthlySipMinor: parseMoneyMinor(
        formData.get("monthlySipMinor"),
        "Monthly SIP",
      ),
      name: parseText(formData.get("name"), "Investment name"),
      navUpdatedAt: currentNav ? new Date() : null,
      tickerSymbol: parseText(formData.get("tickerSymbol"), "Ticker symbol"),
      userId,
    })
    .onConflictDoUpdate({
      set: {
        category: parseOptionalText(formData.get("category")),
        currentNav,
        isin: parseOptionalText(formData.get("isin")),
        monthlySipMinor: parseMoneyMinor(
          formData.get("monthlySipMinor"),
          "Monthly SIP",
        ),
        name: parseText(formData.get("name"), "Investment name"),
        navUpdatedAt: currentNav ? new Date() : null,
        updatedAt: new Date(),
      },
      target: [investments.userId, investments.tickerSymbol],
    });

  revalidateWorkspace();
  redirect("/investments");
}

async function saveTransaction(formData: FormData) {
  "use server";

  const userId = await getRequiredUserId();
  const investmentId = parsePositiveInteger(
    formData.get("investmentId"),
    "Investment",
  );
  await assertInvestmentBelongsToUser(investmentId, userId);

  await db.insert(transactions).values({
    amountMinor: parseMoneyMinor(formData.get("amountMinor"), "Amount"),
    investmentId,
    nav: parsePositiveNumber(formData.get("nav"), "NAV"),
    notes: parseOptionalText(formData.get("notes")),
    transactionDate: parseDate(formData.get("transactionDate"), "Date"),
    type: parseTransactionType(formData.get("type")),
    units: parsePositiveNumber(formData.get("units"), "Units"),
    userId,
  });

  revalidateWorkspace();
  redirect("/transactions");
}

async function saveAllocation(formData: FormData) {
  "use server";

  const userId = await getRequiredUserId();
  const goalId = parsePositiveInteger(formData.get("goalId"), "Goal");
  const investmentId = parsePositiveInteger(
    formData.get("investmentId"),
    "Investment",
  );
  await Promise.all([
    assertGoalBelongsToUser(goalId, userId),
    assertInvestmentBelongsToUser(investmentId, userId),
  ]);

  const percentage = parseAllocationPercentage(formData.get("percentage"));

  await db
    .insert(allocations)
    .values({
      goalId,
      investmentId,
      percentage,
      userId,
    })
    .onConflictDoUpdate({
      set: {
        percentage,
        updatedAt: new Date(),
      },
      target: [allocations.investmentId, allocations.goalId],
    });

  revalidateWorkspace();
  redirect("/allocations");
}

export async function FinanceWorkspace({
  fieldOptions,
  sectionKey,
}: {
  fieldOptions?: FieldOptions;
  sectionKey: WorkspaceSectionKey;
}) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/?auth=required");

  const workspaceData = await getWorkspaceData(sectionKey);
  const setupProgress = await getSetupProgress(session.user.id);
  const section = {
    ...sections[sectionKey],
    ...workspaceData.sections[sectionKey],
  } as WorkspaceSection;
  const sectionFieldOptions = {
    ...fieldOptions?.[sectionKey],
    ...workspaceData.fieldOptions[sectionKey],
  };
  const emptyState = getSectionEmptyState(section.key, setupProgress.nextStep);
  const renderAction = () => (
    <WorkspaceCreateAction
      fieldOptions={sectionFieldOptions}
      section={section}
    />
  );

  return (
    <WorkspaceShell activeKey={sectionKey} action={renderAction()}>
      <WorkspacePageHeader
        action={renderAction()}
        description={section.description}
        eyebrow={section.eyebrow}
        icon={section.icon}
        title={section.title}
      />
      <MetricStrip metrics={section.stats} />
      <ResourceTable
        emptyState={emptyState}
        label={section.label}
        rows={section.rows}
        tableColumns={section.tableColumns}
      />
    </WorkspaceShell>
  );
}

async function getWorkspaceData(
  sectionKey: WorkspaceSectionKey,
): Promise<WorkspaceData> {
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
        .orderBy(asc(goals.targetYear), asc(goals.name)),
      db
        .select()
        .from(investments)
        .where(eq(investments.userId, userId))
        .orderBy(asc(investments.name)),
      db
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
        .where(eq(allocations.userId, userId))
        .orderBy(asc(investments.name), asc(goals.targetYear), asc(goals.name)),
      db
        .select({
          amountMinor: transactions.amountMinor,
          id: transactions.id,
          investmentId: transactions.investmentId,
          investmentName: investments.name,
          nav: transactions.nav,
          notes: transactions.notes,
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
  const marketQuotes =
    sectionKey === "goals" ||
    sectionKey === "investments" ||
    sectionKey === "transactions"
      ? await getInvestmentMarketQuotes(
          investmentRows.map((investment) => investment.tickerSymbol),
        )
      : new Map<string, InvestmentMarketQuote>();
  const investmentsWithMarketQuotes = investmentRows.map((investment) => {
    const marketQuote =
      marketQuotes.get(investment.tickerSymbol.trim()) ?? null;

    return {
      ...investment,
      currentNav: marketQuote?.price ?? investment.currentNav,
      marketQuote,
      navUpdatedAt:
        marketQuote?.regularMarketTime ?? investment.navUpdatedAt ?? null,
    };
  });
  const totalMonthlySipMinor = investmentsWithMarketQuotes.reduce(
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
  const latestNavUpdatedAt = investmentsWithMarketQuotes.reduce<Date | null>(
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

  for (const investment of investmentsWithMarketQuotes) {
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
    const netInvestedMinor = Math.max(0, totalBoughtMinor - totalSoldMinor);
    const currentValueMinor =
      investment.currentNav && netUnits > 0
        ? Math.round(netUnits * investment.currentNav * 100)
        : netInvestedMinor;
    const transactionDates = investmentTransactions.map((transaction) =>
      toDate(transaction.transactionDate),
    );
    const terminalDate = getValuationDate(
      investment.navUpdatedAt ? toDate(investment.navUpdatedAt) : new Date(),
      transactionDates,
    );
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

  const totalInvestedMinor = Array.from(investmentReturns.values()).reduce(
    (sum, investmentReturn) =>
      sum +
      Math.max(
        0,
        investmentReturn.totalBoughtMinor - investmentReturn.totalSoldMinor,
      ),
    0,
  );
  const totalCurrentValueMinor = Array.from(investmentReturns.values()).reduce(
    (sum, investmentReturn) => sum + investmentReturn.currentValueMinor,
    0,
  );
  const savedByGoal = new Map<number, number>();
  for (const allocation of allocationRows) {
    const currentValueMinor =
      investmentReturns.get(allocation.investmentId)?.currentValueMinor ?? 0;

    savedByGoal.set(
      allocation.goalId,
      (savedByGoal.get(allocation.goalId) ?? 0) +
        Math.round(currentValueMinor * allocation.percentage),
    );
  }

  const portfolioCashFlows = [
    ...txRows.map((transaction) => ({
      amount:
        transaction.type === "buy"
          ? -transaction.amountMinor
          : transaction.amountMinor,
      date: toDate(transaction.transactionDate),
    })),
    ...investmentsWithMarketQuotes.flatMap((investment) => {
      const investmentReturn = investmentReturns.get(investment.id);
      if (!investmentReturn || investmentReturn.currentValueMinor <= 0) {
        return [];
      }

      return [
        {
          amount: investmentReturn.currentValueMinor,
          date: getValuationDate(
            investment.navUpdatedAt
              ? toDate(investment.navUpdatedAt)
              : new Date(),
            txRows
              .filter(
                (transaction) => transaction.investmentId === investment.id,
              )
              .map((transaction) => toDate(transaction.transactionDate)),
          ),
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
  const allocatedMonthlySipMinor = investmentsWithMarketQuotes.reduce(
    (sum, investment) => {
      const allocatedPercent = Math.min(
        allocatedPercentByInvestment.get(investment.id) ?? 0,
        1,
      );
      return sum + investment.monthlySipMinor * allocatedPercent;
    },
    0,
  );
  const unallocatedPercent =
    totalMonthlySipMinor > 0
      ? Math.max(0, 1 - allocatedMonthlySipMinor / totalMonthlySipMinor)
      : 0;

  const investmentOptions = investmentsWithMarketQuotes.map((investment) => ({
    allocatedPercent: allocatedPercentByInvestment.get(investment.id) ?? 0,
    currentNav: investment.currentNav,
    label: investment.name,
    monthlySipMinor: investment.monthlySipMinor,
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
      dashboard: {
        rows: [],
        stats: [],
      },
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
          action: {
            goalOptions,
            id: allocation.id,
            investmentOptions,
            kind: "allocation",
            values: {
              goalId: allocation.goalId,
              investmentId: allocation.investmentId,
              percentage: allocation.percentage,
            },
          },
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
            detail: "Sorted by target year",
            label: "Active goals",
            value: String(goalRows.length),
          },
          {
            detail: `${formatPercentText(
              assumption.inflationRate,
            )} inflation from ${assumption.currentYear}`,
            label: "Projected need",
            value: formatInrMinor(totalProjectedNeedMinor),
          },
          {
            detail: "Across active investments",
            label: "Monthly investing",
            value: formatInrMinor(totalMonthlySipMinor),
          },
        ],
        rows: projectedGoalRows.map((goal, index) => {
          const savedMinor = savedByGoal.get(goal.id) ?? 0;

          return {
            action: {
              id: goal.id,
              kind: "goal",
              values: {
                name: goal.name,
                targetAmountMinor: goal.targetAmountMinor,
                targetYear: goal.targetYear,
              },
            },
            cells: [
              goal.name,
              formatInrMinor(goal.projectedNeedMinor),
              {
                currentMinor: savedMinor,
                kind: "progress",
                totalMinor: goal.projectedNeedMinor,
              },
            ],
            details: [
              {
                label: "Goal amount",
                value: formatInrMinor(goal.targetAmountMinor),
              },
              {
                label: "SIP needed",
                value: formatInrMinor(goal.sipNeededMinor),
              },
              {
                label: "Allocated monthly SIP",
                value: formatInrMinor(goal.actualSipMinor),
              },
              { label: "Target year", value: String(goal.targetYear) },
            ],
            tone:
              index === 0 ? "accent" : savedMinor === 0 ? "muted" : "normal",
          };
        }),
      },
      investments: {
        stats: [
          {
            detail: `${buyTransactions.length} buy transactions`,
            label: "Total invested",
            value: formatInrMinor(totalInvestedMinor),
          },
          {
            detail: `${investmentsWithMarketQuotes.length} tracked instruments`,
            label: "Current value",
            value: formatInrMinor(totalCurrentValueMinor),
          },
          {
            detail: latestNavUpdatedAt
              ? `Latest NAV ${formatDate(latestNavUpdatedAt)}`
              : "Needs transactions and NAVs",
            label: "Portfolio XIRR",
            value: formatXirr(portfolioXirr),
          },
        ],
        rows: investmentsWithMarketQuotes.map((investment, index) => ({
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
        rows: txRows.map((transaction, index) => {
          const transactionDate = toDate(transaction.transactionDate);

          return {
            action: {
              id: transaction.id,
              investmentOptions,
              kind: "transaction",
              values: {
                amountMinor: transaction.amountMinor,
                investmentId: transaction.investmentId,
                nav: transaction.nav,
                notes: transaction.notes,
                transactionDate: formatDate(transactionDate),
                type: transaction.type,
                units: transaction.units,
              },
            },
            cells: [
              formatDate(transactionDate),
              transaction.investmentName,
              toTitleCase(transaction.type),
              formatInrMinor(transaction.amountMinor),
              transaction.units.toFixed(3),
              transaction.nav.toFixed(2),
            ],
            tone: index === 0 ? "accent" : "normal",
          };
        }),
      },
      assumptions: {
        stats: [
          {
            detail: "Projection start",
            label: "Base year",
            value: String(assumption.currentYear),
          },
          {
            detail: "Annual assumption",
            label: "Inflation",
            value: formatPercent(assumption.inflationRate),
          },
          {
            detail: "Annual assumption",
            label: "Expected return",
            value: formatPercent(assumption.expectedReturnRate),
          },
        ],
        rows: [
          {
            cells: [
              String(assumption.currentYear),
              formatPercent(assumption.inflationRate),
              formatPercent(assumption.expectedReturnRate),
            ],
            tone: "accent",
          },
        ],
      },
      instructions: {
        rows: [],
        stats: [],
      },
    },
  };
}

function getInvestmentRow(
  investment: InvestmentWithMarketQuote,
  investmentReturn: InvestmentReturn | undefined,
  index: number,
): TableRow {
  const averageNav = investmentReturn?.averageNav ?? null;
  const currentValueMinor = investmentReturn?.currentValueMinor ?? 0;
  const investedMinor = Math.max(
    0,
    (investmentReturn?.totalBoughtMinor ?? 0) -
      (investmentReturn?.totalSoldMinor ?? 0),
  );
  const netUnits = investmentReturn?.netUnits ?? 0;
  const xirr = investmentReturn?.xirr ?? null;
  const navUpdatedAt = investment.navUpdatedAt
    ? toDate(investment.navUpdatedAt)
    : null;
  const navSource = investment.marketQuote
    ? `Yahoo ${investment.marketQuote.yahooSymbol}`
    : "Saved value";

  return {
    action: {
      id: investment.id,
      kind: "investment",
      values: {
        monthlySipMinor: investment.monthlySipMinor,
        name: investment.name,
        tickerSymbol: investment.tickerSymbol,
      },
    },
    cells: [
      investment.name,
      formatInrMinor(investedMinor),
      formatInrMinor(currentValueMinor),
      formatXirr(xirr),
    ],
    details: [
      { label: "Ticker symbol", value: investment.tickerSymbol },
      { label: "Average NAV", value: formatNav(averageNav) },
      { label: "Current NAV", value: formatNav(investment.currentNav ?? null) },
      { label: "NAV source", value: navSource },
      {
        label: "NAV updated",
        value: navUpdatedAt ? formatDate(navUpdatedAt) : "n/a",
      },
      {
        label: "Currency",
        value: investment.marketQuote?.currency ?? "n/a",
      },
      { label: "Units", value: formatUnits(netUnits) },
      {
        label: "SIP amount",
        value: formatInrMinor(investment.monthlySipMinor),
      },
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
      assumptions: { rows: [], stats: emptyStats },
      dashboard: { rows: [], stats: emptyStats },
      goals: { rows: [], stats: emptyStats },
      instructions: { rows: [], stats: emptyStats },
      investments: { rows: [], stats: emptyStats },
      transactions: { rows: [], stats: emptyStats },
    },
  };
}

async function getRequiredUserId() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/?auth=required");

  return session.user.id;
}

async function assertGoalBelongsToUser(goalId: number, userId: string) {
  const rows = await db
    .select({ id: goals.id })
    .from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .limit(1);

  if (!rows[0]) throw new Error("Selected goal was not found.");
}

async function assertInvestmentBelongsToUser(
  investmentId: number,
  userId: string,
) {
  const rows = await db
    .select({ id: investments.id })
    .from(investments)
    .where(
      and(eq(investments.id, investmentId), eq(investments.userId, userId)),
    )
    .limit(1);

  if (!rows[0]) throw new Error("Selected investment was not found.");
}

function parseText(value: FormDataEntryValue | null, label: string) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} is required.`);
  }

  return value.trim();
}

function parseOptionalText(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return null;

  return value.trim();
}

function parsePositiveInteger(value: FormDataEntryValue | null, label: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }

  return parsed;
}

function parsePositiveNumber(value: FormDataEntryValue | null, label: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive number.`);
  }

  return parsed;
}

function parseOptionalPositiveNumber(
  value: FormDataEntryValue | null,
  label: string,
) {
  if (typeof value !== "string" || value.trim() === "") return null;

  return parsePositiveNumber(value, label);
}

function parseMoneyMinor(value: FormDataEntryValue | null, label: string) {
  const amount = parsePositiveNumber(value, label);
  return Math.round(amount * 100);
}

function parseAllocationPercentage(value: FormDataEntryValue | null) {
  const parsed = parsePositiveNumber(value, "Percentage");
  const percentage = parsed > 1 ? parsed / 100 : parsed;

  if (percentage <= 0 || percentage > 1) {
    throw new Error("Percentage must be between 0 and 100.");
  }

  return percentage;
}

function parseDate(value: FormDataEntryValue | null, label: string) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} is required.`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} must be a valid date.`);
  }

  return date;
}

function parseTransactionType(value: FormDataEntryValue | null) {
  if (value === "buy" || value === "sell") return value;

  throw new Error("Transaction type must be buy or sell.");
}

function revalidateWorkspace() {
  revalidatePath("/goals");
  revalidatePath("/investments");
  revalidatePath("/transactions");
  revalidatePath("/allocations");
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
  const validCashFlows = cashFlows
    .filter((cashFlow) => cashFlow.amount !== 0)
    .map((cashFlow) => ({
      amount: cashFlow.amount,
      date: toStartOfUtcDay(cashFlow.date),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const hasInflow = validCashFlows.some((cashFlow) => cashFlow.amount > 0);
  const hasOutflow = validCashFlows.some((cashFlow) => cashFlow.amount < 0);
  const firstDate = validCashFlows[0]?.date;
  const lastDate = validCashFlows.at(-1)?.date;

  if (!firstDate || !lastDate || !hasInflow || !hasOutflow) return null;

  const daySpan = getDaySpan(firstDate, lastDate);
  if (daySpan < 30) return null;

  const npvAt = (rate: number) =>
    validCashFlows.reduce((sum, cashFlow) => {
      const years = getDaySpan(firstDate, cashFlow.date) / 365.2425;
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

  const result = (low + high) / 2;
  if (!Number.isFinite(result) || Math.abs(result) > 10) return null;

  return result;
}

function getValuationDate(valuationDate: Date, transactionDates: Date[]) {
  const latestTransactionDate = transactionDates.reduce<Date | null>(
    (latest, transactionDate) =>
      !latest || transactionDate > latest ? transactionDate : latest,
    null,
  );

  if (!latestTransactionDate || valuationDate >= latestTransactionDate) {
    return valuationDate;
  }

  return latestTransactionDate;
}

function toStartOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function getDaySpan(startDate: Date, endDate: Date) {
  return Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000);
}

function formatInrMinor(amountMinor: number) {
  const amount = amountMinor / 100;
  const full = `INR ${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  })}`;

  if (amount >= 10_000_000)
    return numberDisplay(`INR ${formatCompact(amount / 10_000_000)}Cr`, full);
  if (amount >= 100_000)
    return numberDisplay(`INR ${formatCompact(amount / 100_000)}L`, full);
  if (amount >= 1_000)
    return numberDisplay(`INR ${formatCompact(amount / 1_000)}k`, full);

  return numberDisplay(
    `INR ${amount.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`,
    full,
  );
}

function formatCompact(value: number) {
  return value.toLocaleString("en-IN", {
    maximumFractionDigits: value >= 10 ? 1 : 2,
    minimumFractionDigits: 0,
  });
}

function formatNav(value: number | null) {
  if (value === null) return "n/a";

  const formatted = value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  return numberDisplay(formatted, formatted);
}

function formatPercent(value: number) {
  return numberDisplay(`${Math.round(value * 100)}%`, formatPercentText(value));
}

function formatPercentText(value: number) {
  return value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    style: "percent",
  });
}

function formatUnits(value: number) {
  const formatted = value.toLocaleString("en-IN", {
    maximumFractionDigits: 3,
    minimumFractionDigits: 0,
  });
  return numberDisplay(formatted, formatted);
}

function formatXirr(value: number | null) {
  if (value === null) return "n/a";

  const formatted = value.toLocaleString("en-IN", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
    style: "percent",
  });
  const full = value.toLocaleString("en-IN", {
    maximumFractionDigits: 4,
    minimumFractionDigits: 0,
    style: "percent",
  });

  return numberDisplay(formatted, full);
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

function WorkspaceCreateAction({
  fieldOptions,
  section,
}: {
  fieldOptions?: Partial<Record<string, FieldOption[]>>;
  section: WorkspaceSection;
}) {
  const action = sectionActions[section.key];

  if (section.key === "goals") {
    return (
      <GoalCreateDialog
        actionLabel={section.actionLabel}
        label={section.label}
      />
    );
  }

  if (section.key === "investments") {
    return (
      <InvestmentCreateDialog
        actionLabel={section.actionLabel}
        label={section.label}
      />
    );
  }

  if (section.key === "transactions") {
    return (
      <TransactionCreateDialog
        actionLabel={section.actionLabel}
        investmentOptions={fieldOptions?.investmentId ?? []}
        label={section.label}
      />
    );
  }

  if (section.key === "allocations") {
    return (
      <AllocationCreateDialog
        actionLabel={section.actionLabel}
        goalOptions={fieldOptions?.goalId ?? []}
        investmentOptions={fieldOptions?.investmentId ?? []}
        label={section.label}
      />
    );
  }

  return (
    <ResourceDialog
      action={action}
      actionLabel={section.actionLabel}
      fieldOptions={fieldOptions}
      fields={section.fields}
      label={section.label}
    />
  );
}

function getSectionEmptyState(
  sectionKey: WorkspaceSectionKey,
  nextStep: SetupStepState | null,
) {
  const nextAction =
    nextStep && !nextStep.disabled
      ? {
          actionHref: nextStep.href,
          actionLabel: nextStep.actionLabel,
        }
      : null;
  const fallback = {
    actionHref: sections[sectionKey].href,
    actionLabel: sections[sectionKey].actionLabel,
    description: sections[sectionKey].description,
    title: `No ${sections[sectionKey].label.toLowerCase()} yet`,
  };

  if (!nextStep) return fallback;

  const emptyStates: Record<
    WorkspaceSectionKey,
    {
      actionHref: string;
      actionLabel: string;
      description: string;
      title: string;
    }
  > = {
    allocations: {
      actionHref: nextAction?.actionHref ?? "/allocations",
      actionLabel: nextAction?.actionLabel ?? "Map allocations",
      description:
        "Allocations connect each investment to the goals it funds. Add goals and investments first, then map percentages.",
      title: "Map investments to goals",
    },
    goals: {
      actionHref: nextAction?.actionHref ?? "/goals",
      actionLabel: nextAction?.actionLabel ?? "Add goal",
      description:
        "Goals turn your plan into targets. Add the amount in today's money and the year you need it.",
      title: "Start with a financial target",
    },
    investments: {
      actionHref: nextAction?.actionHref ?? "/investments",
      actionLabel: nextAction?.actionLabel ?? "Add investment",
      description:
        "Add each fund, ETF, stock, or cash bucket with the Yahoo Finance ticker and monthly SIP.",
      title: "Create your investment universe",
    },
    transactions: {
      actionHref: nextAction?.actionHref ?? "/transactions",
      actionLabel: nextAction?.actionLabel ?? "Add transaction",
      description:
        "Transactions create units, invested value, current value, and XIRR. Add an investment before recording activity.",
      title: "Record activity to unlock performance",
    },
  };

  return emptyStates[sectionKey] ?? fallback;
}

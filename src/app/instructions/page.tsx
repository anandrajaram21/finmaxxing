import {
  ArrowsSplitIcon,
  BookOpenTextIcon,
  ChartLineUpIcon,
  ReceiptIcon,
  SlidersHorizontalIcon,
  TargetIcon,
} from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";

import { Sidebar } from "@/app/_components/finance-workspace";

type GuideStep = {
  body: string;
  icon: Icon;
  label: string;
  title: string;
};

const workflowSteps: GuideStep[] = [
  {
    body: "Set the base year, inflation rate, and expected return. Goal projections and required SIP estimates use these assumptions.",
    icon: SlidersHorizontalIcon,
    label: "01",
    title: "Set assumptions",
  },
  {
    body: "Add each financial target with today's target amount and target year. The app projects the future amount needed using inflation.",
    icon: TargetIcon,
    label: "02",
    title: "Add goals",
  },
  {
    body: "Add every fund, ETF, or stock with its ticker symbol and monthly SIP. Yahoo Finance is used to fetch the current NAV where possible.",
    icon: ChartLineUpIcon,
    label: "03",
    title: "Add investments",
  },
  {
    body: "Record buys and sells with date, investment, amount, and NAV. Units are calculated automatically from amount divided by NAV.",
    icon: ReceiptIcon,
    label: "04",
    title: "Record transactions",
  },
  {
    body: "Map investments to goals with percentages. Goal progress is calculated from current investment value multiplied by these allocations.",
    icon: ArrowsSplitIcon,
    label: "05",
    title: "Allocate to goals",
  },
];

const referenceItems = [
  {
    title: "Ticker symbols",
    body: "Use the Yahoo Finance ticker for each investment. For Indian exchange symbols without a suffix, the app also tries NSE and BSE variants.",
  },
  {
    title: "Current value",
    body: "Current value is units held multiplied by current NAV. If NAV is unavailable, the app falls back to net invested amount.",
  },
  {
    title: "XIRR",
    body: "XIRR uses dated cash flows from transactions and the latest current value. Very short periods show n/a because annualized returns are misleading.",
  },
  {
    title: "Goal progress",
    body: "A goal's saved amount is the allocated share of each investment's current value. Check allocation percentages if progress looks unexpected.",
  },
];

export default function InstructionsPage() {
  return (
    <main className="bg-background text-foreground h-screen overflow-hidden">
      <div className="flex h-full w-full flex-col lg:flex-row">
        <Sidebar activeKey="instructions" />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="border-border flex flex-col gap-4 border-b px-4 py-5 sm:px-6 lg:px-10">
            <div className="min-w-0">
              <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wider uppercase">
                <BookOpenTextIcon className="size-4" weight="bold" />
                <span>Guide</span>
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-normal sm:text-3xl">
                Instructions
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
                Use this workflow to keep goals, investments, transactions, and
                allocations consistent.
              </p>
            </div>
          </header>

          <section className="min-h-0 flex-1 overflow-auto px-4 py-5 sm:px-6 lg:px-10">
            <div className="grid gap-3 sm:grid-cols-3">
              <GuideStat
                detail="Assumptions, goals, investments"
                label="Start with"
                value="Setup"
              />
              <GuideStat
                detail="Buys, sells, NAV, units"
                label="Maintain"
                value="Ledger"
              />
              <GuideStat
                detail="Allocations update goal savings"
                label="Review"
                value="Progress"
              />
            </div>

            <section className="mt-6">
              <h2 className="text-sm font-semibold">Recommended workflow</h2>
              <div className="mt-3 grid gap-3 lg:grid-cols-5">
                {workflowSteps.map((step) => (
                  <GuideStepCard key={step.label} step={step} />
                ))}
              </div>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <div className="border-border bg-card text-card-foreground border">
                <div className="border-b px-4 py-3">
                  <h2 className="text-sm font-semibold">Working routine</h2>
                </div>
                <div className="grid gap-4 p-4 text-sm leading-6">
                  <InstructionBlock
                    body="Update assumptions when your planning model changes. Keep the base year current if you want projections to start from a new year."
                    title="1. Keep planning inputs current"
                  />
                  <InstructionBlock
                    body="Add or revise goals before changing allocations. This keeps the allocation page focused on mapping money to real targets."
                    title="2. Maintain goals first"
                  />
                  <InstructionBlock
                    body="Use tickers that Yahoo Finance recognizes. Current NAV is pulled from the ticker and used for current value, XIRR, and goal progress."
                    title="3. Check investment tickers"
                  />
                  <InstructionBlock
                    body="For each buy or sell, enter amount and NAV. Units are calculated automatically, and transaction dates determine return calculations."
                    title="4. Record transactions promptly"
                  />
                  <InstructionBlock
                    body="Allocate each investment across goals until the intended percentage is mapped. Unallocated SIP shows money that still needs assignment."
                    title="5. Review allocations"
                  />
                </div>
              </div>

              <div className="border-border bg-card text-card-foreground border">
                <div className="border-b px-4 py-3">
                  <h2 className="text-sm font-semibold">Reference</h2>
                </div>
                <div className="divide-border divide-y">
                  {referenceItems.map((item) => (
                    <div key={item.title} className="p-4">
                      <h3 className="text-sm font-semibold">{item.title}</h3>
                      <p className="text-muted-foreground mt-1 text-sm leading-6">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}

function GuideStat({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <div className="border-border bg-card text-card-foreground px-4 py-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-normal">{value}</p>
      <p className="text-muted-foreground mt-1 text-xs">{detail}</p>
    </div>
  );
}

function GuideStepCard({ step }: { step: GuideStep }) {
  const Icon = step.icon;

  return (
    <article className="border-border bg-card text-card-foreground border p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground text-xs font-medium">
          {step.label}
        </span>
        <Icon className="text-muted-foreground size-4" weight="bold" />
      </div>
      <h3 className="mt-3 text-sm font-semibold">{step.title}</h3>
      <p className="text-muted-foreground mt-2 text-sm leading-6">
        {step.body}
      </p>
    </article>
  );
}

function InstructionBlock({ body, title }: { body: string; title: string }) {
  return (
    <section>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1">{body}</p>
    </section>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRightIcon,
  ArrowsSplitIcon,
  BookOpenTextIcon,
  ChartLineUpIcon,
  ReceiptIcon,
  SlidersHorizontalIcon,
  TargetIcon,
} from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import {
  StatusBadge,
  WorkspacePageHeader,
  WorkspaceShell,
} from "@/app/_components/workspace-shell";
import { getSession } from "@/server/better-auth/server";
import {
  getSetupProgress,
  type SetupStepKey,
} from "@/server/finance/setup-state";

type ReferenceItem = {
  body: string;
  icon: Icon;
  key: SetupStepKey;
  title: string;
};

const referenceItems: ReferenceItem[] = [
  {
    body: "Set the base year, inflation rate, and expected return used by goal projections.",
    icon: SlidersHorizontalIcon,
    key: "assumptions",
    title: "Assumptions",
  },
  {
    body: "Add each target with an amount in today's money and the year you need it.",
    icon: TargetIcon,
    key: "goals",
    title: "Goals",
  },
  {
    body: "Track funds, ETFs, stocks, or cash buckets with tickers and monthly SIPs.",
    icon: ChartLineUpIcon,
    key: "investments",
    title: "Investments",
  },
  {
    body: "Record buys and sells. Units are calculated from amount divided by NAV.",
    icon: ReceiptIcon,
    key: "transactions",
    title: "Transactions",
  },
  {
    body: "Map investment percentages to goals so current value rolls into goal progress.",
    icon: ArrowsSplitIcon,
    key: "allocations",
    title: "Allocations",
  },
];

export default async function InstructionsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/?auth=required");

  const setupProgress = await getSetupProgress(session.user.id);
  const nextStep = setupProgress.nextStep;

  return (
    <WorkspaceShell
      activeKey="instructions"
      action={
        nextStep ? (
          <Button asChild size="sm">
            <Link href={nextStep.href}>
              {nextStep.actionLabel}
              <ArrowRightIcon className="size-4" weight="bold" />
            </Link>
          </Button>
        ) : null
      }
    >
      <WorkspacePageHeader
        action={
          nextStep ? (
            <Button asChild size="sm">
              <Link href={nextStep.href}>
                {nextStep.actionLabel}
                <ArrowRightIcon className="size-4" weight="bold" />
              </Link>
            </Button>
          ) : null
        }
        description="A short operational guide tied to your current setup progress."
        eyebrow="Guide"
        icon={BookOpenTextIcon}
        title="Instructions"
      />

      <section className="border-border bg-card text-card-foreground mb-4 rounded-md border">
        <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Setup progress</h2>
              <StatusBadge tone={nextStep ? "warning" : "good"}>
                {setupProgress.completed}/{setupProgress.total} complete
              </StatusBadge>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Finish these steps in order for the dashboard to become useful.
            </p>
          </div>
        </div>
        <div className="bg-border grid gap-px sm:grid-cols-5">
          {setupProgress.steps.map((step) => (
            <Link
              aria-disabled={step.disabled}
              className={`bg-card min-w-0 p-3 transition ${
                step.disabled
                  ? "pointer-events-none opacity-55"
                  : "hover:bg-muted/50"
              }`}
              href={step.href}
              key={step.key}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-semibold">{step.label}</p>
                <StatusBadge tone={step.done ? "good" : "neutral"}>
                  {step.done ? "Done" : "Open"}
                </StatusBadge>
              </div>
              <p className="text-muted-foreground mt-2 text-xs leading-5">
                {step.status}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-5">
        {referenceItems.map((item) => {
          const Icon = item.icon;
          const step = setupProgress.steps.find(
            (candidate) => candidate.key === item.key,
          );

          return (
            <article
              className="border-border bg-card text-card-foreground rounded-md border p-4"
              key={item.key}
            >
              <div className="flex items-center justify-between gap-3">
                <Icon className="text-muted-foreground size-4" weight="bold" />
                {step ? (
                  <StatusBadge tone={step.done ? "good" : "neutral"}>
                    {step.done ? "Done" : "Open"}
                  </StatusBadge>
                ) : null}
              </div>
              <h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                {item.body}
              </p>
              {step ? (
                step.disabled ? (
                  <Button
                    className="mt-4 w-full"
                    disabled
                    size="sm"
                    variant="outline"
                  >
                    {step.actionLabel}
                  </Button>
                ) : (
                  <Button
                    asChild
                    className="mt-4 w-full"
                    size="sm"
                    variant="outline"
                  >
                    <Link href={step.href}>{step.actionLabel}</Link>
                  </Button>
                )
              ) : null}
            </article>
          );
        })}
      </section>
    </WorkspaceShell>
  );
}

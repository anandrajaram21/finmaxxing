import Link from "next/link";
import {
  ArrowRightIcon,
  ArrowsSplitIcon,
  ChartLineUpIcon,
  CurrencyInrIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  TargetIcon,
  TrendUpIcon,
} from "@phosphor-icons/react/ssr";

import { AuthAction } from "@/app/_components/auth-action";
import { ThemeToggle } from "@/app/_components/theme-toggle";
import { StatusBadge } from "@/app/_components/workspace-shell";
import { Button } from "@/components/ui/button";
import { getSession } from "@/server/better-auth/server";

const setupPreview = [
  {
    icon: SlidersHorizontalIcon,
    label: "Assumptions",
    status: "Set model",
  },
  {
    icon: TargetIcon,
    label: "Goals",
    status: "Add targets",
  },
  {
    icon: ChartLineUpIcon,
    label: "Investments",
    status: "Track SIPs",
  },
  {
    icon: ReceiptIcon,
    label: "Transactions",
    status: "Record units",
  },
  {
    icon: ArrowsSplitIcon,
    label: "Allocations",
    status: "Map progress",
  },
];

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await getSession();
  const params = await searchParams;
  const authRequired = params.auth === "required";
  const signedIn = Boolean(session?.user?.id);

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        <header className="border-border flex items-center justify-between gap-4 border-b py-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
              <CurrencyInrIcon className="size-5" weight="bold" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                Finmaxxing
              </span>
              <span className="text-muted-foreground block truncate text-xs">
                Private portfolio workspace
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {signedIn ? (
              <Button asChild size="sm">
                <Link href="/dashboard">
                  Dashboard
                  <ArrowRightIcon className="size-4" weight="bold" />
                </Link>
              </Button>
            ) : (
              <AuthAction signedIn={false} />
            )}
          </div>
        </header>

        {authRequired ? (
          <div className="border-border bg-card text-card-foreground mt-4 flex flex-col gap-3 rounded-md border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300">
                <ShieldCheckIcon className="size-4" weight="bold" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Sign in required</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Your dashboard and portfolio records are private.
                </p>
              </div>
            </div>
            <AuthAction className="w-full sm:w-auto" signedIn={false} />
          </div>
        ) : null}

        <section className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(420px,1.15fr)]">
          <div className="max-w-2xl">
            <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wider uppercase">
              <ShieldCheckIcon className="size-4" weight="bold" />
              Private finance tracker
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal text-balance sm:text-5xl">
              Finmaxxing
            </h1>
            <p className="text-muted-foreground mt-4 max-w-xl text-sm leading-7 sm:text-base">
              A dense workspace for goals, investments, transactions,
              allocations, and projection assumptions.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {signedIn ? (
                <Button asChild size="lg">
                  <Link href="/dashboard">
                    Open dashboard
                    <ArrowRightIcon className="size-4" weight="bold" />
                  </Link>
                </Button>
              ) : (
                <AuthAction callbackURL="/dashboard" signedIn={false} />
              )}
              <Button asChild size="lg" variant="outline">
                <Link href="/instructions">
                  View setup guide
                  <ArrowRightIcon className="size-4" weight="bold" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="border-border bg-card text-card-foreground rounded-md border">
            <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Workspace preview</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Guided setup and tracking surface
                </p>
              </div>
              <StatusBadge tone="warning">3/5 setup</StatusBadge>
            </div>

            <div className="bg-border grid gap-px sm:grid-cols-4">
              {[
                { label: "Goal corpus", value: "INR 1.2Cr" },
                { label: "Current value", value: "INR 8.4L" },
                { label: "Monthly SIP", value: "INR 62k" },
                { label: "Mapped", value: "78%" },
              ].map((metric) => (
                <div className="bg-card px-4 py-3" key={metric.label}>
                  <p className="text-muted-foreground text-xs">
                    {metric.label}
                  </p>
                  <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 p-4 lg:grid-cols-[1fr_0.85fr]">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Setup path</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      What to do next
                    </p>
                  </div>
                  <StatusBadge tone="good">Private</StatusBadge>
                </div>
                <div className="grid gap-2">
                  {setupPreview.map((item, index) => {
                    const Icon = item.icon;

                    return (
                      <div
                        className="border-border flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                        key={item.label}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-md">
                            <Icon className="size-4" weight="bold" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">
                              {item.label}
                            </span>
                            <span className="text-muted-foreground block truncate text-xs">
                              {item.status}
                            </span>
                          </span>
                        </span>
                        <StatusBadge tone={index < 3 ? "good" : "neutral"}>
                          {index < 3 ? "Done" : "Open"}
                        </StatusBadge>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-border bg-background rounded-md border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Monthly flow</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      SIP allocation
                    </p>
                  </div>
                  <TrendUpIcon className="text-primary size-5" weight="bold" />
                </div>
                <div className="mt-5 space-y-4">
                  {[
                    ["Retirement", "64%", "bg-teal-500"],
                    ["Home", "22%", "bg-indigo-500"],
                    ["Reserve", "14%", "bg-amber-500"],
                  ].map(([label, value, color]) => (
                    <div key={label}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                        <span>{label}</span>
                        <span className="text-muted-foreground">{value}</span>
                      </div>
                      <div className="bg-muted h-2 overflow-hidden rounded-sm">
                        <div
                          className={`${color} h-full`}
                          style={{ width: value }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

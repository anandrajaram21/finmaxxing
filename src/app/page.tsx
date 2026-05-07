import Link from "next/link";
import {
  ArrowRightIcon,
  ArrowsSplitIcon,
  ChartLineUpIcon,
  CurrencyInrIcon,
  GaugeIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  SparkleIcon,
  TargetIcon,
  TrendUpIcon,
} from "@phosphor-icons/react/ssr";

import { Button } from "@/components/ui/button";
import { AuthAction } from "@/app/_components/auth-action";
import { ThemeToggle } from "@/app/_components/theme-toggle";
import { getSession } from "@/server/better-auth/server";

const quickLinks = [
  {
    href: "/dashboard",
    icon: TrendUpIcon,
    label: "Dashboard",
    meta: "Overview, health, flow",
  },
  {
    href: "/goals",
    icon: TargetIcon,
    label: "Goals",
    meta: "Corpus, dates, progress",
  },
  {
    href: "/investments",
    icon: ChartLineUpIcon,
    label: "Investments",
    meta: "Funds, tickers, SIPs",
  },
  {
    href: "/transactions",
    icon: ReceiptIcon,
    label: "Transactions",
    meta: "Buys, sells, NAVs",
  },
  {
    href: "/allocations",
    icon: ArrowsSplitIcon,
    label: "Allocations",
    meta: "Goal mapping",
  },
];

const metrics = [
  { label: "Goal runway", value: "14y", tone: "text-emerald-600" },
  { label: "Monthly SIP", value: "82k", tone: "text-cyan-700" },
  { label: "Mapped", value: "94%", tone: "text-violet-600" },
];

const allocationRows = [
  { label: "Retirement", value: "64%", width: "w-[64%]", color: "bg-teal-500" },
  { label: "Home", value: "22%", width: "w-[22%]", color: "bg-indigo-500" },
  { label: "Reserve", value: "14%", width: "w-[14%]", color: "bg-amber-500" },
];

const setupSteps = [
  "Set assumptions",
  "Add goals",
  "Add investments",
  "Record transactions",
  "Map allocations",
];

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await getSession();
  const params = await searchParams;
  const authRequired = params.auth === "required";

  return (
    <main className="text-foreground min-h-screen overflow-hidden">
      <div className="relative min-h-screen">
        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
          <header className="border-border/70 flex items-center justify-between gap-4 border-b py-4">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <span className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-lg shadow-[0_12px_30px_oklch(0.55_0.15_164/0.25)]">
                <CurrencyInrIcon className="size-5" weight="bold" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold tracking-wide">
                  Finmaxxing
                </span>
                <span className="text-muted-foreground block truncate text-xs">
                  Wealth command center
                </span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <AuthAction signedIn={Boolean(session)} />
              <Button asChild className="hidden sm:inline-flex">
                <Link href="/dashboard">
                  Open overview
                  <ArrowRightIcon className="size-4" weight="bold" />
                </Link>
              </Button>
            </div>
          </header>

          {authRequired ? (
            <div className="finance-panel mt-4 flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  <ShieldCheckIcon className="size-4" weight="bold" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    Sign in required for that page
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Your dashboard and portfolio workspace are private.
                  </p>
                </div>
              </div>
              <AuthAction className="w-full sm:w-auto" signedIn={false} />
            </div>
          ) : null}

          <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(420px,1.12fr)] lg:py-14">
            <div className="max-w-3xl">
              <div className="finance-pill">
                <SparkleIcon className="size-3.5" weight="bold" />
                Private finance tracker
              </div>
              <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-normal text-balance sm:text-5xl lg:text-6xl">
                Make your money plan obvious.
              </h1>
              <p className="text-muted-foreground mt-5 max-w-xl text-sm leading-7 sm:text-base">
                A private workspace for goals, investments, transactions, and
                allocation decisions, organized around the next thing to do.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/dashboard">
                    Open dashboard
                    <ArrowRightIcon className="size-4" weight="bold" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/goals">
                    Start with goals
                    <TargetIcon className="size-4" weight="bold" />
                  </Link>
                </Button>
              </div>
              <div className="mt-8 grid gap-2 sm:grid-cols-5">
                {setupSteps.map((step, index) => (
                  <div className="finance-panel-soft px-3 py-2" key={step}>
                    <p className="text-primary text-xs font-semibold">
                      0{index + 1}
                    </p>
                    <p className="mt-1 text-xs leading-5">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="finance-panel overflow-hidden">
              <div className="border-border/70 flex items-center justify-between border-b px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">Portfolio snapshot</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Current plan
                  </p>
                </div>
                <div className="finance-pill">
                  <GaugeIcon className="size-3.5" weight="bold" />
                  Example flow
                </div>
              </div>

              <div className="border-border/70 bg-border/70 grid gap-px border-b sm:grid-cols-3">
                {metrics.map((metric) => (
                  <div key={metric.label} className="bg-card/82 px-4 py-4">
                    <p className="text-muted-foreground text-xs">
                      {metric.label}
                    </p>
                    <p
                      className={`mt-2 text-3xl font-semibold tracking-normal ${metric.tone}`}
                    >
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 p-4 lg:grid-cols-[1fr_0.82fr]">
                <div className="space-y-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">Goal funding</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Allocation by monthly flow
                      </p>
                    </div>
                    <p className="text-2xl font-semibold tracking-normal">
                      INR 82k
                    </p>
                  </div>

                  <div className="space-y-3">
                    {allocationRows.map((row) => (
                      <div key={row.label}>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span>{row.label}</span>
                          <span className="text-muted-foreground">
                            {row.value}
                          </span>
                        </div>
                        <div className="bg-muted h-2 overflow-hidden rounded-full">
                          <div
                            className={`${row.color} h-full rounded-full ${row.width}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <nav className="grid gap-2">
                  {quickLinks.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        className="border-border/70 bg-background/45 hover:bg-muted/70 group flex items-center justify-between gap-3 rounded-lg border px-3 py-3 transition"
                        href={item.href}
                        key={item.href}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md">
                            <Icon className="size-4" weight="bold" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">
                              {item.label}
                            </span>
                            <span className="text-muted-foreground block truncate text-xs">
                              {item.meta}
                            </span>
                          </span>
                        </span>
                        <ArrowRightIcon className="text-muted-foreground group-hover:text-foreground size-4 transition group-hover:translate-x-0.5" />
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

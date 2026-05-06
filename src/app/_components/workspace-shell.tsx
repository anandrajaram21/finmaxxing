import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowsSplitIcon,
  BookOpenTextIcon,
  ChartLineUpIcon,
  CheckCircleIcon,
  CircleIcon,
  CurrencyInrIcon,
  ReceiptIcon,
  SlidersHorizontalIcon,
  TargetIcon,
  TrendUpIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";

import {
  FormattedNumber,
  isNumberDisplayValue,
  type NumberDisplayValue,
} from "@/app/_components/number-popover";
import { AuthAction } from "@/app/_components/auth-action";
import { DataBackupActions } from "@/app/_components/data-backup-actions";
import { ThemeToggle } from "@/app/_components/theme-toggle";
import { WorkspaceMobileNav } from "@/app/_components/workspace-mobile-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSession } from "@/server/better-auth/server";
import { getSetupProgress } from "@/server/finance/setup-state";

export type WorkspaceSectionKey =
  | "dashboard"
  | "goals"
  | "investments"
  | "transactions"
  | "allocations"
  | "assumptions"
  | "instructions";

export type Metric = {
  detail: string;
  label: string;
  tone?: "neutral" | "good" | "warning" | "accent";
  value: string | NumberDisplayValue;
};

type WorkspaceShellProps = {
  action?: ReactNode;
  activeKey: WorkspaceSectionKey;
  children: ReactNode;
};

type NavItem = {
  description: string;
  href: string;
  icon: Icon;
  key: WorkspaceSectionKey;
  label: string;
};

const navGroups: {
  items: NavItem[];
  label: string;
}[] = [
  {
    label: "Overview",
    items: [
      {
        description: "Status, setup, flow",
        href: "/dashboard",
        icon: TrendUpIcon,
        key: "dashboard",
        label: "Dashboard",
      },
    ],
  },
  {
    label: "Setup",
    items: [
      {
        description: "Inflation and returns",
        href: "/assumptions",
        icon: SlidersHorizontalIcon,
        key: "assumptions",
        label: "Assumptions",
      },
      {
        description: "Targets and years",
        href: "/goals",
        icon: TargetIcon,
        key: "goals",
        label: "Goals",
      },
      {
        description: "Funds, tickers, SIPs",
        href: "/investments",
        icon: ChartLineUpIcon,
        key: "investments",
        label: "Investments",
      },
      {
        description: "Goal mapping",
        href: "/allocations",
        icon: ArrowsSplitIcon,
        key: "allocations",
        label: "Allocations",
      },
    ],
  },
  {
    label: "Records",
    items: [
      {
        description: "Buys, sells, NAVs",
        href: "/transactions",
        icon: ReceiptIcon,
        key: "transactions",
        label: "Transactions",
      },
    ],
  },
  {
    label: "Help",
    items: [
      {
        description: "Workflow and reference",
        href: "/instructions",
        icon: BookOpenTextIcon,
        key: "instructions",
        label: "Instructions",
      },
    ],
  },
];

const navItems = navGroups.flatMap((group) => group.items);

export async function WorkspaceShell({
  action,
  activeKey,
  children,
}: WorkspaceShellProps) {
  const activeItem =
    navItems.find((item) => item.key === activeKey) ?? navItems[0]!;

  return (
    <main className="bg-background text-foreground h-screen overflow-hidden">
      <div className="flex h-full w-full flex-col lg:flex-row">
        <WorkspaceSidebar activeKey={activeKey} />
        <WorkspaceMobileNav action={action} label={activeItem.label}>
          <MobileSidebarContent activeKey={activeKey} />
        </WorkspaceMobileNav>
        <div className="min-h-0 min-w-0 flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-[1500px] px-3 py-4 sm:px-5 lg:px-8 lg:py-6">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

async function WorkspaceSidebar({
  activeKey,
}: {
  activeKey: WorkspaceSectionKey;
}) {
  const session = await getSession();
  const setupProgress = session?.user?.id
    ? await getSetupProgress(session.user.id)
    : null;

  return (
    <aside className="border-sidebar-border bg-sidebar text-sidebar-foreground hidden h-full w-72 shrink-0 flex-col border-r lg:flex">
      <SidebarBrand />
      <SidebarNav activeKey={activeKey} />
      <div className="mt-auto border-t p-3">
        {setupProgress ? (
          <div className="border-sidebar-border bg-sidebar-accent/50 mb-3 border p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold">Setup</p>
              <p className="text-muted-foreground text-xs">
                {setupProgress.completed}/{setupProgress.total}
              </p>
            </div>
            <div className="bg-background mt-2 h-1.5 overflow-hidden">
              <div
                className="bg-primary h-full"
                style={{ width: `${setupProgress.percent}%` }}
              />
            </div>
            {setupProgress.nextStep ? (
              <Link
                className="text-muted-foreground hover:text-foreground mt-2 block truncate text-xs transition"
                href={setupProgress.nextStep.href}
              >
                Next: {setupProgress.nextStep.label}
              </Link>
            ) : (
              <p className="text-muted-foreground mt-2 text-xs">
                Setup complete
              </p>
            )}
          </div>
        ) : null}
        <div className="mb-3">
          <ThemeToggle />
        </div>
        <AuthPanel session={session} />
      </div>
    </aside>
  );
}

async function MobileSidebarContent({
  activeKey,
}: {
  activeKey: WorkspaceSectionKey;
}) {
  const session = await getSession();
  const setupProgress = session?.user?.id
    ? await getSetupProgress(session.user.id)
    : null;

  return (
    <div className="flex min-h-full flex-col">
      <SidebarBrand compact />
      <SidebarNav activeKey={activeKey} />
      <div className="mt-auto border-t p-3">
        {setupProgress ? (
          <div className="border-sidebar-border bg-sidebar-accent/50 mb-3 border p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold">Setup</p>
              <p className="text-muted-foreground text-xs">
                {setupProgress.completed}/{setupProgress.total}
              </p>
            </div>
            <div className="bg-background mt-2 h-1.5 overflow-hidden">
              <div
                className="bg-primary h-full"
                style={{ width: `${setupProgress.percent}%` }}
              />
            </div>
          </div>
        ) : null}
        <div className="mb-3">
          <ThemeToggle />
        </div>
        <AuthPanel session={session} />
      </div>
    </div>
  );
}

function SidebarBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("border-b p-4", compact && "bg-sidebar sticky top-0")}>
      <Link href="/" className="flex min-w-0 items-center gap-3">
        <span className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
          <CurrencyInrIcon className="size-5" weight="bold" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">
            Finmaxxing
          </span>
          <span className="text-muted-foreground block truncate text-xs">
            Portfolio workspace
          </span>
        </span>
      </Link>
    </div>
  );
}

function SidebarNav({ activeKey }: { activeKey: WorkspaceSectionKey }) {
  return (
    <nav className="grid gap-4 p-3">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="text-muted-foreground px-2 pb-1 text-[0.68rem] font-semibold tracking-wider uppercase">
            {group.label}
          </p>
          <div className="grid gap-1">
            {group.items.map((item) => (
              <SidebarNavLink
                activeKey={activeKey}
                item={item}
                key={item.key}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarNavLink({
  activeKey,
  item,
}: {
  activeKey: WorkspaceSectionKey;
  item: NavItem;
}) {
  const Icon = item.icon;
  const isActive = item.key === activeKey;

  return (
    <Link
      className={cn(
        "group flex min-w-0 items-center gap-3 rounded-md px-2.5 py-2 text-sm transition",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
      href={item.href}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md",
          isActive ? "bg-white/15" : "bg-sidebar-accent",
        )}
      >
        <Icon className="size-4" weight={isActive ? "bold" : "regular"} />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-medium">{item.label}</span>
        <span
          className={cn(
            "block truncate text-xs",
            isActive
              ? "text-sidebar-primary-foreground/75"
              : "text-muted-foreground",
          )}
        >
          {item.description}
        </span>
      </span>
    </Link>
  );
}

function AuthPanel({
  session,
}: {
  session: Awaited<ReturnType<typeof getSession>>;
}) {
  return session ? (
    <div className="space-y-3">
      <div>
        <p className="truncate text-sm font-medium">
          {session.user?.name ?? "Signed in"}
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {session.user?.email}
        </p>
      </div>
      <DataBackupActions />
      <AuthAction className="w-full" signedIn />
    </div>
  ) : (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs">
        Sign in to save portfolio records to your account.
      </p>
      <AuthAction
        callbackURL="/dashboard"
        className="w-full"
        signedIn={false}
      />
    </div>
  );
}

export function WorkspacePageHeader({
  action,
  description,
  eyebrow,
  icon: Icon,
  title,
}: {
  action?: ReactNode;
  description: string;
  eyebrow: string;
  icon: Icon;
  title: string;
}) {
  return (
    <header className="border-border bg-card text-card-foreground mb-4 flex flex-col gap-3 rounded-md border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wider uppercase">
          <Icon className="size-4" weight="bold" />
          <span>{eyebrow}</span>
        </div>
        <h1 className="mt-1 text-xl font-semibold tracking-normal sm:text-2xl">
          {title}
        </h1>
        <p className="text-muted-foreground mt-1 max-w-3xl text-sm leading-6">
          {description}
        </p>
      </div>
      {action ? <div className="hidden shrink-0 lg:block">{action}</div> : null}
    </header>
  );
}

export function MetricStrip({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="mb-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-4">
      {metrics.map((metric) => (
        <div
          className="border-border bg-card text-card-foreground min-w-0 rounded-md border px-3 py-2.5"
          key={metric.label}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-muted-foreground truncate text-xs">
              {metric.label}
            </p>
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                metric.tone === "good" && "bg-emerald-500",
                metric.tone === "warning" && "bg-amber-500",
                metric.tone === "accent" && "bg-indigo-500",
                (!metric.tone || metric.tone === "neutral") && "bg-primary",
              )}
            />
          </div>
          <p className="mt-1 truncate font-mono text-2xl font-semibold tracking-normal tabular-nums">
            {isNumberDisplayValue(metric.value) ? (
              <FormattedNumber value={metric.value} />
            ) : (
              metric.value
            )}
          </p>
          <p className="text-muted-foreground mt-1 truncate text-xs">
            {metric.detail}
          </p>
        </div>
      ))}
    </div>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warning" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-medium",
        tone === "good" &&
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        tone === "warning" &&
          "bg-amber-500/10 text-amber-700 dark:text-amber-300",
        tone === "danger" && "bg-destructive/10 text-destructive",
        tone === "neutral" && "bg-muted text-muted-foreground",
      )}
    >
      {tone === "good" ? (
        <CheckCircleIcon className="size-3.5" weight="bold" />
      ) : tone === "warning" || tone === "danger" ? (
        <WarningCircleIcon className="size-3.5" weight="bold" />
      ) : (
        <CircleIcon className="size-3" weight="fill" />
      )}
      {children}
    </span>
  );
}

export function SectionEmptyState({
  actionHref,
  actionLabel,
  description,
  title,
}: {
  actionHref?: string;
  actionLabel?: string;
  description: string;
  title: string;
}) {
  return (
    <div className="flex min-h-52 flex-col items-start justify-center rounded-md border border-dashed p-5">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-muted-foreground mt-1 max-w-xl text-sm leading-6">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <Button asChild className="mt-4" size="sm" variant="outline">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}

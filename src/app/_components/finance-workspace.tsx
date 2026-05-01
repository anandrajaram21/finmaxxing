import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowsSplitIcon,
  CaretDownIcon,
  ChartLineUpIcon,
  CurrencyInrIcon,
  PlusIcon,
  ReceiptIcon,
  SignOutIcon,
  TargetIcon,
} from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { auth } from "@/server/better-auth";
import { getSession } from "@/server/better-auth/server";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

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
        label: "Target value",
        value: "INR 1.86Cr",
        detail: "Minor units in DB",
      },
      {
        label: "Next milestone",
        value: "2028",
        detail: "Earliest target year",
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
      { label: "Target", align: "right" },
      { label: "Year", align: "center" },
      { label: "Order", align: "right" },
    ],
    rows: [
      {
        cells: ["Retirement corpus", "INR 1.20Cr", "2045", "1"],
        tone: "accent",
      },
      { cells: ["Home down payment", "INR 35L", "2030", "2"] },
      { cells: ["Emergency reserve", "INR 12L", "2027", "3"] },
      { cells: ["Travel fund", "INR 6L", "2028", "4"], tone: "muted" },
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
      { label: "Investment" },
      { label: "Ticker", align: "center" },
      { label: "Category" },
      { label: "SIP", align: "right" },
      { label: "NAV", align: "right" },
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

export function FinanceWorkspace({
  fieldOptions,
  sectionKey,
}: {
  fieldOptions?: FieldOptions;
  sectionKey: SectionKey;
}) {
  const section = sections[sectionKey];
  const sectionFieldOptions = fieldOptions?.[sectionKey];

  return (
    <main className="bg-background text-foreground h-screen overflow-hidden">
      <div className="flex h-full w-full flex-col lg:flex-row">
        <Sidebar activeKey={sectionKey} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <WorkspaceHeader section={section} />
          <section className="min-h-0 flex-1 space-y-6 overflow-auto px-4 py-5 sm:px-6 lg:px-10">
            <StatsGrid stats={section.stats} />
            <div className="grid gap-6 xl:grid-cols-[minmax(320px,380px)_1fr]">
              <DefinitionForm
                fieldOptions={sectionFieldOptions}
                section={section}
              />
              <ResourceTable section={section} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
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

function WorkspaceHeader({ section }: { section: Section }) {
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
      <Button className="w-fit" type="button">
        <PlusIcon className="size-4" weight="bold" />
        {section.actionLabel}
      </Button>
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

function DefinitionForm({
  fieldOptions,
  section,
}: {
  fieldOptions?: Partial<Record<string, FieldOption[]>>;
  section: Section;
}) {
  return (
    <section className="border-border bg-card text-card-foreground border">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">
          Define {section.label.slice(0, -1)}
        </h2>
      </div>
      <form className="grid gap-4 p-4">
        {section.fields.map((field) => {
          const options = fieldOptions?.[field.name];

          return (
            <label key={field.name} className="grid gap-1.5">
              <span className="text-xs font-medium">{field.label}</span>
              {options ? (
                <span className="relative block">
                  <select
                    className="border-input bg-background focus-visible:ring-ring h-9 w-full appearance-none rounded-sm border px-3 pr-10 text-sm outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue=""
                    disabled={options.length === 0}
                    name={field.name}
                  >
                    <option value="" disabled>
                      {options.length > 0
                        ? `Select ${field.label.toLowerCase()}`
                        : `No ${field.label.toLowerCase()}s found`}
                    </option>
                    {options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <CaretDownIcon
                    aria-hidden="true"
                    className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
                  />
                </span>
              ) : (
                <input
                  className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-sm border px-3 text-sm outline-none focus-visible:ring-1"
                  name={field.name}
                  placeholder={field.placeholder}
                  type={field.type ?? "text"}
                />
              )}
            </label>
          );
        })}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="reset" variant="outline">
            Clear
          </Button>
          <Button type="button">
            <PlusIcon className="size-4" weight="bold" />
            {section.actionLabel}
          </Button>
        </div>
      </form>
    </section>
  );
}

function ResourceTable({ section }: { section: Section }) {
  return (
    <section className="border-border bg-card text-card-foreground min-w-0 border">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <h2 className="text-sm font-semibold">{section.label}</h2>
        <span className="text-muted-foreground text-xs">
          {section.rows.length} rows
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground border-b text-xs">
              {section.tableColumns.map((column) => (
                <th
                  key={column.label}
                  className={cn(
                    "px-4 py-2 font-medium",
                    alignmentClass(column.align),
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row) => (
              <tr
                key={row.cells.join("-")}
                className={cn(
                  "border-border border-b last:border-b-0",
                  row.tone === "accent" && "bg-primary/5",
                  row.tone === "muted" && "text-muted-foreground",
                )}
              >
                {row.cells.map((cell, index) => (
                  <td
                    key={`${cell}-${index}`}
                    className={cn(
                      "px-4 py-3",
                      alignmentClass(section.tableColumns[index]?.align),
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function alignmentClass(align: TableColumn["align"]) {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
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

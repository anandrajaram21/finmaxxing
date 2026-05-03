import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { Button } from "@/components/ui/button";
import { db } from "@/server/db";
import { portfolioAssumptions } from "@/server/db/schema";
import { getSession } from "@/server/better-auth/server";
import { Sidebar } from "@/app/_components/finance-workspace";

type AssumptionValues = {
  currentYear: number;
  expectedReturnRate: number;
  inflationRate: number;
};

const defaultAssumptions: AssumptionValues = {
  currentYear: new Date().getFullYear(),
  expectedReturnRate: 0.1,
  inflationRate: 0.06,
};

export default async function AssumptionsPage() {
  const session = await getSession();
  const assumptions = session?.user?.id
    ? await getAssumptions(session.user.id)
    : defaultAssumptions;

  return (
    <main className="bg-background text-foreground h-screen overflow-hidden">
      <div className="flex h-full w-full flex-col lg:flex-row">
        <Sidebar activeKey="assumptions" />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto">
          <header className="border-border flex flex-col gap-4 border-b px-4 py-5 sm:px-6 lg:px-10">
            <div className="min-w-0">
              <div className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Model
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-normal sm:text-3xl">
                Assumptions
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
                Define the assumptions used to project goals, required SIPs, and
                long-term portfolio planning.
              </p>
            </div>
          </header>

          <section className="px-4 py-5 sm:px-6 lg:px-10">
            <div className="grid gap-3 sm:grid-cols-3">
              <AssumptionStat
                detail="Projection start"
                label="Base year"
                value={String(assumptions.currentYear)}
              />
              <AssumptionStat
                detail="Annual inflation"
                label="Inflation"
                value={formatPercent(assumptions.inflationRate)}
              />
              <AssumptionStat
                detail="Annual portfolio return"
                label="Expected return"
                value={formatPercent(assumptions.expectedReturnRate)}
              />
            </div>

            <section className="border-border bg-card text-card-foreground mt-6 max-w-2xl border">
              <div className="border-b px-4 py-3">
                <h2 className="text-sm font-semibold">Projection inputs</h2>
              </div>
              <form action={saveAssumptions} className="grid gap-4 p-4">
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium">Base year</span>
                  <input
                    className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-sm border px-3 text-sm outline-none focus-visible:ring-1"
                    defaultValue={assumptions.currentYear}
                    disabled={!session}
                    min="1900"
                    name="currentYear"
                    required
                    step="1"
                    type="number"
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-xs font-medium">
                    Inflation rate (%)
                  </span>
                  <input
                    className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-sm border px-3 text-sm outline-none focus-visible:ring-1"
                    defaultValue={toPercentInput(assumptions.inflationRate)}
                    disabled={!session}
                    min="0"
                    name="inflationRate"
                    required
                    step="0.1"
                    type="number"
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-xs font-medium">
                    Expected return rate (%)
                  </span>
                  <input
                    className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-sm border px-3 text-sm outline-none focus-visible:ring-1"
                    defaultValue={toPercentInput(
                      assumptions.expectedReturnRate,
                    )}
                    disabled={!session}
                    min="0"
                    name="expectedReturnRate"
                    required
                    step="0.1"
                    type="number"
                  />
                </label>

                <div className="flex items-center justify-between gap-3 border-t pt-4">
                  <p className="text-muted-foreground text-xs">
                    {session
                      ? "Changes apply immediately to goal projections."
                      : "Sign in to save assumptions."}
                  </p>
                  <Button disabled={!session} type="submit">
                    Save assumptions
                  </Button>
                </div>
              </form>
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}

async function getAssumptions(userId: string): Promise<AssumptionValues> {
  const rows = await db
    .select()
    .from(portfolioAssumptions)
    .where(eq(portfolioAssumptions.userId, userId))
    .limit(1);

  return rows[0] ?? defaultAssumptions;
}

async function saveAssumptions(formData: FormData) {
  "use server";

  const session = await getSession();
  if (!session?.user?.id) redirect("/assumptions");

  const currentYear = parseInteger(formData.get("currentYear"));
  const inflationRate = parsePercent(formData.get("inflationRate"));
  const expectedReturnRate = parsePercent(formData.get("expectedReturnRate"));

  await db
    .insert(portfolioAssumptions)
    .values({
      currentYear,
      expectedReturnRate,
      inflationRate,
      userId: session.user.id,
    })
    .onConflictDoUpdate({
      set: {
        currentYear,
        expectedReturnRate,
        inflationRate,
        updatedAt: new Date(),
      },
      target: portfolioAssumptions.userId,
    });

  revalidatePath("/assumptions");
  revalidatePath("/goals");
  redirect("/assumptions");
}

function AssumptionStat({
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

function formatPercent(value: number) {
  return value.toLocaleString("en-IN", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
    style: "percent",
  });
}

function parseInteger(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Expected a positive integer.");
  }

  return parsed;
}

function parsePercent(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Expected a non-negative percentage.");
  }

  return parsed / 100;
}

function toPercentInput(value: number) {
  return Number((value * 100).toFixed(2));
}

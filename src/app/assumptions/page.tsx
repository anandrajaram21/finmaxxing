import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { SlidersHorizontalIcon } from "@phosphor-icons/react/ssr";

import { Button } from "@/components/ui/button";
import { numberDisplay } from "@/app/_components/number-popover";
import { db } from "@/server/db";
import { portfolioAssumptions } from "@/server/db/schema";
import { getSession } from "@/server/better-auth/server";
import {
  MetricStrip,
  WorkspacePageHeader,
  WorkspaceShell,
} from "@/app/_components/workspace-shell";

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
  if (!session?.user?.id) redirect("/?auth=required");

  const assumptions = await getAssumptions(session.user.id);

  return (
    <WorkspaceShell activeKey="assumptions">
      <WorkspacePageHeader
        description="Define the inputs used to project goals, required SIPs, and long-term portfolio planning."
        eyebrow="Model"
        icon={SlidersHorizontalIcon}
        title="Assumptions"
      />
      <MetricStrip
        metrics={[
          {
            detail: "Projection start",
            label: "Base year",
            value: String(assumptions.currentYear),
          },
          {
            detail: "Annual inflation",
            label: "Inflation",
            tone: "warning",
            value: formatPercent(assumptions.inflationRate),
          },
          {
            detail: "Annual portfolio return",
            label: "Expected return",
            tone: "good",
            value: formatPercent(assumptions.expectedReturnRate),
          },
        ]}
      />

      <section className="border-border bg-card text-card-foreground max-w-2xl rounded-md border">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Projection inputs</h2>
        </div>
        <form action={saveAssumptions} className="grid gap-4 p-4">
          <label className="grid gap-1.5">
            <span className="text-xs font-medium">Base year</span>
            <input
              className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-1"
              defaultValue={assumptions.currentYear}
              min="1900"
              name="currentYear"
              required
              step="1"
              type="number"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-medium">Inflation rate (%)</span>
            <input
              className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-1"
              defaultValue={toPercentInput(assumptions.inflationRate)}
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
              className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-1"
              defaultValue={toPercentInput(assumptions.expectedReturnRate)}
              min="0"
              name="expectedReturnRate"
              required
              step="0.1"
              type="number"
            />
          </label>

          <div className="flex items-center justify-between gap-3 border-t pt-4">
            <p className="text-muted-foreground text-xs">
              Changes apply immediately to goal projections.
            </p>
            <Button type="submit">Save assumptions</Button>
          </div>
        </form>
      </section>
    </WorkspaceShell>
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
  if (!session?.user?.id) redirect("/?auth=required");

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

function formatPercent(value: number) {
  const formatted = value.toLocaleString("en-IN", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
    style: "percent",
  });
  const full = value.toLocaleString("en-IN", {
    maximumFractionDigits: 4,
    minimumFractionDigits: 0,
    style: "percent",
  });

  return numberDisplay(formatted, full);
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

"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  CaretRightIcon,
  PencilSimpleIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import {
  FormattedNumber,
  isNumberDisplayValue,
  numberDisplay,
  type NumberDisplayValue,
} from "@/app/_components/number-popover";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

type TableColumn = {
  label: string;
  align?: "left" | "right" | "center";
};

type TableRowDetail = {
  label: string;
  value: TableTextValue;
};

type ProgressCell = {
  currentMinor: number;
  kind: "progress";
  totalMinor: number;
};

type SelectOption = {
  label: string;
  value: string;
};

export type TableRowAction =
  | {
      goalOptions: SelectOption[];
      id: number;
      investmentOptions: SelectOption[];
      kind: "allocation";
      values: {
        goalId: number;
        investmentId: number;
        percentage: number;
      };
    }
  | {
      kind: "goal";
      id: number;
      values: {
        name: string;
        targetAmountMinor: number;
        targetYear: number;
      };
    }
  | {
      kind: "investment";
      id: number;
      values: {
        monthlySipMinor: number;
        name: string;
        tickerSymbol: string;
      };
    }
  | {
      kind: "transaction";
      id: number;
      investmentOptions: SelectOption[];
      values: {
        amountMinor: number;
        investmentId: number;
        nav: number;
        notes: string | null;
        transactionDate: string;
        type: "buy" | "sell";
        units: number;
      };
    };

type TableRow = {
  action?: TableRowAction;
  cells: TableCell[];
  details?: TableRowDetail[];
  tone?: "normal" | "muted" | "accent";
};

type TableTextValue = string | NumberDisplayValue;

type TableCell = TableTextValue | ProgressCell;

export function ResourceTable({
  label,
  rows,
  tableColumns,
}: {
  label: string;
  rows: TableRow[];
  tableColumns: TableColumn[];
}) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const hasExpandableRows = rows.some((row) => row.details?.length);
  const hasActions = rows.some((row) => row.action);

  return (
    <section className="border-border bg-card text-card-foreground min-w-0 border">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <h2 className="text-sm font-semibold">{label}</h2>
        <span className="text-muted-foreground text-xs">
          {rows.length} rows
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground border-b text-xs">
              {tableColumns.map((column) => (
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
              {hasActions ? (
                <th className="px-4 py-2 text-right font-medium">Actions</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowKey = row.action
                ? `${row.action.kind}-${row.action.id}`
                : row.cells.map(cellToText).join("-");
              const isExpanded = expandedRow === rowKey;
              const canExpand = Boolean(row.details?.length);

              return (
                <FragmentRow
                  canExpand={canExpand}
                  isExpanded={isExpanded}
                  key={rowKey}
                  hasActions={hasActions}
                  onToggle={() =>
                    setExpandedRow(isExpanded || !canExpand ? null : rowKey)
                  }
                  row={row}
                  tableColumns={tableColumns}
                  showButton={hasExpandableRows}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FragmentRow({
  canExpand,
  hasActions,
  isExpanded,
  onToggle,
  row,
  showButton,
  tableColumns,
}: {
  canExpand: boolean;
  hasActions: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  row: TableRow;
  showButton: boolean;
  tableColumns: TableColumn[];
}) {
  return (
    <>
      <tr
        className={cn(
          "border-border border-b",
          row.tone === "accent" && "bg-primary/5",
          row.tone === "muted" && "text-muted-foreground",
          isExpanded && "bg-muted/30",
        )}
      >
        {row.cells.map((cell, index) => (
          <td
            key={`${cellToText(cell)}-${index}`}
            className={cn(
              "px-4 py-3 align-middle",
              alignmentClass(tableColumns[index]?.align),
            )}
          >
            {index === 0 && showButton ? (
              <span className="flex min-w-0 items-center gap-2">
                <Button
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? "Collapse" : "Expand"} ${cellToText(cell)}`}
                  disabled={!canExpand}
                  onClick={onToggle}
                  size="icon-xs"
                  type="button"
                  variant="ghost"
                >
                  <CaretRightIcon
                    className={cn(
                      "size-3 transition-transform",
                      isExpanded && "rotate-90",
                    )}
                    weight="bold"
                  />
                </Button>
                <span className="truncate">{renderCell(cell)}</span>
              </span>
            ) : (
              renderCell(cell)
            )}
          </td>
        ))}
        {hasActions ? (
          <td className="px-4 py-3 text-right align-middle">
            {row.action ? <RowActions action={row.action} /> : null}
          </td>
        ) : null}
      </tr>
      {isExpanded ? (
        <tr className="border-border bg-muted/20 border-b">
          <td
            className="px-4 py-4"
            colSpan={tableColumns.length + (hasActions ? 1 : 0)}
          >
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {row.details?.map((detail) => (
                <div key={detail.label} className="min-w-0">
                  <dt className="text-muted-foreground text-xs">
                    {detail.label}
                  </dt>
                  <dd className="mt-1 truncate text-sm font-medium">
                    {renderTextValue(detail.value)}
                  </dd>
                </div>
              ))}
            </dl>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function renderCell(cell: TableCell) {
  if (isTableTextValue(cell)) return renderTextValue(cell);

  return <ProgressCellView cell={cell} />;
}

function cellToText(cell: TableCell) {
  if (typeof cell === "string") return cell;
  if (isNumberDisplayValue(cell)) return cell.value;

  return `${cell.currentMinor}-${cell.totalMinor}`;
}

function isTableTextValue(cell: TableCell): cell is TableTextValue {
  return typeof cell === "string" || isNumberDisplayValue(cell);
}

function renderTextValue(value: TableTextValue) {
  if (typeof value === "string") return value;

  return <FormattedNumber value={value} />;
}

function ProgressCellView({ cell }: { cell: ProgressCell }) {
  const ratio =
    cell.totalMinor > 0 ? Math.min(cell.currentMinor / cell.totalMinor, 1) : 0;
  const percent = Math.round(ratio * 100);

  return (
    <div className="ml-auto grid min-w-52 gap-1 text-left">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium">
          <FormattedNumber value={formatInrMinor(cell.currentMinor)} />
        </span>
        <span className="text-muted-foreground">{percent}%</span>
      </div>
      <div className="bg-muted h-2 overflow-hidden rounded-none">
        <div className="bg-primary h-full" style={{ width: `${percent}%` }} />
      </div>
      <div className="text-muted-foreground text-xs">
        of <FormattedNumber value={formatInrMinor(cell.totalMinor)} />
      </div>
    </div>
  );
}

function RowActions({ action }: { action: TableRowAction }) {
  if (action.kind === "allocation") {
    return <AllocationRowActions action={action} />;
  }
  if (action.kind === "goal") return <GoalRowActions action={action} />;
  if (action.kind === "investment") {
    return <InvestmentRowActions action={action} />;
  }
  return <TransactionRowActions action={action} />;
}

function AllocationRowActions({
  action,
}: {
  action: Extract<TableRowAction, { kind: "allocation" }>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const utils = api.useUtils();
  const deleteAllocation = api.allocations.delete.useMutation();

  async function handleDelete() {
    if (!window.confirm("Delete this allocation?")) return;

    try {
      await deleteAllocation.mutateAsync({ id: action.id });
      await utils.allocations.list.invalidate();
      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Allocation delete failed.",
      );
    }
  }

  return (
    <>
      <span className="inline-flex items-center justify-end gap-1">
        <Button
          aria-label="Edit allocation"
          onClick={() => setIsEditing(true)}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <PencilSimpleIcon className="size-3" />
        </Button>
        <Button
          aria-label="Delete allocation"
          disabled={deleteAllocation.isPending}
          onClick={handleDelete}
          size="icon-xs"
          type="button"
          variant="destructive"
        >
          <TrashIcon className="size-3" />
        </Button>
      </span>
      {isEditing ? (
        <AllocationEditDialog
          action={action}
          onClose={() => setIsEditing(false)}
        />
      ) : null}
    </>
  );
}

function GoalRowActions({
  action,
}: {
  action: Extract<TableRowAction, { kind: "goal" }>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const utils = api.useUtils();
  const deleteGoal = api.goals.delete.useMutation();

  async function handleDelete() {
    if (!window.confirm(`Delete ${action.values.name}?`)) return;

    try {
      await deleteGoal.mutateAsync({ id: action.id });
      await utils.goals.list.invalidate();
      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Goal delete failed.",
      );
    }
  }

  return (
    <>
      <span className="inline-flex items-center justify-end gap-1">
        <Button
          aria-label={`Edit ${action.values.name}`}
          onClick={() => setIsEditing(true)}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <PencilSimpleIcon className="size-3" />
        </Button>
        <Button
          aria-label={`Delete ${action.values.name}`}
          disabled={deleteGoal.isPending}
          onClick={handleDelete}
          size="icon-xs"
          type="button"
          variant="destructive"
        >
          <TrashIcon className="size-3" />
        </Button>
      </span>
      {isEditing ? (
        <GoalEditDialog action={action} onClose={() => setIsEditing(false)} />
      ) : null}
    </>
  );
}

function InvestmentRowActions({
  action,
}: {
  action: Extract<TableRowAction, { kind: "investment" }>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const utils = api.useUtils();
  const deleteInvestment = api.investments.delete.useMutation();

  async function handleDelete() {
    if (!window.confirm(`Delete ${action.values.name}?`)) return;

    try {
      await deleteInvestment.mutateAsync({ id: action.id });
      await utils.investments.list.invalidate();
      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Investment delete failed.",
      );
    }
  }

  return (
    <>
      <span className="inline-flex items-center justify-end gap-1">
        <Button
          aria-label={`Edit ${action.values.name}`}
          onClick={() => setIsEditing(true)}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <PencilSimpleIcon className="size-3" />
        </Button>
        <Button
          aria-label={`Delete ${action.values.name}`}
          disabled={deleteInvestment.isPending}
          onClick={handleDelete}
          size="icon-xs"
          type="button"
          variant="destructive"
        >
          <TrashIcon className="size-3" />
        </Button>
      </span>
      {isEditing ? (
        <InvestmentEditDialog
          action={action}
          onClose={() => setIsEditing(false)}
        />
      ) : null}
    </>
  );
}

function TransactionRowActions({
  action,
}: {
  action: Extract<TableRowAction, { kind: "transaction" }>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const utils = api.useUtils();
  const deleteTransaction = api.transactions.delete.useMutation();

  async function handleDelete() {
    if (!window.confirm("Delete this transaction?")) return;

    try {
      await deleteTransaction.mutateAsync({ id: action.id });
      await utils.transactions.list.invalidate();
      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Transaction delete failed.",
      );
    }
  }

  return (
    <>
      <span className="inline-flex items-center justify-end gap-1">
        <Button
          aria-label="Edit transaction"
          onClick={() => setIsEditing(true)}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <PencilSimpleIcon className="size-3" />
        </Button>
        <Button
          aria-label="Delete transaction"
          disabled={deleteTransaction.isPending}
          onClick={handleDelete}
          size="icon-xs"
          type="button"
          variant="destructive"
        >
          <TrashIcon className="size-3" />
        </Button>
      </span>
      {isEditing ? (
        <TransactionEditDialog
          action={action}
          onClose={() => setIsEditing(false)}
        />
      ) : null}
    </>
  );
}

function GoalEditDialog({
  action,
  onClose,
}: {
  action: Extract<TableRowAction, { kind: "goal" }>;
  onClose: () => void;
}) {
  const [name, setName] = useState(action.values.name);
  const [targetAmount, setTargetAmount] = useState(
    String(action.values.targetAmountMinor / 100),
  );
  const [targetYear, setTargetYear] = useState(
    String(action.values.targetYear),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();
  const utils = api.useUtils();
  const updateGoal = api.goals.update.useMutation();

  const targetAmountMinor = parseMoneyMinor(targetAmount, true);
  const targetYearValue = parsePositiveInteger(targetYear);
  const isValid =
    name.trim().length > 0 &&
    targetAmountMinor !== null &&
    targetYearValue !== null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!isValid || targetAmountMinor === null || targetYearValue === null) {
      setFormError("Enter a goal name, target amount, and target year.");
      return;
    }

    try {
      await updateGoal.mutateAsync({
        id: action.id,
        name: name.trim(),
        targetAmountMinor,
        targetYear: targetYearValue,
      });
      await utils.goals.list.invalidate();
      router.refresh();
      onClose();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Goal update failed.",
      );
    }
  }

  return (
    <EditDialogShell
      isPending={updateGoal.isPending}
      onClose={onClose}
      title="Edit goal"
    >
      <form className="grid gap-4 overflow-auto p-4" onSubmit={handleSubmit}>
        <TextField
          autoFocus
          label="Goal name"
          onChange={setName}
          placeholder="Retirement corpus"
          value={name}
        />
        <TextField
          inputMode="decimal"
          label="Target amount"
          min="1"
          onChange={setTargetAmount}
          placeholder="5000000"
          step="0.01"
          type="number"
          value={targetAmount}
        />
        <TextField
          inputMode="numeric"
          label="Target year"
          min="1"
          onChange={setTargetYear}
          placeholder="2034"
          step="1"
          type="number"
          value={targetYear}
        />
        <EditDialogFooter
          error={formError ?? updateGoal.error?.message}
          isPending={updateGoal.isPending}
          isValid={isValid}
          onClose={onClose}
        />
      </form>
    </EditDialogShell>
  );
}

function AllocationEditDialog({
  action,
  onClose,
}: {
  action: Extract<TableRowAction, { kind: "allocation" }>;
  onClose: () => void;
}) {
  const [investmentId, setInvestmentId] = useState(
    String(action.values.investmentId),
  );
  const [goalId, setGoalId] = useState(String(action.values.goalId));
  const [percentage, setPercentage] = useState(
    String(action.values.percentage * 100),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();
  const utils = api.useUtils();
  const updateAllocation = api.allocations.update.useMutation();

  const parsedInvestmentId = parsePositiveInteger(investmentId);
  const parsedGoalId = parsePositiveInteger(goalId);
  const percentageValue = parseAllocationPercentage(percentage);
  const isValid =
    parsedInvestmentId !== null &&
    parsedGoalId !== null &&
    percentageValue !== null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (
      !isValid ||
      parsedInvestmentId === null ||
      parsedGoalId === null ||
      percentageValue === null
    ) {
      setFormError("Select an investment and goal, then enter a percentage.");
      return;
    }

    try {
      await updateAllocation.mutateAsync({
        goalId: parsedGoalId,
        id: action.id,
        investmentId: parsedInvestmentId,
        percentage: percentageValue,
      });
      await utils.allocations.list.invalidate();
      router.refresh();
      onClose();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Allocation update failed.",
      );
    }
  }

  return (
    <EditDialogShell
      isPending={updateAllocation.isPending}
      onClose={onClose}
      title="Edit allocation"
    >
      <form className="grid gap-4 overflow-auto p-4" onSubmit={handleSubmit}>
        <SelectField
          disabled={action.investmentOptions.length === 0}
          label="Investment"
          onChange={setInvestmentId}
          options={action.investmentOptions}
          placeholder={
            action.investmentOptions.length > 0
              ? "Select investment"
              : "No investments found"
          }
          value={investmentId}
        />
        <SelectField
          disabled={action.goalOptions.length === 0}
          label="Goal"
          onChange={setGoalId}
          options={action.goalOptions}
          placeholder={
            action.goalOptions.length > 0 ? "Select goal" : "No goals found"
          }
          value={goalId}
        />
        <TextField
          inputMode="decimal"
          label="Percentage"
          min="0.01"
          onChange={setPercentage}
          placeholder="70"
          step="0.01"
          type="number"
          value={percentage}
        />
        <EditDialogFooter
          error={formError ?? updateAllocation.error?.message}
          isPending={updateAllocation.isPending}
          isValid={isValid}
          onClose={onClose}
        />
      </form>
    </EditDialogShell>
  );
}

function InvestmentEditDialog({
  action,
  onClose,
}: {
  action: Extract<TableRowAction, { kind: "investment" }>;
  onClose: () => void;
}) {
  const [name, setName] = useState(action.values.name);
  const [tickerSymbol, setTickerSymbol] = useState(action.values.tickerSymbol);
  const [monthlySip, setMonthlySip] = useState(
    String(action.values.monthlySipMinor / 100),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();
  const utils = api.useUtils();
  const updateInvestment = api.investments.update.useMutation();

  const monthlySipMinor = parseMoneyMinor(monthlySip, false);
  const isValid =
    name.trim().length > 0 &&
    tickerSymbol.trim().length > 0 &&
    monthlySipMinor !== null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!isValid || monthlySipMinor === null) {
      setFormError("Enter an investment name, ticker symbol, and SIP amount.");
      return;
    }

    try {
      await updateInvestment.mutateAsync({
        id: action.id,
        monthlySipMinor,
        name: name.trim(),
        tickerSymbol: tickerSymbol.trim(),
      });
      await utils.investments.list.invalidate();
      router.refresh();
      onClose();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Investment update failed.",
      );
    }
  }

  return (
    <EditDialogShell
      isPending={updateInvestment.isPending}
      onClose={onClose}
      title="Edit investment"
    >
      <form className="grid gap-4 overflow-auto p-4" onSubmit={handleSubmit}>
        <TextField
          autoFocus
          label="Mutual fund / stock / ETF name"
          onChange={setName}
          placeholder="Nifty 50 Index"
          value={name}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Ticker symbol"
            onChange={setTickerSymbol}
            placeholder="NIFTYBEES"
            value={tickerSymbol}
          />
          <TextField
            inputMode="decimal"
            label="SIP amount"
            min="0"
            onChange={setMonthlySip}
            placeholder="25000"
            step="0.01"
            type="number"
            value={monthlySip}
          />
        </div>
        <EditDialogFooter
          error={formError ?? updateInvestment.error?.message}
          isPending={updateInvestment.isPending}
          isValid={isValid}
          onClose={onClose}
        />
      </form>
    </EditDialogShell>
  );
}

function TransactionEditDialog({
  action,
  onClose,
}: {
  action: Extract<TableRowAction, { kind: "transaction" }>;
  onClose: () => void;
}) {
  const [investmentId, setInvestmentId] = useState(
    String(action.values.investmentId),
  );
  const [transactionDate, setTransactionDate] = useState(
    action.values.transactionDate,
  );
  const [type, setType] = useState<"buy" | "sell">(action.values.type);
  const [amount, setAmount] = useState(String(action.values.amountMinor / 100));
  const [units, setUnits] = useState(String(action.values.units));
  const [nav, setNav] = useState(String(action.values.nav));
  const [notes, setNotes] = useState(action.values.notes ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();
  const utils = api.useUtils();
  const updateTransaction = api.transactions.update.useMutation();

  const parsedInvestmentId = parsePositiveInteger(investmentId);
  const parsedDate = parseDateInput(transactionDate);
  const amountMinor = parseMoneyMinor(amount, true);
  const unitsValue = parsePositiveNumber(units);
  const navValue = parsePositiveNumber(nav);
  const isValid =
    parsedInvestmentId !== null &&
    parsedDate !== null &&
    amountMinor !== null &&
    unitsValue !== null &&
    navValue !== null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (
      !isValid ||
      parsedInvestmentId === null ||
      parsedDate === null ||
      amountMinor === null ||
      unitsValue === null ||
      navValue === null
    ) {
      setFormError("Enter investment, date, amount, units, and NAV.");
      return;
    }

    try {
      await updateTransaction.mutateAsync({
        amountMinor,
        id: action.id,
        investmentId: parsedInvestmentId,
        nav: navValue,
        notes: notes.trim() || null,
        transactionDate: parsedDate,
        type,
        units: unitsValue,
      });
      await utils.transactions.list.invalidate();
      router.refresh();
      onClose();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Transaction update failed.",
      );
    }
  }

  return (
    <EditDialogShell
      isPending={updateTransaction.isPending}
      onClose={onClose}
      title="Edit transaction"
    >
      <form className="grid gap-4 overflow-auto p-4" onSubmit={handleSubmit}>
        <SelectField
          disabled={action.investmentOptions.length === 0}
          label="Investment"
          onChange={setInvestmentId}
          options={action.investmentOptions}
          placeholder={
            action.investmentOptions.length > 0
              ? "Select investment"
              : "No investments found"
          }
          value={investmentId}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Date"
            onChange={setTransactionDate}
            placeholder="2026-05-01"
            type="date"
            value={transactionDate}
          />
          <SelectField
            label="Type"
            onChange={(value) => setType(value === "sell" ? "sell" : "buy")}
            options={[
              { label: "Buy", value: "buy" },
              { label: "Sell", value: "sell" },
            ]}
            placeholder="Select type"
            value={type}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            inputMode="decimal"
            label="Amount"
            min="0.01"
            onChange={setAmount}
            placeholder="25000"
            step="0.01"
            type="number"
            value={amount}
          />
          <TextField
            inputMode="decimal"
            label="Units"
            min="0.000001"
            onChange={setUnits}
            placeholder="100.596"
            step="0.000001"
            type="number"
            value={units}
          />
          <TextField
            inputMode="decimal"
            label="NAV"
            min="0.0001"
            onChange={setNav}
            placeholder="248.52"
            step="0.0001"
            type="number"
            value={nav}
          />
        </div>

        <label className="grid gap-1.5">
          <span className="text-xs font-medium">Notes</span>
          <textarea
            className="border-input bg-background focus-visible:ring-ring min-h-20 w-full resize-none rounded-sm border px-3 py-2 text-sm outline-none focus-visible:ring-1"
            maxLength={1024}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Monthly SIP"
            value={notes}
          />
        </label>

        <EditDialogFooter
          error={formError ?? updateTransaction.error?.message}
          isPending={updateTransaction.isPending}
          isValid={isValid}
          onClose={onClose}
        />
      </form>
    </EditDialogShell>
  );
}

function EditDialogShell({
  children,
  isPending,
  onClose,
  title,
}: {
  children: ReactNode;
  isPending: boolean;
  onClose: () => void;
  title: string;
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      role="dialog"
    >
      <div className="border-border bg-card text-card-foreground flex max-h-[min(720px,calc(100vh-2rem))] w-full max-w-lg flex-col border text-left shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          <Button
            aria-label={`Close ${title}`}
            disabled={isPending}
            onClick={onClose}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <XIcon className="size-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

function TextField({
  autoFocus,
  inputMode,
  label,
  min,
  onChange,
  placeholder,
  step,
  type = "text",
  value,
}: {
  autoFocus?: boolean;
  inputMode?: "decimal" | "numeric";
  label: string;
  min?: string;
  onChange: (value: string) => void;
  placeholder: string;
  step?: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium">{label}</span>
      <input
        autoFocus={autoFocus}
        className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-sm border px-3 text-sm outline-none focus-visible:ring-1"
        inputMode={inputMode}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required
        step={step}
        type={type}
        value={value}
      />
    </label>
  );
}

function SelectField({
  disabled,
  label,
  onChange,
  options,
  placeholder,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  value: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium">{label}</span>
      <select
        className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-sm border px-3 text-sm outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        required
        value={value}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function EditDialogFooter({
  error,
  isPending,
  isValid,
  onClose,
}: {
  error?: string | null;
  isPending: boolean;
  isValid: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button
          disabled={isPending}
          onClick={onClose}
          type="button"
          variant="outline"
        >
          Cancel
        </Button>
        <Button disabled={!isValid || isPending} type="submit">
          {isPending ? "Saving" : "Save changes"}
        </Button>
      </div>
    </>
  );
}

function parseMoneyMinor(value: string, positive: boolean) {
  if (value.trim() === "") return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (positive ? parsed <= 0 : parsed < 0) return null;

  return Math.round(parsed * 100);
}

function parsePositiveNumber(value: string) {
  if (value.trim() === "") return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return parsed;
}

function parsePositiveInteger(value: string) {
  if (value.trim() === "") return null;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;

  return parsed;
}

function parseAllocationPercentage(value: string) {
  if (value.trim() === "") return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  const percentage = parsed > 1 ? parsed / 100 : parsed;
  if (percentage <= 0 || percentage > 1) return null;

  return percentage;
}

function parseDateInput(value: string) {
  if (value.trim() === "") return null;

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;

  return date;
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

function alignmentClass(align: TableColumn["align"]) {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
}

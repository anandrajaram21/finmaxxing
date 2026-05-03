"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CaretDownIcon, PlusIcon, XIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";

type FieldOption = {
  currentNav?: number | null;
  label: string;
  value: string;
};

type TransactionCreateDialogProps = {
  actionLabel: string;
  investmentOptions: FieldOption[];
  label: string;
};

export function TransactionCreateDialog({
  actionLabel,
  investmentOptions,
  label,
}: TransactionCreateDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [investmentId, setInvestmentId] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [type, setType] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [nav, setNav] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();
  const titleId = useId();
  const errorId = useId();
  const utils = api.useUtils();
  const createTransaction = api.transactions.create.useMutation();

  const parsedInvestmentId = useMemo(() => {
    const parsed = Number(investmentId);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, [investmentId]);
  const selectedInvestment = useMemo(
    () => investmentOptions.find((option) => option.value === investmentId),
    [investmentId, investmentOptions],
  );

  const parsedDate = useMemo(
    () => parseDate(transactionDate),
    [transactionDate],
  );
  const amountMinor = useMemo(() => parseMoneyMinor(amount), [amount]);
  const navValue = useMemo(() => parsePositiveNumber(nav), [nav]);
  const unitsValue = useMemo(() => {
    if (amountMinor === null || navValue === null) return null;

    const calculatedUnits = amountMinor / 100 / navValue;
    return Number.isFinite(calculatedUnits) && calculatedUnits > 0
      ? calculatedUnits
      : null;
  }, [amountMinor, navValue]);
  const units = useMemo(
    () => (unitsValue === null ? "" : formatUnitsInput(unitsValue)),
    [unitsValue],
  );

  const isFormValid =
    parsedInvestmentId !== null &&
    parsedDate !== null &&
    amountMinor !== null &&
    unitsValue !== null &&
    navValue !== null;
  const errorMessage = formError ?? createTransaction.error?.message;

  useEffect(() => {
    if (!isOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !createTransaction.isPending) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [createTransaction.isPending, isOpen]);

  useEffect(() => {
    if (!isOpen || !investmentId) return;

    setNav(
      typeof selectedInvestment?.currentNav === "number"
        ? formatNumberInput(selectedInvestment.currentNav)
        : "",
    );
  }, [investmentId, isOpen, selectedInvestment?.currentNav]);

  function resetForm() {
    setInvestmentId("");
    setTransactionDate("");
    setType("buy");
    setAmount("");
    setNav("");
    setNotes("");
    setFormError(null);
    createTransaction.reset();
  }

  function closeDialog() {
    if (createTransaction.isPending) return;

    setIsOpen(false);
    resetForm();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (
      !isFormValid ||
      parsedInvestmentId === null ||
      parsedDate === null ||
      amountMinor === null ||
      unitsValue === null ||
      navValue === null
    ) {
      setFormError("Enter investment, date, amount, and NAV.");
      return;
    }

    try {
      await createTransaction.mutateAsync({
        amountMinor,
        investmentId: parsedInvestmentId,
        nav: navValue,
        notes: notes.trim() || null,
        transactionDate: parsedDate,
        type,
        units: unitsValue,
      });

      await utils.transactions.list.invalidate();
      router.refresh();
      setIsOpen(false);
      resetForm();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Transaction could not be created.",
      );
    }
  }

  return (
    <>
      <Button className="w-fit" onClick={() => setIsOpen(true)} type="button">
        <PlusIcon className="size-4" weight="bold" />
        {actionLabel}
      </Button>

      {isOpen ? (
        <div
          aria-labelledby={titleId}
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          role="dialog"
        >
          <div className="border-border bg-card text-card-foreground flex max-h-[min(720px,calc(100vh-2rem))] w-full max-w-lg flex-col border shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <h2 id={titleId} className="text-sm font-semibold">
                {actionLabel}
              </h2>
              <Button
                aria-label={`Close ${label} dialog`}
                disabled={createTransaction.isPending}
                onClick={closeDialog}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <XIcon className="size-4" />
              </Button>
            </div>

            <form
              aria-describedby={errorMessage ? errorId : undefined}
              className="grid gap-4 overflow-auto p-4"
              onSubmit={handleSubmit}
            >
              <SelectField
                disabled={investmentOptions.length === 0}
                label="Investment"
                onChange={setInvestmentId}
                options={investmentOptions}
                placeholder={
                  investmentOptions.length > 0
                    ? "Select investment"
                    : "No investments found"
                }
                value={investmentId}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Date"
                  onChange={setTransactionDate}
                  placeholder="2026-05-01"
                  type="date"
                  value={transactionDate}
                />
                <SelectField
                  label="Type"
                  onChange={(value) =>
                    setType(value === "sell" ? "sell" : "buy")
                  }
                  options={[
                    { label: "Buy", value: "buy" },
                    { label: "Sell", value: "sell" },
                  ]}
                  placeholder="Select type"
                  value={type}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <InputField
                  inputMode="decimal"
                  label="Amount"
                  min="0.01"
                  onChange={setAmount}
                  placeholder="25000"
                  step="0.01"
                  type="number"
                  value={amount}
                />
                <InputField
                  inputMode="decimal"
                  label="Units"
                  min="0.000001"
                  onChange={() => undefined}
                  placeholder="100.596"
                  readOnly
                  step="0.000001"
                  type="number"
                  value={units}
                />
                <InputField
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

              {errorMessage ? (
                <p id={errorId} className="text-destructive text-xs">
                  {errorMessage}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-2 border-t pt-4">
                <Button
                  disabled={createTransaction.isPending}
                  onClick={closeDialog}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  disabled={!isFormValid || createTransaction.isPending}
                  type="submit"
                >
                  <PlusIcon className="size-4" weight="bold" />
                  {createTransaction.isPending ? "Saving" : actionLabel}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function InputField({
  inputMode,
  label,
  min,
  onChange,
  placeholder,
  readOnly = false,
  step,
  type = "text",
  value,
}: {
  inputMode?: "decimal" | "numeric";
  label: string;
  min?: string;
  onChange: (value: string) => void;
  placeholder: string;
  readOnly?: boolean;
  step?: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium">{label}</span>
      <input
        className="border-input bg-background focus-visible:ring-ring read-only:bg-muted/50 h-9 w-full rounded-sm border px-3 text-sm outline-none focus-visible:ring-1 read-only:cursor-default"
        inputMode={inputMode}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
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
  options: FieldOption[];
  placeholder: string;
  value: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium">{label}</span>
      <span className="relative block">
        <select
          className="border-input bg-background focus-visible:ring-ring h-9 w-full appearance-none rounded-sm border px-3 pr-10 text-sm outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50"
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
        <CaretDownIcon
          aria-hidden="true"
          className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
        />
      </span>
    </label>
  );
}

function parseMoneyMinor(value: string) {
  const parsed = parsePositiveNumber(value);
  if (parsed === null) return null;

  return Math.round(parsed * 100);
}

function formatUnitsInput(value: number) {
  return formatNumberInput(value, 6);
}

function formatNumberInput(value: number, maximumFractionDigits = 4) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits,
    minimumFractionDigits: 0,
    useGrouping: false,
  });
}

function parsePositiveNumber(value: string) {
  if (value.trim() === "") return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return parsed;
}

function parseDate(value: string) {
  if (value.trim() === "") return null;

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

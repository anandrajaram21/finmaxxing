"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { DialogFooter, DialogShell } from "@/app/_components/dialog-shell";
import {
  InputField,
  SelectField,
  TextareaField,
} from "@/app/_components/form-controls";
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
    if (!isOpen || !investmentId) return;

    setNav(
      typeof selectedInvestment?.currentNav === "number"
        ? formatNumberInput(selectedInvestment.currentNav)
        : "",
    );
  }, [investmentId, isOpen, selectedInvestment?.currentNav]);

  function openDialog() {
    setTransactionDate(formatDateInput(new Date()));
    setIsOpen(true);
  }

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
      <Button className="w-fit" onClick={openDialog} type="button">
        <PlusIcon className="size-4" weight="bold" />
        {actionLabel}
      </Button>

      {isOpen ? (
        <DialogShell
          description={label}
          isPending={createTransaction.isPending}
          onClose={closeDialog}
          title={actionLabel}
        >
          <form
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

            <TextareaField
              label="Notes"
              maxLength={1024}
              onChange={setNotes}
              placeholder="Monthly SIP"
              value={notes}
            />

            <DialogFooter
              error={errorMessage}
              isPending={createTransaction.isPending}
              isValid={isFormValid}
              onClose={closeDialog}
              submitLabel={actionLabel}
            />
          </form>
        </DialogShell>
      ) : null}
    </>
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

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

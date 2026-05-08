"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, XIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import {
  investmentTypeLabels,
  type InvestmentType,
  investmentTypes,
} from "@/lib/investments";
import { api } from "@/trpc/react";

type InvestmentCreateDialogProps = {
  actionLabel: string;
  label: string;
};

export function InvestmentCreateDialog({
  actionLabel,
  label,
}: InvestmentCreateDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [investmentType, setInvestmentType] = useState<InvestmentType>("stock");
  const [name, setName] = useState("");
  const [tickerSymbol, setTickerSymbol] = useState("");
  const [monthlySip, setMonthlySip] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();
  const titleId = useId();
  const errorId = useId();
  const utils = api.useUtils();
  const createInvestment = api.investments.create.useMutation();

  const monthlySipMinor = useMemo(() => {
    if (monthlySip.trim() === "") return null;

    const parsed = Number(monthlySip);
    if (!Number.isFinite(parsed) || parsed < 0) return null;

    return Math.round(parsed * 100);
  }, [monthlySip]);

  const isFormValid =
    name.trim().length > 0 &&
    tickerSymbol.trim().length > 0 &&
    monthlySipMinor !== null;
  const errorMessage = formError ?? createInvestment.error?.message;

  useEffect(() => {
    if (!isOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !createInvestment.isPending) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [createInvestment.isPending, isOpen]);

  function resetForm() {
    setInvestmentType("stock");
    setName("");
    setTickerSymbol("");
    setMonthlySip("");
    setFormError(null);
    createInvestment.reset();
  }

  function closeDialog() {
    if (createInvestment.isPending) return;

    setIsOpen(false);
    resetForm();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!isFormValid || monthlySipMinor === null) {
      setFormError(
        "Enter an investment name, quote identifier, and monthly SIP.",
      );
      return;
    }

    try {
      await createInvestment.mutateAsync({
        investmentType,
        monthlySipMinor,
        name: name.trim(),
        tickerSymbol: tickerSymbol.trim(),
      });

      await utils.investments.list.invalidate();
      router.refresh();
      setIsOpen(false);
      resetForm();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Investment could not be created.",
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
                disabled={createInvestment.isPending}
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
              <label className="grid gap-1.5">
                <span className="text-xs font-medium">
                  Mutual fund / stock / ETF name
                </span>
                <input
                  autoFocus
                  className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-sm border px-3 text-sm outline-none focus-visible:ring-1"
                  name="name"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Nifty 50 Index"
                  required
                  type="text"
                  value={name}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium">Type</span>
                  <select
                    className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-sm border px-3 text-sm outline-none focus-visible:ring-1"
                    name="investmentType"
                    onChange={(event) =>
                      setInvestmentType(event.target.value as InvestmentType)
                    }
                    required
                    value={investmentType}
                  >
                    {investmentTypes.map((type) => (
                      <option key={type} value={type}>
                        {investmentTypeLabels[type]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1.5">
                  <span className="text-xs font-medium">
                    {investmentType === "mutual_fund"
                      ? "MFAPI scheme code"
                      : "Yahoo ticker"}
                  </span>
                  <input
                    autoCapitalize="characters"
                    className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-sm border px-3 text-sm outline-none focus-visible:ring-1"
                    name="tickerSymbol"
                    onChange={(event) => setTickerSymbol(event.target.value)}
                    placeholder={
                      investmentType === "mutual_fund" ? "125497" : "NIFTYBEES"
                    }
                    required
                    type="text"
                    value={tickerSymbol}
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium">SIP amount</span>
                  <input
                    className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-sm border px-3 text-sm outline-none focus-visible:ring-1"
                    inputMode="decimal"
                    min="0"
                    name="monthlySip"
                    onChange={(event) => setMonthlySip(event.target.value)}
                    placeholder="25000"
                    required
                    step="0.01"
                    type="number"
                    value={monthlySip}
                  />
                </label>
              </div>

              {errorMessage ? (
                <p id={errorId} className="text-destructive text-xs">
                  {errorMessage}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-2 border-t pt-4">
                <Button
                  disabled={createInvestment.isPending}
                  onClick={closeDialog}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  disabled={!isFormValid || createInvestment.isPending}
                  type="submit"
                >
                  <PlusIcon className="size-4" weight="bold" />
                  {createInvestment.isPending ? "Saving" : actionLabel}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

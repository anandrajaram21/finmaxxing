"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { DialogFooter, DialogShell } from "@/app/_components/dialog-shell";
import { InputField } from "@/app/_components/form-controls";
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
  const [name, setName] = useState("");
  const [tickerSymbol, setTickerSymbol] = useState("");
  const [monthlySip, setMonthlySip] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();
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

  function resetForm() {
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
      setFormError("Enter an investment name, ticker symbol, and monthly SIP.");
      return;
    }

    try {
      await createInvestment.mutateAsync({
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
        <DialogShell
          description={label}
          isPending={createInvestment.isPending}
          onClose={closeDialog}
          title={actionLabel}
        >
          <form
            className="grid gap-4 overflow-auto p-4"
            onSubmit={handleSubmit}
          >
            <InputField
              autoFocus
              label="Mutual fund / stock / ETF name"
              onChange={setName}
              placeholder="Nifty 50 Index"
              value={name}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label="Ticker symbol"
                onChange={setTickerSymbol}
                placeholder="NIFTYBEES"
                value={tickerSymbol}
              />
              <InputField
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
            <DialogFooter
              error={errorMessage}
              isPending={createInvestment.isPending}
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

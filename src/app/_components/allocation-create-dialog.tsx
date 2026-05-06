"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { DialogFooter, DialogShell } from "@/app/_components/dialog-shell";
import { InputField, SelectField } from "@/app/_components/form-controls";
import { api } from "@/trpc/react";

type FieldOption = {
  allocatedPercent?: number;
  label: string;
  monthlySipMinor?: number;
  value: string;
};

type AllocationCreateDialogProps = {
  actionLabel: string;
  goalOptions: FieldOption[];
  investmentOptions: FieldOption[];
  label: string;
};

export function AllocationCreateDialog({
  actionLabel,
  goalOptions,
  investmentOptions,
  label,
}: AllocationCreateDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [investmentId, setInvestmentId] = useState("");
  const [goalId, setGoalId] = useState("");
  const [percentage, setPercentage] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();
  const utils = api.useUtils();
  const createAllocation = api.allocations.create.useMutation();
  const selectedInvestment = useMemo(
    () => investmentOptions.find((option) => option.value === investmentId),
    [investmentId, investmentOptions],
  );

  const parsedInvestmentId = useMemo(
    () => parsePositiveInteger(investmentId),
    [investmentId],
  );
  const parsedGoalId = useMemo(() => parsePositiveInteger(goalId), [goalId]);
  const percentageValue = useMemo(
    () => parseAllocationPercentage(percentage),
    [percentage],
  );

  const isFormValid =
    parsedInvestmentId !== null &&
    parsedGoalId !== null &&
    percentageValue !== null;
  const errorMessage = formError ?? createAllocation.error?.message;

  function resetForm() {
    setInvestmentId("");
    setGoalId("");
    setPercentage("");
    setFormError(null);
    createAllocation.reset();
  }

  function closeDialog() {
    if (createAllocation.isPending) return;

    setIsOpen(false);
    resetForm();
  }

  function handleInvestmentChange(value: string) {
    setInvestmentId(value);
    const option = investmentOptions.find(
      (candidate) => candidate.value === value,
    );
    const remainingPercent =
      option?.allocatedPercent === undefined
        ? 1
        : Math.max(0, 1 - option.allocatedPercent);

    setPercentage(
      formatPercentInput(remainingPercent > 0 ? remainingPercent : 1),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (
      !isFormValid ||
      parsedInvestmentId === null ||
      parsedGoalId === null ||
      percentageValue === null
    ) {
      setFormError("Select an investment and goal, then enter a percentage.");
      return;
    }

    try {
      await createAllocation.mutateAsync({
        goalId: parsedGoalId,
        investmentId: parsedInvestmentId,
        percentage: percentageValue,
      });

      await utils.allocations.list.invalidate();
      router.refresh();
      setIsOpen(false);
      resetForm();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Allocation could not be created.",
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
          isPending={createAllocation.isPending}
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
              onChange={handleInvestmentChange}
              options={investmentOptions}
              placeholder={
                investmentOptions.length > 0
                  ? "Select investment"
                  : "No investments found"
              }
              value={investmentId}
            />

            <SelectField
              disabled={goalOptions.length === 0}
              label="Goal"
              onChange={setGoalId}
              options={goalOptions}
              placeholder={
                goalOptions.length > 0 ? "Select goal" : "No goals found"
              }
              value={goalId}
            />

            <InputField
              inputMode="decimal"
              label="Percentage"
              min="0.01"
              onChange={setPercentage}
              placeholder="70"
              step="0.01"
              type="number"
              value={percentage}
            />

            {selectedInvestment?.allocatedPercent !== undefined ? (
              <p className="text-muted-foreground text-xs">
                Currently allocated:{" "}
                {formatPercentInput(selectedInvestment.allocatedPercent)}%
              </p>
            ) : null}

            <DialogFooter
              error={errorMessage}
              isPending={createAllocation.isPending}
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

function parsePositiveInteger(value: string) {
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

function formatPercentInput(value: number) {
  return Number((value * 100).toFixed(2)).toString();
}

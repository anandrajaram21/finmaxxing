"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CaretDownIcon, PlusIcon, XIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";

type FieldOption = {
  label: string;
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
  const titleId = useId();
  const errorId = useId();
  const utils = api.useUtils();
  const createAllocation = api.allocations.create.useMutation();

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

  useEffect(() => {
    if (!isOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !createAllocation.isPending) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [createAllocation.isPending, isOpen]);

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
                disabled={createAllocation.isPending}
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

              <label className="grid gap-1.5">
                <span className="text-xs font-medium">Percentage</span>
                <input
                  className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-sm border px-3 text-sm outline-none focus-visible:ring-1"
                  inputMode="decimal"
                  min="0.01"
                  onChange={(event) => setPercentage(event.target.value)}
                  placeholder="70"
                  required
                  step="0.01"
                  type="number"
                  value={percentage}
                />
              </label>

              {errorMessage ? (
                <p id={errorId} className="text-destructive text-xs">
                  {errorMessage}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-2 border-t pt-4">
                <Button
                  disabled={createAllocation.isPending}
                  onClick={closeDialog}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  disabled={!isFormValid || createAllocation.isPending}
                  type="submit"
                >
                  <PlusIcon className="size-4" weight="bold" />
                  {createAllocation.isPending ? "Saving" : actionLabel}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
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

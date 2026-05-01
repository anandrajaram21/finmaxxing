"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, XIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";

type GoalCreateDialogProps = {
  actionLabel: string;
  label: string;
};

export function GoalCreateDialog({
  actionLabel,
  label,
}: GoalCreateDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetYear, setTargetYear] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();
  const titleId = useId();
  const errorId = useId();
  const utils = api.useUtils();
  const createGoal = api.goals.create.useMutation();

  const targetAmountMinor = useMemo(() => {
    if (targetAmount.trim() === "") return null;

    const parsed = Number(targetAmount);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;

    return Math.round(parsed * 100);
  }, [targetAmount]);

  const targetYearValue = useMemo(() => {
    if (targetYear.trim() === "") return null;

    const parsed = Number(targetYear);
    if (!Number.isInteger(parsed) || parsed <= 0) return null;

    return parsed;
  }, [targetYear]);

  const isFormValid =
    name.trim().length > 0 &&
    targetAmountMinor !== null &&
    targetYearValue !== null;
  const errorMessage = formError ?? createGoal.error?.message;

  useEffect(() => {
    if (!isOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !createGoal.isPending) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [createGoal.isPending, isOpen]);

  function resetForm() {
    setName("");
    setTargetAmount("");
    setTargetYear("");
    setFormError(null);
    createGoal.reset();
  }

  function closeDialog() {
    if (createGoal.isPending) return;

    setIsOpen(false);
    resetForm();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (
      !isFormValid ||
      targetAmountMinor === null ||
      targetYearValue === null
    ) {
      setFormError("Enter a goal name, target amount, and target year.");
      return;
    }

    try {
      await createGoal.mutateAsync({
        name: name.trim(),
        targetAmountMinor,
        targetYear: targetYearValue,
      });

      await utils.goals.list.invalidate();
      router.refresh();
      setIsOpen(false);
      resetForm();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Goal could not be created.",
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
                disabled={createGoal.isPending}
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
                <span className="text-xs font-medium">Goal name</span>
                <input
                  autoFocus
                  className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-sm border px-3 text-sm outline-none focus-visible:ring-1"
                  name="name"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Retirement corpus"
                  required
                  type="text"
                  value={name}
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-medium">Target amount</span>
                <input
                  className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-sm border px-3 text-sm outline-none focus-visible:ring-1"
                  inputMode="decimal"
                  min="1"
                  name="targetAmount"
                  onChange={(event) => setTargetAmount(event.target.value)}
                  placeholder="5000000"
                  required
                  step="0.01"
                  type="number"
                  value={targetAmount}
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-medium">Target year</span>
                <input
                  className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-sm border px-3 text-sm outline-none focus-visible:ring-1"
                  inputMode="numeric"
                  min="1"
                  name="targetYear"
                  onChange={(event) => setTargetYear(event.target.value)}
                  placeholder="2034"
                  required
                  step="1"
                  type="number"
                  value={targetYear}
                />
              </label>

              {errorMessage ? (
                <p id={errorId} className="text-destructive text-xs">
                  {errorMessage}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-2 border-t pt-4">
                <Button
                  disabled={createGoal.isPending}
                  onClick={closeDialog}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button disabled={!isFormValid || createGoal.isPending}>
                  <PlusIcon className="size-4" weight="bold" />
                  {createGoal.isPending ? "Saving" : actionLabel}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

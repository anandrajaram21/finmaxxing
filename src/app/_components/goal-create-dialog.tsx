"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { DialogFooter, DialogShell } from "@/app/_components/dialog-shell";
import { InputField } from "@/app/_components/form-controls";
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
        <DialogShell
          description={label}
          isPending={createGoal.isPending}
          onClose={closeDialog}
          title={actionLabel}
        >
          <form
            className="grid gap-4 overflow-auto p-4"
            onSubmit={handleSubmit}
          >
            <InputField
              autoFocus
              label="Goal name"
              onChange={setName}
              placeholder="Retirement corpus"
              value={name}
            />
            <InputField
              inputMode="decimal"
              label="Target amount"
              min="1"
              onChange={setTargetAmount}
              placeholder="5000000"
              step="0.01"
              type="number"
              value={targetAmount}
            />
            <InputField
              inputMode="numeric"
              label="Target year"
              min="1"
              onChange={setTargetYear}
              placeholder="2034"
              step="1"
              type="number"
              value={targetYear}
            />
            <DialogFooter
              error={errorMessage}
              isPending={createGoal.isPending}
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

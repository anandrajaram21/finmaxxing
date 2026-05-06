"use client";

import { useEffect, type ReactNode } from "react";
import { WarningCircleIcon, XIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";

type DialogShellProps = {
  children: ReactNode;
  description?: string;
  isPending?: boolean;
  onClose: () => void;
  title: string;
};

type DialogFooterProps = {
  cancelLabel?: string;
  error?: string | null;
  isPending?: boolean;
  isValid?: boolean;
  onClose: () => void;
  submitLabel: string;
};

type ConfirmDialogProps = {
  body: string;
  confirmLabel?: string;
  error?: string | null;
  isPending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
};

export function DialogShell({
  children,
  description,
  isPending = false,
  onClose,
  title,
}: DialogShellProps) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) onClose();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isPending, onClose]);

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3"
      role="dialog"
    >
      <div className="border-border bg-card text-card-foreground flex max-h-[min(760px,calc(100vh-1.5rem))] w-full max-w-lg flex-col overflow-hidden rounded-md border text-left shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">{title}</h2>
            {description ? (
              <p className="text-muted-foreground mt-1 text-xs leading-5">
                {description}
              </p>
            ) : null}
          </div>
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

export function DialogFooter({
  cancelLabel = "Cancel",
  error,
  isPending = false,
  isValid = true,
  onClose,
  submitLabel,
}: DialogFooterProps) {
  return (
    <>
      {error ? (
        <div className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-md px-3 py-2 text-xs">
          <WarningCircleIcon
            className="mt-0.5 size-3.5 shrink-0"
            weight="bold"
          />
          <span>{error}</span>
        </div>
      ) : null}
      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button
          disabled={isPending}
          onClick={onClose}
          type="button"
          variant="outline"
        >
          {cancelLabel}
        </Button>
        <Button disabled={!isValid || isPending} type="submit">
          {isPending ? "Saving" : submitLabel}
        </Button>
      </div>
    </>
  );
}

export function ConfirmDialog({
  body,
  confirmLabel = "Delete",
  error,
  isPending = false,
  onClose,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  return (
    <DialogShell isPending={isPending} onClose={onClose} title={title}>
      <div className="grid gap-4 p-4">
        <p className="text-muted-foreground text-sm leading-6">{body}</p>
        {error ? (
          <div className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-md px-3 py-2 text-xs">
            <WarningCircleIcon
              className="mt-0.5 size-3.5 shrink-0"
              weight="bold"
            />
            <span>{error}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-end gap-2 border-t pt-4">
          <Button
            disabled={isPending}
            onClick={onClose}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={isPending}
            onClick={onConfirm}
            type="button"
            variant="destructive"
          >
            {isPending ? "Deleting" : confirmLabel}
          </Button>
        </div>
      </div>
    </DialogShell>
  );
}

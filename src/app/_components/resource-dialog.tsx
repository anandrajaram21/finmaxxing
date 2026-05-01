"use client";

import { useEffect, useId, useState } from "react";
import { CaretDownIcon, PlusIcon, XIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";

type Field = {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
};

type FieldOption = {
  label: string;
  value: string;
};

type ResourceDialogProps = {
  actionLabel: string;
  fields: Field[];
  fieldOptions?: Partial<Record<string, FieldOption[]>>;
  label: string;
};

export function ResourceDialog({
  actionLabel,
  fields,
  fieldOptions,
  label,
}: ResourceDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

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
                onClick={() => setIsOpen(false)}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <XIcon className="size-4" />
              </Button>
            </div>

            <form className="grid gap-4 overflow-auto p-4">
              {fields.map((field) => {
                const options = fieldOptions?.[field.name];

                return (
                  <label key={field.name} className="grid gap-1.5">
                    <span className="text-xs font-medium">{field.label}</span>
                    {options ? (
                      <span className="relative block">
                        <select
                          className="border-input bg-background focus-visible:ring-ring h-9 w-full appearance-none rounded-sm border px-3 pr-10 text-sm outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50"
                          defaultValue=""
                          disabled={options.length === 0}
                          name={field.name}
                        >
                          <option value="" disabled>
                            {options.length > 0
                              ? `Select ${field.label.toLowerCase()}`
                              : `No ${field.label.toLowerCase()}s found`}
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
                    ) : (
                      <input
                        className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-sm border px-3 text-sm outline-none focus-visible:ring-1"
                        name={field.name}
                        placeholder={field.placeholder}
                        type={field.type ?? "text"}
                      />
                    )}
                  </label>
                );
              })}

              <div className="flex items-center justify-end gap-2 border-t pt-4">
                <Button
                  onClick={() => setIsOpen(false)}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button type="button">
                  <PlusIcon className="size-4" weight="bold" />
                  {actionLabel}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { PlusIcon } from "@phosphor-icons/react";

import { DialogShell } from "@/app/_components/dialog-shell";
import { InputField, SelectField } from "@/app/_components/form-controls";
import { Button } from "@/components/ui/button";

type Field = {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  type?: string;
};

type FieldOption = {
  label: string;
  value: string;
};

type ResourceDialogProps = {
  actionLabel: string;
  action: (formData: FormData) => void | Promise<void>;
  fields: Field[];
  fieldOptions?: Partial<Record<string, FieldOption[]>>;
  label: string;
};

export function ResourceDialog({
  action,
  actionLabel,
  fields,
  fieldOptions,
}: ResourceDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button className="w-fit" onClick={() => setIsOpen(true)} type="button">
        <PlusIcon className="size-4" weight="bold" />
        {actionLabel}
      </Button>

      {isOpen ? (
        <DialogShell onClose={() => setIsOpen(false)} title={actionLabel}>
          <form action={action} className="grid gap-4 overflow-auto p-4">
            {fields.map((field) => {
              const options = fieldOptions?.[field.name];

              return options ? (
                <SelectField
                  disabled={options.length === 0}
                  key={field.name}
                  label={field.label}
                  name={field.name}
                  options={options}
                  placeholder={
                    options.length > 0
                      ? `Select ${field.label.toLowerCase()}`
                      : `No ${field.label.toLowerCase()}s found`
                  }
                  required={field.required !== false}
                />
              ) : (
                <InputField
                  key={field.name}
                  label={field.label}
                  name={field.name}
                  placeholder={field.placeholder}
                  required={field.required !== false}
                  type={field.type ?? "text"}
                />
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
              <SubmitButton actionLabel={actionLabel} />
            </div>
          </form>
        </DialogShell>
      ) : null}
    </>
  );
}

function SubmitButton({ actionLabel }: { actionLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit">
      <PlusIcon className="size-4" weight="bold" />
      {pending ? "Saving" : actionLabel}
    </Button>
  );
}

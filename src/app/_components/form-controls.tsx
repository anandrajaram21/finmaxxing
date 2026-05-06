"use client";

import { CaretDownIcon } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

export type SelectOption = {
  label: string;
  value: string;
};

type InputFieldProps = {
  autoFocus?: boolean;
  inputMode?: "decimal" | "numeric";
  label: string;
  min?: string;
  name?: string;
  onChange?: (value: string) => void;
  placeholder: string;
  readOnly?: boolean;
  required?: boolean;
  step?: string;
  type?: string;
  value?: string;
};

type SelectFieldProps<TOption extends SelectOption = SelectOption> = {
  disabled?: boolean;
  label: string;
  name?: string;
  onChange?: (value: string) => void;
  options: TOption[];
  placeholder: string;
  required?: boolean;
  value?: string;
};

type TextareaFieldProps = {
  label: string;
  maxLength?: number;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
};

export function InputField({
  autoFocus,
  inputMode,
  label,
  min,
  name,
  onChange,
  placeholder,
  readOnly = false,
  required = true,
  step,
  type = "text",
  value,
}: InputFieldProps) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium">{label}</span>
      <input
        autoFocus={autoFocus}
        className={cn(
          "border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-1",
          "read-only:bg-muted/50 read-only:cursor-default disabled:cursor-not-allowed disabled:opacity-50",
        )}
        inputMode={inputMode}
        min={min}
        name={name}
        onChange={
          onChange ? (event) => onChange(event.target.value) : undefined
        }
        placeholder={placeholder}
        readOnly={readOnly}
        required={required}
        step={step}
        type={type}
        value={value}
      />
    </label>
  );
}

export function SelectField<TOption extends SelectOption = SelectOption>({
  disabled,
  label,
  name,
  onChange,
  options,
  placeholder,
  required = true,
  value,
}: SelectFieldProps<TOption>) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium">{label}</span>
      <span className="relative block">
        <select
          className="border-input bg-background focus-visible:ring-ring h-9 w-full appearance-none rounded-md border px-3 pr-10 text-sm outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
          name={name}
          onChange={
            onChange ? (event) => onChange(event.target.value) : undefined
          }
          required={required}
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

export function TextareaField({
  label,
  maxLength,
  onChange,
  placeholder,
  value,
}: TextareaFieldProps) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium">{label}</span>
      <textarea
        className="border-input bg-background focus-visible:ring-ring min-h-20 w-full resize-none rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-1"
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

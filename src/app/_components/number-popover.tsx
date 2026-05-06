import type { ReactNode } from "react";

export type NumberDisplayValue = {
  full: string;
  kind: "number-display";
  value: string;
};

export function numberDisplay(value: string, full: string): NumberDisplayValue {
  return { full, kind: "number-display", value };
}

export function isNumberDisplayValue(
  value: unknown,
): value is NumberDisplayValue {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    value.kind === "number-display"
  );
}

export function NumberPopover({
  children,
  full,
}: {
  children: ReactNode;
  full: string;
}) {
  return (
    <span className="group/number relative inline-flex max-w-full items-center">
      <span className="truncate" tabIndex={0}>
        {children}
      </span>
      <span className="bg-popover text-popover-foreground border-border pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden max-w-[min(20rem,80vw)] -translate-x-1/2 border px-2 py-1 text-xs whitespace-nowrap shadow-lg group-focus-within/number:block group-hover/number:block">
        {full}
      </span>
    </span>
  );
}

export function FormattedNumber({ value }: { value: NumberDisplayValue }) {
  return <NumberPopover full={value.full}>{value.value}</NumberPopover>;
}

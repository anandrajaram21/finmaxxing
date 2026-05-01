"use client";

import { useState } from "react";
import { CaretRightIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TableColumn = {
  label: string;
  align?: "left" | "right" | "center";
};

type TableRowDetail = {
  label: string;
  value: string;
};

type TableRow = {
  cells: string[];
  details?: TableRowDetail[];
  tone?: "normal" | "muted" | "accent";
};

export function ResourceTable({
  label,
  rows,
  tableColumns,
}: {
  label: string;
  rows: TableRow[];
  tableColumns: TableColumn[];
}) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const hasExpandableRows = rows.some((row) => row.details?.length);

  return (
    <section className="border-border bg-card text-card-foreground min-w-0 border">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <h2 className="text-sm font-semibold">{label}</h2>
        <span className="text-muted-foreground text-xs">
          {rows.length} rows
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground border-b text-xs">
              {tableColumns.map((column) => (
                <th
                  key={column.label}
                  className={cn(
                    "px-4 py-2 font-medium",
                    alignmentClass(column.align),
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowKey = row.cells.join("-");
              const isExpanded = expandedRow === rowKey;
              const canExpand = Boolean(row.details?.length);

              return (
                <FragmentRow
                  canExpand={canExpand}
                  isExpanded={isExpanded}
                  key={rowKey}
                  onToggle={() =>
                    setExpandedRow(isExpanded || !canExpand ? null : rowKey)
                  }
                  row={row}
                  tableColumns={tableColumns}
                  showButton={hasExpandableRows}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FragmentRow({
  canExpand,
  isExpanded,
  onToggle,
  row,
  showButton,
  tableColumns,
}: {
  canExpand: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  row: TableRow;
  showButton: boolean;
  tableColumns: TableColumn[];
}) {
  return (
    <>
      <tr
        className={cn(
          "border-border border-b",
          row.tone === "accent" && "bg-primary/5",
          row.tone === "muted" && "text-muted-foreground",
          isExpanded && "bg-muted/30",
        )}
      >
        {row.cells.map((cell, index) => (
          <td
            key={`${cell}-${index}`}
            className={cn(
              "px-4 py-3 align-middle",
              alignmentClass(tableColumns[index]?.align),
            )}
          >
            {index === 0 && showButton ? (
              <span className="flex min-w-0 items-center gap-2">
                <Button
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? "Collapse" : "Expand"} ${cell}`}
                  disabled={!canExpand}
                  onClick={onToggle}
                  size="icon-xs"
                  type="button"
                  variant="ghost"
                >
                  <CaretRightIcon
                    className={cn(
                      "size-3 transition-transform",
                      isExpanded && "rotate-90",
                    )}
                    weight="bold"
                  />
                </Button>
                <span className="truncate">{cell}</span>
              </span>
            ) : (
              cell
            )}
          </td>
        ))}
      </tr>
      {isExpanded ? (
        <tr className="border-border bg-muted/20 border-b">
          <td className="px-4 py-4" colSpan={tableColumns.length}>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {row.details?.map((detail) => (
                <div key={detail.label} className="min-w-0">
                  <dt className="text-muted-foreground text-xs">
                    {detail.label}
                  </dt>
                  <dd className="mt-1 truncate text-sm font-medium">
                    {detail.value}
                  </dd>
                </div>
              ))}
            </dl>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function alignmentClass(align: TableColumn["align"]) {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
}

"use client";

import { useState, type ReactNode } from "react";
import { ListIcon, XIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";

type WorkspaceMobileNavProps = {
  action?: ReactNode;
  children: ReactNode;
  label: string;
};

export function WorkspaceMobileNav({
  action,
  children,
  label,
}: WorkspaceMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-border bg-background/95 sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b px-3 backdrop-blur lg:hidden">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setIsOpen((current) => !current)}
          size="icon"
          type="button"
          variant="outline"
        >
          {isOpen ? (
            <XIcon className="size-4" weight="bold" />
          ) : (
            <ListIcon className="size-4" weight="bold" />
          )}
        </Button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{label}</p>
          <p className="text-muted-foreground truncate text-xs">Finmaxxing</p>
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}

      {isOpen ? (
        <div className="fixed inset-0 top-14 z-50 bg-black/45">
          <div className="bg-sidebar text-sidebar-foreground border-sidebar-border h-[calc(100vh-3.5rem)] w-full max-w-sm overflow-auto border-r shadow-xl">
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
}

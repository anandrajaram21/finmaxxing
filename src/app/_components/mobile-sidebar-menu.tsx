"use client";

import { useState, type ReactNode } from "react";
import { ListIcon } from "@phosphor-icons/react";

type MobileSidebarMenuProps = {
  children: ReactNode;
};

export function MobileSidebarMenu({ children }: MobileSidebarMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  function toggleMenu() {
    setIsOpen((currentIsOpen) => !currentIsOpen);
  }

  return (
    <div className="static lg:hidden">
      <button
        aria-expanded={isOpen}
        aria-label="Open navigation menu"
        className="border-border bg-background text-foreground flex size-9 items-center justify-center rounded-sm border"
        onClick={toggleMenu}
        type="button"
      >
        <ListIcon className="size-5" weight="bold" />
      </button>

      {isOpen ? (
        <div className="border-border bg-sidebar text-sidebar-foreground absolute top-full right-0 left-0 z-50 border-t border-b shadow-xl">
          {children}
        </div>
      ) : null}
    </div>
  );
}

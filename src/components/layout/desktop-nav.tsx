"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";
import { useData } from "@/context/data-context";
import { cn } from "@/lib/utils";

export function DesktopNav() {
  const pathname = usePathname();
  const { db } = useData();
  const lowStockCount = db.stock.filter((s) => s.qty <= s.low).length;

  return (
    <nav className="hidden border-t border-border/70 bg-brand-cream/60 md:block">
      <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-1.5 md:px-8">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-maroon text-brand-cream"
                  : "text-brand-maroon-dark/70 hover:bg-brand-maroon/10 hover:text-brand-maroon-dark"
              )}
            >
              <Icon className="size-4" />
              {item.label}
              {item.href === "/stock" && lowStockCount > 0 && (
                <span className="flex size-4.5 items-center justify-center rounded-full bg-destructive text-[0.65rem] font-semibold text-destructive-foreground">
                  {lowStockCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS } from "./nav-items";
import { useData } from "@/context/data-context";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { db } = useData();
  const lowStockCount = db.stock.filter((s) => s.qty <= s.low).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="md:hidden" />}
      >
        <Menu className="size-5" />
        <span className="sr-only">Open menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-brand-maroon-dark">
            <span className="relative inline-flex size-8 shrink-0">
              <Image
                src="/logo-icon.png"
                alt=""
                fill
                sizes="32px"
                className="object-contain"
              />
            </span>
            Chetana Crafts
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-maroon text-brand-cream"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <Icon className="size-4.5" />
                {item.label}
                {item.href === "/stock" && lowStockCount > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-destructive text-[0.7rem] font-semibold text-destructive-foreground">
                    {lowStockCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

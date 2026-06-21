import Link from "next/link";
import { Receipt, ShoppingBag, Undo2, Boxes } from "lucide-react";

const QUICK_ACTIONS = [
  { href: "/bill", label: "New Bill", icon: Receipt },
  { href: "/orders", label: "Take Order", icon: ShoppingBag },
  { href: "/returns", label: "Return Item", icon: Undo2 },
  { href: "/stock", label: "Add Stock", icon: Boxes },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 text-center transition-colors hover:bg-brand-maroon"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-brand-maroon/10 text-brand-maroon transition-colors group-hover:bg-brand-cream/20 group-hover:text-brand-cream">
              <Icon className="size-6" />
            </span>
            <span className="font-medium transition-colors group-hover:text-brand-cream">
              {action.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

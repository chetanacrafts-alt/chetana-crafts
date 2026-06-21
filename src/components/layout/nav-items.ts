import {
  LayoutDashboard,
  CalendarDays,
  Receipt,
  ShoppingBag,
  Undo2,
  Boxes,
  Truck,
  Globe,
  TrendingUp,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/daily", label: "Daily", icon: CalendarDays },
  { href: "/bill", label: "Bill", icon: Receipt },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/returns", label: "Returns", icon: Undo2 },
  { href: "/stock", label: "Stock", icon: Boxes },
  { href: "/purchases", label: "Purchases", icon: Truck },
  { href: "/online", label: "Online Sales", icon: Globe },
  { href: "/spend-profit", label: "Spend & Profit", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
];

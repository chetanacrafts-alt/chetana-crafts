"use client";

import { CheckCircle2, RefreshCw, WifiOff } from "lucide-react";
import { useData } from "@/context/data-context";
import { cn } from "@/lib/utils";

export function SyncBadge() {
  const { syncStatus } = useData();

  const config = {
    synced: {
      label: "Synced",
      icon: CheckCircle2,
      className: "bg-success/15 text-success border-success/30",
    },
    syncing: {
      label: "Syncing",
      icon: RefreshCw,
      className: "bg-warning/20 text-brand-maroon-dark border-warning/40",
    },
    offline: {
      label: "Offline",
      icon: WifiOff,
      className: "bg-muted text-muted-foreground border-border",
    },
    error: {
      label: "Offline",
      icon: WifiOff,
      className: "bg-destructive/10 text-destructive border-destructive/30",
    },
    idle: {
      label: "Offline",
      icon: WifiOff,
      className: "bg-muted text-muted-foreground border-border",
    },
  }[syncStatus];

  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        config.className
      )}
    >
      <Icon
        className={cn("size-3.5", syncStatus === "syncing" && "animate-spin")}
      />
      <span className="hidden sm:inline">{config.label}</span>
    </span>
  );
}

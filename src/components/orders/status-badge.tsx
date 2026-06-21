import { cn } from "@/lib/utils";

export const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-muted text-muted-foreground",
  Packed: "bg-warning/20 text-brand-maroon-dark",
  Shipped: "bg-brand-gold/30 text-brand-maroon-dark",
  Delivered: "bg-success/15 text-success",
};

interface StatusBadgeProps {
  status: string;
  onClick?: () => void;
}

export function StatusBadge({ status, onClick }: StatusBadgeProps) {
  const className = cn(
    "rounded-full px-2.5 py-1 text-xs font-medium",
    STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
    onClick && "transition-opacity hover:opacity-80"
  );

  if (!onClick) return <span className={className}>{status}</span>;

  return (
    <button type="button" onClick={onClick} className={className} title="Click to advance status">
      {status}
    </button>
  );
}

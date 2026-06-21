import { cn } from "@/lib/utils";

interface SegmentedToggleProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  size?: "default" | "sm";
}

export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  size = "default",
}: SegmentedToggleProps<T>) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-muted p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            size === "sm" && "px-2.5 py-1 text-xs",
            value === opt.value
              ? "bg-brand-maroon text-brand-cream shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

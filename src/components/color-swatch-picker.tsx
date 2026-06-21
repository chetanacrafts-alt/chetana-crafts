"use client";

import { useState } from "react";
import { PRESET_COLORS, isPresetColor, colorHex } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export function ColorDot({ name, className }: { name: string; className?: string }) {
  return (
    <span
      title={name}
      className={cn(
        "inline-block size-3 shrink-0 rounded-full",
        name.toLowerCase() === "white" && "border border-border",
        className
      )}
      style={{ backgroundColor: colorHex(name) }}
    />
  );
}

interface ColorSwatchPickerProps {
  value: string;
  onChange: (value: string) => void;
}

/** Remount with a fresh `key` (e.g. keyed on an editing id) when the picker
 * needs to reset to a different record — see Stock/Purchase forms. */
export function ColorSwatchPicker({ value, onChange }: ColorSwatchPickerProps) {
  const isOther = value !== "" && !isPresetColor(value);
  const [otherActive, setOtherActive] = useState(isOther);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {PRESET_COLORS.map((c) => (
          <button
            key={c.name}
            type="button"
            title={c.name}
            onClick={() => {
              setOtherActive(false);
              onChange(c.name);
            }}
            className={cn(
              "size-6 rounded-full ring-2 ring-offset-2 ring-offset-background transition-transform",
              value === c.name
                ? "scale-110 ring-brand-maroon"
                : "ring-transparent hover:scale-105 hover:ring-border",
              c.name === "White" && "border border-border"
            )}
            style={{ backgroundColor: c.hex }}
          >
            <span className="sr-only">{c.name}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setOtherActive(true);
            onChange("");
          }}
          className={cn(
            "flex h-6 items-center rounded-full border px-2.5 text-xs font-medium transition-colors",
            otherActive
              ? "border-brand-maroon bg-brand-maroon/10 text-brand-maroon-dark"
              : "border-border text-muted-foreground hover:bg-muted"
          )}
        >
          Other
        </button>
      </div>
      {otherActive && (
        <Input
          autoFocus
          value={isOther ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Custom colour name"
          className="max-w-48"
        />
      )}
    </div>
  );
}

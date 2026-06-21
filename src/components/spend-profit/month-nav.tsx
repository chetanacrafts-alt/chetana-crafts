"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addMonths, formatMonthLabel, type MonthKey } from "@/lib/dates";

interface MonthNavProps {
  monthKey: MonthKey;
  onChange: (key: MonthKey) => void;
}

export function MonthNav({ monthKey, onChange }: MonthNavProps) {
  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="icon" onClick={() => onChange(addMonths(monthKey, -1))}>
        <ChevronLeft className="size-4" />
        <span className="sr-only">Previous month</span>
      </Button>
      <span className="min-w-36 text-center font-medium">{formatMonthLabel(monthKey)}</span>
      <Button type="button" variant="outline" size="icon" onClick={() => onChange(addMonths(monthKey, 1))}>
        <ChevronRight className="size-4" />
        <span className="sr-only">Next month</span>
      </Button>
    </div>
  );
}

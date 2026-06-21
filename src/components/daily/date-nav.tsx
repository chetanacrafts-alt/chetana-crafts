"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDays } from "@/lib/dates";
import { todayISO } from "@/lib/format";

interface DateNavProps {
  date: string;
  onChange: (date: string) => void;
}

export function DateNav({ date, onChange }: DateNavProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="icon" onClick={() => onChange(addDays(date, -1))}>
        <ChevronLeft className="size-4" />
        <span className="sr-only">Previous day</span>
      </Button>
      <Input
        type="date"
        value={date}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="w-auto"
      />
      <Button type="button" variant="outline" size="icon" onClick={() => onChange(addDays(date, 1))}>
        <ChevronRight className="size-4" />
        <span className="sr-only">Next day</span>
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => onChange(todayISO())}>
        Today
      </Button>
    </div>
  );
}

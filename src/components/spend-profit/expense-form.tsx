"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { todayISO } from "@/lib/format";

export interface ExpenseInput {
  date: string;
  name: string;
  amt: number;
  cat: string;
}

interface ExpenseFormProps {
  onSubmit: (input: ExpenseInput) => void;
}

export function ExpenseForm({ onSubmit }: ExpenseFormProps) {
  const [date, setDate] = useState(todayISO());
  const [name, setName] = useState("");
  const [amt, setAmt] = useState("");
  const [cat, setCat] = useState<string>(
    EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]
  );

  const canSubmit = name.trim() !== "" && Number(amt) > 0;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ date, name: name.trim(), amt: Number(amt) || 0, cat });
    setDate(todayISO());
    setName("");
    setAmt("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exp-date">Date</Label>
            <Input id="exp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exp-name">Name</Label>
            <Input id="exp-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Electricity bill" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exp-amt">Amount</Label>
            <Input
              id="exp-amt"
              type="number"
              inputMode="decimal"
              min="0"
              value={amt}
              onChange={(e) => setAmt(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exp-cat">Category</Label>
            <Select value={cat} onValueChange={(v) => v && setCat(v)}>
              <SelectTrigger id="exp-cat" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-4">
            <Button type="submit" disabled={!canSubmit}>
              <Plus className="size-4" />
              Add Expense
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

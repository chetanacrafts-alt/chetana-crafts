/** Parses a "YYYY-MM-DD" string as a local-time Date — avoids the UTC
 * round-trip that shifts the calendar date by a day depending on timezone. */
export function parseISODate(dateISO: string): Date {
  const [year, month, day] = dateISO.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(dateISO: string, days: number): string {
  const d = parseISODate(dateISO);
  d.setDate(d.getDate() + days);
  return formatISODate(d);
}

export function lastNDates(n: number, endISO: string): string[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    dates.push(addDays(endISO, -i));
  }
  return dates;
}

export function shortDayLabel(dateISO: string): string {
  return parseISODate(dateISO).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export interface MonthKey {
  year: number;
  month: number; // 1-12
}

export function monthKeyFromDate(dateISO: string): MonthKey {
  const [year, month] = dateISO.split("-").map(Number);
  return { year, month };
}

export function monthRange({ year, month }: MonthKey): { start: string; end: string } {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export function addMonths(key: MonthKey, delta: number): MonthKey {
  const total = key.year * 12 + (key.month - 1) + delta;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  return { year, month };
}

export function formatMonthLabel(key: MonthKey): string {
  return new Date(key.year, key.month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export function shortMonthLabel(key: MonthKey): string {
  return new Date(key.year, key.month - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
  });
}

export function lastNMonths(n: number, endKey: MonthKey): MonthKey[] {
  const months: MonthKey[] = [];
  for (let i = n - 1; i >= 0; i--) {
    months.push(addMonths(endKey, -i));
  }
  return months;
}

export function sameMonthKey(a: MonthKey, b: MonthKey): boolean {
  return a.year === b.year && a.month === b.month;
}

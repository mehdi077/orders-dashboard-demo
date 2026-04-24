export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function dayKeyFromLocalDate(date: Date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function addDays(date: Date, delta: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}

export function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export type MonthGrid = {
  gridStart: Date;
  gridEndExclusive: Date;
  days: Array<{ date: Date; inMonth: boolean; dayKey: string }>;
};

// 6-week grid, week starts Monday.
export function getMonthGrid(monthCursor: Date): MonthGrid {
  const first = startOfMonth(monthCursor);
  const dow = first.getDay(); // 0 = Sun ... 6 = Sat
  const offsetToMonday = (dow + 6) % 7;
  const gridStart = addDays(first, -offsetToMonday);

  const days: MonthGrid["days"] = [];
  for (let i = 0; i < 42; i++) {
    const date = addDays(gridStart, i);
    days.push({
      date,
      inMonth: date.getMonth() === first.getMonth(),
      dayKey: dayKeyFromLocalDate(date),
    });
  }

  return {
    gridStart,
    gridEndExclusive: addDays(gridStart, 42),
    days,
  };
}

export function formatMonthTitle(date: Date) {
  return date.toLocaleString(undefined, { month: "long", year: "numeric" });
}

export function formatDayTitle(date: Date) {
  return date.toLocaleString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

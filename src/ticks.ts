// Pure daily-tick rules (no DOM). A day is ticked or not; a day never counts twice.
/** Ticked days per habit id, as sorted unique "YYYY-MM-DD" strings. */
export type Ticks = Record<string, string[]>;

/** Local calendar day as "YYYY-MM-DD". */
export function dayKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function isTicked(ticks: Ticks, habitId: string, day: string): boolean {
  return (ticks[habitId] ?? []).includes(day);
}

/** Set a habit's tick for a day. Idempotent: ticking twice leaves one entry. */
export function setTick(ticks: Ticks, habitId: string, day: string, done: boolean): Ticks {
  const rest = (ticks[habitId] ?? []).filter((d) => d !== day);
  const days = done ? [...rest, day].sort() : rest;
  return { ...ticks, [habitId]: days };
}

/** Drop a removed habit's ticks. */
export function clearTicks(ticks: Ticks, habitId: string): Ticks {
  const rest = { ...ticks };
  delete rest[habitId];
  return rest;
}

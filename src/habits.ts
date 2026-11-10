// Pure habit-list rules (no DOM): at most 5 habits, a habit is just a name.
export const MAX_HABITS = 5;

export interface Habit {
  id: string;
  name: string;
}

export type AddResult = { ok: true; habits: Habit[] } | { ok: false; reason: "blank" | "full" };

/** Add a habit by name. Blank names and a sixth habit are refused. */
export function addHabit(habits: Habit[], name: string, id: string): AddResult {
  const clean = name.trim();
  if (!clean) return { ok: false, reason: "blank" };
  if (habits.length >= MAX_HABITS) return { ok: false, reason: "full" };
  return { ok: true, habits: [...habits, { id, name: clean }] };
}

export function removeHabit(habits: Habit[], id: string): Habit[] {
  return habits.filter((h) => h.id !== id);
}

import { describe, expect, it } from "vitest";
import { addHabit, removeHabit, type Habit } from "../../src/habits";

const mk = (n: number): Habit[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${i}`, name: `h${i}` }));

describe("habits", () => {
  it("adds a trimmed name", () => {
    const r = addHabit([], "  Read ", "a");
    expect(r).toEqual({ ok: true, habits: [{ id: "a", name: "Read" }] });
  });
  it("refuses blank names", () => {
    expect(addHabit([], "   ", "a")).toEqual({ ok: false, reason: "blank" });
  });
  it("refuses a sixth habit", () => {
    expect(addHabit(mk(5), "x", "z")).toEqual({ ok: false, reason: "full" });
    expect(addHabit(mk(4), "x", "z").ok).toBe(true);
  });
  it("removes by id", () => {
    expect(removeHabit(mk(3), "1").map((h) => h.id)).toEqual(["0", "2"]);
  });
});

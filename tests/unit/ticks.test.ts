import { describe, expect, it } from "vitest";
import { clearTicks, dayKey, isTicked, setTick } from "../../src/ticks";

describe("ticks", () => {
  it("formats a local day", () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
  it("ticks and unticks", () => {
    const t = setTick({}, "a", "2026-11-10", true);
    expect(isTicked(t, "a", "2026-11-10")).toBe(true);
    const u = setTick(t, "a", "2026-11-10", false);
    expect(isTicked(u, "a", "2026-11-10")).toBe(false);
  });
  it("never counts the same day twice", () => {
    let t = setTick({}, "a", "2026-11-10", true);
    t = setTick(t, "a", "2026-11-10", true);
    expect(t.a).toEqual(["2026-11-10"]);
  });
  it("keeps habits separate and clears on removal", () => {
    const t = setTick(setTick({}, "a", "2026-11-09", true), "b", "2026-11-10", true);
    expect(isTicked(t, "a", "2026-11-10")).toBe(false);
    expect(clearTicks(t, "a")).toEqual({ b: ["2026-11-10"] });
  });
});

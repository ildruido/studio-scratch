import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkRoadmap, parseBacklog, roadmapBoard } from "../../scripts/roadmap/roadmap";

const sample = `# Backlog

## Roadmap

- **Now:** XX-002
- **Next:** XX-003
- **Later:** XX-004

## In progress

### XX-002 Build it

- Why: so it works. Second sentence.

## To test

_Nothing._

## Ready

### XX-003 Ale's steps: delete it

- Why: only Ale can.
- Notes: depends on XX-002.

## Backlog

### XX-004 Later idea

- Why: maybe.

## Later

## Done

- XX-001 First thing — v0.1.0 (confirmed)
`;

describe("roadmap list", () => {
  it("accepts a list that covers every open item", () => {
    expect(checkRoadmap(sample)).toEqual([]);
  });

  it("flags an open item missing from the list", () => {
    const md = sample.replace(", XX-004", "").replace("**Later:** XX-004", "**Later:**");
    expect(checkRoadmap(md)).toEqual([
      "XX-004 is open but missing from the Roadmap list (Now / Next / Later).",
    ]);
  });

  it("flags a listed id that is not open", () => {
    const md = sample.replace("**Later:** XX-004", "**Later:** XX-004, XX-001");
    expect(checkRoadmap(md)).toEqual([
      "XX-001 is in the Roadmap list but is not an open item (done, or unknown).",
    ]);
  });

  it("flags a duplicated id and a missing section", () => {
    expect(checkRoadmap(sample.replace("**Later:** XX-004", "**Later:** XX-004, XX-003"))).toEqual([
      "XX-003 appears twice in the Roadmap list.",
    ]);
    expect(checkRoadmap("# Backlog\n\n## Backlog\n")).toHaveLength(1);
  });

  it("builds the roadmap page data from the list", () => {
    const board = roadmapBoard(sample, "test");
    expect(board.order).toEqual(["XX-002", "XX-003", "XX-004"]);
    expect(board.items.map((i) => i.status)).toEqual(["building", "ale", "idea"]);
    expect(board.items[0]?.why).toBe("So it works.");
    expect(board.items[1]?.deps).toEqual(["XX-002"]);
    expect(board.done).toEqual([{ id: "XX-001", title: "First thing", version: "v0.1.0" }]);
  });

  it("parses ranges in Done title lines", () => {
    const md = sample.replace("- XX-001 First", "- XX-010a to XX-010c First");
    expect(parseBacklog(md).done[0]?.id).toBe("XX-010a to XX-010c");
  });
});

describe("docs/BACKLOG.md", () => {
  it.skipIf(!existsSync(new URL("../../docs/BACKLOG.md", import.meta.url)))(
    "has every open item in the Roadmap list",
    () => {
      const md = readFileSync(new URL("../../docs/BACKLOG.md", import.meta.url), "utf8");
      expect(checkRoadmap(md)).toEqual([]);
    },
  );
});

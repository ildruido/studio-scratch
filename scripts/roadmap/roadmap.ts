// Roadmap = the "Roadmap" list at the top of docs/BACKLOG.md (Now / Next / Later, ids in priority order).
// The roadmap page is rebuilt from it with `npm run roadmap:data`; never edit the page by hand.

export type Lane = "now" | "next" | "later";
export type Status = "ale" | "building" | "totest" | "planned" | "idea" | "later";

export interface OpenItem {
  id: string;
  title: string;
  section: string;
  why: string;
  deps: string[];
  ownerIsAle: boolean;
}

export interface DoneItem {
  id: string;
  title: string;
  version: string;
}

export interface Parsed {
  lanes: Record<Lane, string[]>;
  open: OpenItem[];
  done: DoneItem[];
}

const LANES: Lane[] = ["now", "next", "later"];

function section(md: string, name: string): string {
  const m = new RegExp(`^## ${name}\\s*$`, "m").exec(md);
  if (!m) return "";
  const rest = md.slice(m.index + m[0].length);
  const next = /^## /m.exec(rest);
  return next ? rest.slice(0, next.index) : rest;
}

function ids(text: string): string[] {
  return text.match(/[A-Z]{2,4}-\d+/g) ?? [];
}

export function parseBacklog(md: string): Parsed {
  const lanes: Record<Lane, string[]> = { now: [], next: [], later: [] };
  const roadmap = section(md, "Roadmap");
  for (const lane of LANES) {
    const label = lane[0]!.toUpperCase() + lane.slice(1);
    const m = new RegExp(`^- \\*\\*${label}:\\*\\*(.*)$`, "m").exec(roadmap);
    lanes[lane] = m ? ids(m[1] ?? "") : [];
  }

  const open: OpenItem[] = [];
  for (const name of ["In progress", "To test", "Ready", "Backlog", "Later"]) {
    const body = section(md, name);
    for (const block of body.split(/^(?=### )/m)) {
      const h = /^### ([A-Z]{2,4}-\d+)\s+(.*)$/m.exec(block);
      if (!h || block.indexOf(h[0]) !== 0) continue;
      const why = /^- Why:\s*(.*)$/m.exec(block)?.[1] ?? "";
      const notes = /^- Notes:\s*(.*)$/m.exec(block)?.[1] ?? "";
      const deps = ids(/depends on ([^.;]*)/i.exec(notes)?.[1] ?? "");
      open.push({
        id: h[1]!,
        title: h[2]!.trim(),
        section: name,
        why: why.trim(),
        deps,
        ownerIsAle: /^- Owner:\s*Ale/m.test(block) || /^Ale's /i.test(h[2]!),
      });
    }
  }

  const done: DoneItem[] = [];
  for (const line of section(md, "Done").split("\n")) {
    const m = /^- ([A-Z]{2,4}-\d+[a-z]?(?: to [A-Z]{2,4}-\d+[a-z]?)?) (.+?) — (.+)$/.exec(line);
    if (m) done.push({ id: m[1]!.trim(), title: m[2]!.trim(), version: m[3]!.trim() });
  }
  return { lanes, open, done };
}

/** Problems that make the roadmap list wrong; an empty array means it is consistent. */
export function checkRoadmap(md: string): string[] {
  const { lanes, open } = parseBacklog(md);
  const problems: string[] = [];
  if (!/^## Roadmap\s*$/m.test(md)) return ['docs/BACKLOG.md has no "## Roadmap" section.'];
  const listed = LANES.flatMap((l) => lanes[l]);
  const openIds = new Set(open.map((i) => i.id));
  for (const i of open) {
    if (!listed.includes(i.id))
      problems.push(`${i.id} is open but missing from the Roadmap list (Now / Next / Later).`);
  }
  for (const id of new Set(listed)) {
    if (!openIds.has(id))
      problems.push(`${id} is in the Roadmap list but is not an open item (done, or unknown).`);
  }
  const seen = new Set<string>();
  for (const id of listed) {
    if (seen.has(id)) problems.push(`${id} appears twice in the Roadmap list.`);
    seen.add(id);
  }
  return problems;
}

function statusOf(i: OpenItem): Status {
  if (i.ownerIsAle) return "ale";
  switch (i.section) {
    case "In progress":
      return "building";
    case "To test":
      return "totest";
    case "Ready":
      return "planned";
    case "Later":
      return "later";
    default:
      return "idea";
  }
}

function firstSentence(s: string): string {
  const t = s.replace(/\s*\((?:Ale|Claude)[^)]*\)\.?$/, "").trim();
  const m = /^(.{8,220}?[.!?])(\s|$)/.exec(t);
  const out = (m ? m[1]! : t.slice(0, 220)).trim();
  return out.charAt(0).toUpperCase() + out.slice(1);
}

/** The `roadmap/board` document for the roadmap page, rebuilt from the backlog. */
export function roadmapBoard(md: string, source: string) {
  const { lanes, open, done } = parseBacklog(md);
  const byId = new Map(open.map((i) => [i.id, i]));
  const order = LANES.flatMap((l) => lanes[l]).filter((id) => byId.has(id));
  const items = order.map((id) => {
    const i = byId.get(id)!;
    return {
      id,
      title: i.title.replace(/\s*\(.*$/, "").trim(),
      why: firstSentence(i.why),
      status: statusOf(i),
      deps: i.deps.filter((d) => byId.has(d)),
      lane: LANES.find((l) => lanes[l].includes(id))!,
    };
  });
  const shortDone = done.map((d) => ({ ...d, version: d.version.replace(/\s*\(.*$/, "").trim() }));
  return { items, done: shortDone, order, source };
}

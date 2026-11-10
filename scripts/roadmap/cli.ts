// npm run roadmap:check  -> exits 1 when an open backlog item is missing from the Roadmap list.
// npm run roadmap:data   -> prints the roadmap page data (JSON) rebuilt from docs/BACKLOG.md.
import { readFileSync } from "node:fs";
import { checkRoadmap, roadmapBoard } from "./roadmap";

const md = readFileSync(new URL("../../docs/BACKLOG.md", import.meta.url), "utf8");
const cmd = process.argv[2];

if (cmd === "check") {
  const problems = checkRoadmap(md);
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  process.stdout.write("Roadmap list matches the open backlog items." + "\n");
} else if (cmd === "data") {
  const source = process.argv[3] ?? "rebuilt from docs/BACKLOG.md";
  process.stdout.write(JSON.stringify(roadmapBoard(md, source)) + "\n");
} else {
  console.error("usage: cli.ts check | data [source label]");
  process.exit(2);
}

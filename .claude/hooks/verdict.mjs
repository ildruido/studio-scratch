#!/usr/bin/env node
// Review and QA verdict files: the reviewer and qa agents end by writing a result file through this script, and the
// push and merge gates read it. The script stamps the commit and checks the shape, so no model hand-writes a hash.
// A tripwire against forgetting, not a lock: someone can still write the file by hand. Node built-ins only.
// Shared studio harness file: change it in app-studio, not in an app.
//
//   node .claude/hooks/verdict.mjs write review|qa < result.json     (JSON on stdin, or --from <file>)
//       review: { "reviewer": "reviewer"|"reviewer-deep", "verdict": "approve"|"changes", "findings": [...] }
//       qa:     { "verdict": "pass"|"fail", "findings": [...] }
//       finding: { "severity": "blocking"|"nit", "file": "src/a.ts", "line": 12, "problem": "...", "fix": "..." }
//   node .claude/hooks/verdict.mjs check [--base main] [--push]     exit 1 and say what is missing when a result file is
//       missing, belongs to another commit, isn't approve/pass, lists a blocking finding, or came from the wrong reviewer
//
// Files: .claude/state/review.json and qa.json (kept out of git through .git/info/exclude).
// Needed only when the diff against the base branch changes more than docs and harness files.
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { risk } from "./review-precheck.mjs";

const KINDS = { review: ["approve", "changes"], qa: ["pass", "fail"] };
const GOOD = { review: "approve", qa: "pass" };
const REVIEWERS = ["reviewer", "reviewer-deep"];
const DOC_ONLY = /\.md$|^docs\/|^\.claude\/|^CHANGELOG/;

const git = (root, ...a) => {
  const r = spawnSync("git", ["-C", root, ...a], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : null;
};
const fileOf = (root, kind) => join(root, ".claude", "state", `${kind}.json`);

/** Validates the agent's input, stamps the commit and writes the file. Returns { file } or { error }. */
export function writeVerdict(root, kind, input) {
  if (!KINDS[kind]) return { error: `unknown kind "${kind}": use review or qa` };
  const commit = git(root, "rev-parse", "HEAD");
  if (!commit) return { error: "not a git repository with a commit: nothing to stamp" };
  if (!KINDS[kind].includes(input?.verdict)) return { error: `"verdict" must be ${KINDS[kind].join(" or ")}` };
  const findings = input.findings ?? [];
  if (!Array.isArray(findings)) return { error: `"findings" must be a list` };
  for (const [i, f] of findings.entries()) {
    if (!["blocking", "nit"].includes(f?.severity)) return { error: `finding ${i + 1}: "severity" must be blocking or nit` };
    if (typeof f.problem !== "string" || !f.problem.trim()) return { error: `finding ${i + 1}: "problem" is required` };
  }
  if (input.verdict === GOOD[kind] && findings.some((f) => f.severity === "blocking")) return { error: `"${GOOD[kind]}" cannot list a blocking finding: fix it or change the verdict` };
  if (kind === "review" && !REVIEWERS.includes(input.reviewer)) return { error: `"reviewer" must be ${REVIEWERS.join(" or ")}` };
  const out = { kind, commit, verdict: input.verdict, ...(kind === "review" ? { reviewer: input.reviewer } : {}), findings, at: new Date().toISOString() };
  const file = fileOf(root, kind);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(out, null, 2)}\n`);
  const exclude = git(root, "rev-parse", "--git-path", "info/exclude");
  if (exclude) {
    const p = resolve(root, exclude);
    try {
      if (!existsSync(p) || !readFileSync(p, "utf8").includes(".claude/state/")) { mkdirSync(dirname(p), { recursive: true }); appendFileSync(p, "\n.claude/state/\n"); }
    } catch { /* best effort */ }
  }
  return { file };
}

/** What is missing for HEAD, as a list of sentences; empty when nothing is needed or both results pass. */
export function verdictProblems(root, base = "main") {
  const ref = git(root, "rev-parse", "--verify", "-q", base) ? base : git(root, "rev-parse", "--verify", "-q", `origin/${base}`) ? `origin/${base}` : null;
  const head = git(root, "rev-parse", "HEAD");
  if (!ref || !head) return [];
  const names = (git(root, "diff", "--name-only", `${ref}...HEAD`) ?? "").split("\n").filter(Boolean);
  if (!names.some((n) => !DOC_ONLY.test(n))) return [];
  const short = head.slice(0, 7);
  const out = [];
  const read = (kind) => {
    try { return JSON.parse(readFileSync(fileOf(root, kind), "utf8")); } catch { return null; }
  };
  const r = risk(root, base);
  const agent = r.reviewer ?? "reviewer";
  const rv = read("review");
  if (!rv) out.push(`no review result for ${short}: run the \`${agent}\` agent on \`git diff ${base}...HEAD\` (it ends by writing its result through \`node .claude/hooks/verdict.mjs write review\`)`);
  else if (rv.commit !== head) out.push(`the review result is for ${String(rv.commit).slice(0, 7)}, not ${short}: this commit changed after the review, so run the \`${agent}\` agent again`);
  else if (rv.verdict !== "approve") out.push(`the review says "${rv.verdict}": fix its findings, commit, and run the \`${agent}\` agent again`);
  else if ((rv.findings ?? []).some((f) => f.severity === "blocking")) out.push("the review result still lists blocking findings: fix them, commit, and run the reviewer again");
  else if (agent === "reviewer-deep" && rv.reviewer !== "reviewer-deep") out.push("this diff is high risk (`node .claude/hooks/review-precheck.mjs risk`): run the `reviewer-deep` agent, not `reviewer`");
  const qa = read("qa");
  if (!qa) out.push(`no QA result for ${short}: run the \`qa\` agent (it ends by writing its result through \`node .claude/hooks/verdict.mjs write qa\`)`);
  else if (qa.commit !== head) out.push(`the QA result is for ${String(qa.commit).slice(0, 7)}, not ${short}: this commit changed after QA, so run the \`qa\` agent again`);
  else if (qa.verdict !== "pass") out.push(`QA says "${qa.verdict}": fix its findings, commit, and run the \`qa\` agent again`);
  else if ((qa.findings ?? []).some((f) => f.severity === "blocking")) out.push("the QA result still lists blocking findings: fix them, commit, and run `qa` again");
  return out;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const a = process.argv.slice(2);
  const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  if (a[0] === "write") {
    const from = a.includes("--from") ? a[a.indexOf("--from") + 1] : "-";
    let input;
    try { input = JSON.parse(readFileSync(from === "-" ? 0 : from, "utf8")); } catch (e) { console.error(`verdict: the input is not valid JSON (${e.message})`); process.exit(1); }
    const res = writeVerdict(root, a[1], input);
    if (res.error) { console.error(`verdict: ${res.error}`); process.exit(1); }
    console.log(`verdict: wrote ${a[1]} result for ${git(root, "rev-parse", "--short", "HEAD")}`);
  } else if (a[0] === "check") {
    if (a.includes("--push")) {
      // The git pre-push hook passes the refs on stdin: pushing only deletions needs no result.
      let refs = "";
      try { refs = readFileSync(0, "utf8"); } catch { /* no stdin */ }
      const lines = refs.split("\n").filter(Boolean);
      if (lines.length && lines.every((l) => /^\S+ 0{40,} /.test(l) || /^\(delete\)/.test(l))) process.exit(0);
    }
    const problems = verdictProblems(root, a.includes("--base") ? a[a.indexOf("--base") + 1] : "main");
    if (problems.length) { console.error(`Blocked: the review and QA results don't cover this commit.\n${problems.map((p) => `- ${p}`).join("\n")}`); process.exit(a.includes("--push") ? 1 : 2); }
  } else {
    console.error("usage: verdict.mjs write review|qa  |  verdict.mjs check [--base main] [--push]");
    process.exit(1);
  }
}

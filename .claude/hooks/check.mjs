// Claude Code hook runner. Cross-platform (Windows + Linux cloud sessions).
//   node .claude/hooks/check.mjs lint  -> PostToolUse: ESLint the file that was just edited
//   node .claude/hooks/check.mjs test  -> Stop: ESLint the TS/JS files changed since the last push (however they were
//                                          edited, also by shell commands), then run the unit tests before the turn ends
//   node .claude/hooks/check.mjs commit -> PreToolUse (Bash): run the harness health check before a git commit
//   node .claude/hooks/check.mjs merge  -> PreToolUse (GitHub merge tool): block a merge of this app's PR unless its
//                                          checks were read after the last push and all finished green
//   node .claude/hooks/check.mjs write  -> PreToolUse (GitHub file-write tools): block writes to this app's repo that
//                                          skip the local clone (and so the health check)
// Exit code 2 sends the output back to Claude as a blocking error to fix.
// Shared studio harness file: change it in app-studio, not in an app.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const mode = process.argv[2];

let input = {};
try {
  input = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  // No or invalid stdin: treat as an empty event.
}

// Any `git commit`, also inside a chain (`git add -A && git commit`) or with options (`git -C . commit`).
const isCommit = (cmd) => /(^|[\s;&|(])git(\s+-{1,2}\S+(\s+[^\s-]\S*)?)*\s+commit\b/.test(cmd ?? "");

if (mode === "commit") {
  // Needs no dependencies: the health check uses Node built-ins only.
  if (!isCommit(input.tool_input?.command)) process.exit(0);
  const sync = join(root, ".claude", "studio", "studio-sync.mjs");
  const res = existsSync(sync)
    ? spawnSync(process.execPath, [sync, "health"], { cwd: root, encoding: "utf8" })
    : { status: 1, stdout: `${relative(root, sync)} is missing.` };
  if (res.status !== 0) {
    process.stderr.write(
      `Commit blocked: the harness isn't healthy. Fix this first (the harness-sync skill helps), then commit again:\n${`${res.stdout ?? ""}${res.stderr ?? ""}`.trim()}\n`,
    );
    process.exit(2);
  }
  process.exit(0);
}

/** "owner/repo" of this app's origin remote, lower case, or null. */
function originRepo() {
  const res = spawnSync("git", ["-C", root, "remote", "get-url", "origin"], { encoding: "utf8" });
  const m = /[/:]([^/:]+)\/([^/]+?)(?:\.git)?\/?$/.exec((res.stdout ?? "").trim());
  return res.status === 0 && m ? `${m[1]}/${m[2]}`.toLowerCase() : null;
}
const targetsThisApp = (i) => {
  const mine = originRepo();
  return Boolean(mine && i?.owner && i?.repo && `${i.owner}/${i.repo}`.toLowerCase() === mine);
};
const block = (msg) => {
  process.stderr.write(`${msg}\n`);
  process.exit(2);
};

if (mode === "write") {
  if (!targetsThisApp(input.tool_input)) process.exit(0);
  block(
    "Blocked: don't write files to this app's repo through the GitHub API, because that skips the harness health check. " +
      "Edit the local clone, commit with git (the pre-commit check runs) and push.",
  );
}

if (mode === "merge") {
  const pr = input.tool_input ?? {};
  if (!targetsThisApp(pr)) process.exit(0);
  const verdict = mergeVerdict(input.transcript_path, pr);
  if (verdict) {
    block(
      `Merge blocked: ${verdict}. Right before merging, read the PR's checks (the GitHub pull_request_read tool, method ` +
        "get_check_runs) and merge only when every check has finished green: CI for code, Harness for Markdown, " +
        ".claude/ and workflows. A PR may have one or both. Wait for running checks; fix red ones.",
    );
  }
  process.exit(0);
}

/** Why the merge must wait, or "" when the latest check read (after the last push) is all green. */
function mergeVerdict(transcript, pr) {
  if (!transcript || !existsSync(transcript)) return "the session transcript can't be read, so the PR's checks can't be confirmed";
  const uses = new Map();
  let lastPush = -1;
  let lastRead = null;
  readFileSync(transcript, "utf8")
    .split("\n")
    .forEach((line, i) => {
      let entry;
      try {
        entry = JSON.parse(line);
      } catch {
        return;
      }
      const content = entry?.message?.content;
      if (!Array.isArray(content)) return;
      for (const b of content) {
        if (b?.type === "tool_use") {
          uses.set(b.id, b);
          if (/^Bash$/.test(b.name) && /\bgit\b[^\n]*\bpush\b/.test(b.input?.command ?? "")) lastPush = i;
        } else if (b?.type === "tool_result") {
          const use = uses.get(b.tool_use_id);
          const inp = use?.input ?? {};
          if (
            /pull_request_read$/.test(use?.name ?? "") &&
            inp.method === "get_check_runs" &&
            Number(inp.pullNumber) === Number(pr.pullNumber) &&
            `${inp.owner}/${inp.repo}`.toLowerCase() === `${pr.owner}/${pr.repo}`.toLowerCase()
          ) {
            const text = typeof b.content === "string" ? b.content : (b.content ?? []).map((c) => c?.text ?? "").join("");
            lastRead = { i, text };
          }
        }
      }
    });
  if (!lastRead) return "this session hasn't read the PR's checks";
  if (lastRead.i < lastPush) return "there was a push after the last time the PR's checks were read";
  let runs;
  try {
    runs = JSON.parse(lastRead.text).check_runs;
  } catch {
    return "the last read of the PR's checks couldn't be understood";
  }
  if (!Array.isArray(runs) || !runs.length) return "the PR has no checks yet (they may not have started)";
  // Only each check's latest run counts, as on GitHub: a re-run, or the run that replaced a draft's,
  // supersedes the older one (the higher id is newer; without ids, GitHub lists the newest first).
  const latest = new Map();
  for (const r of runs) {
    const prev = latest.get(r.name);
    if (!prev || (r.id != null && prev.id != null && Number(r.id) > Number(prev.id))) latest.set(r.name, r);
  }
  runs = [...latest.values()];
  const pending = runs.filter((r) => r.status !== "completed").map((r) => r.name);
  if (pending.length) return `checks still running: ${pending.join(", ")}`;
  const red = runs.filter((r) => !["success", "skipped", "neutral"].includes(r.conclusion)).map((r) => `${r.name} (${r.conclusion})`);
  if (red.length) return `checks not green: ${red.join(", ")}`;
  if (!runs.some((r) => r.conclusion === "success")) return "no check has passed yet (all were skipped)";
  return "";
}

// Dependencies not installed yet (fresh clone): nothing to check.
if (!existsSync(join(root, "node_modules"))) process.exit(0);

const hasBin = (name) =>
  existsSync(join(root, "node_modules", ".bin", name)) ||
  existsSync(join(root, "node_modules", ".bin", `${name}.cmd`));

function run(cmd, args) {
  const res = spawnSync(cmd, args, { cwd: root, encoding: "utf8", shell: true });
  return { ok: res.status === 0, out: `${res.stdout ?? ""}${res.stderr ?? ""}`.trim() };
}

/** True for a TS/JS source file inside the app that ESLint should see (not build output or dependencies). */
const lintable = (rel) =>
  /\.(c|m)?(t|j)sx?$/.test(rel) && !rel.startsWith("..") && !/(^|[\\/])(dist[^\\/]*|node_modules)[\\/]/.test(rel);

/** TS/JS files changed since the last push, however they were edited: uncommitted, untracked and unpushed commits. */
function changedFiles() {
  const git = (...args) => {
    const r = spawnSync("git", ["-C", root, ...args], { encoding: "utf8" });
    return r.status === 0 ? (r.stdout ?? "").split("\n").filter(Boolean) : [];
  };
  const names = new Set([
    ...git("diff", "--name-only", "--relative", "HEAD"),
    ...git("ls-files", "--others", "--exclude-standard"),
    ...git("diff", "--name-only", "--relative", "@{upstream}...HEAD"),
  ]);
  return [...names].filter((f) => lintable(f) && existsSync(join(root, f)));
}

if (mode === "lint") {
  const file = input.tool_input?.file_path;
  if (!file) process.exit(0);
  const rel = relative(root, file);
  if (!lintable(rel)) process.exit(0);
  if (!hasBin("eslint")) process.exit(0);
  const { ok, out } = run("npx", ["eslint", "--max-warnings=0", "--no-warn-ignored", JSON.stringify(rel)]);
  if (!ok) {
    process.stderr.write(`ESLint failed for ${rel}. Fix before continuing:\n${out}\n`);
    process.exit(2);
  }
  process.exit(0);
}

if (mode === "test") {
  // Avoid an endless loop if Claude is already continuing because of this hook.
  if (input.stop_hook_active) process.exit(0);
  // Files changed through shell commands (heredocs, scripts) skip the per-edit lint hook: lint them here.
  const files = hasBin("eslint") ? changedFiles() : [];
  if (files.length) {
    const lint = run("npx", ["eslint", "--max-warnings=0", "--no-warn-ignored", ...files.map((f) => JSON.stringify(f))]);
    if (!lint.ok) {
      process.stderr.write(`ESLint failed for the files changed this session. Fix before finishing:\n${lint.out.slice(-4000)}\n`);
      process.exit(2);
    }
  }
  // Vitest with the compact reporter when the app uses it, otherwise the app's own test script.
  let scripts = {};
  try {
    scripts = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).scripts ?? {};
  } catch {
    // No package.json: nothing to test.
  }
  let cmd;
  if (hasBin("vitest")) cmd = ["npx", ["vitest", "run", "--reporter=dot"]];
  else if (scripts.test && !/no test specified/.test(scripts.test)) cmd = ["npm", ["test", "--silent"]];
  else process.exit(0);
  const { ok, out } = run(...cmd);
  if (!ok) {
    const tail = out.slice(-4000);
    process.stderr.write(`Unit tests are failing. Fix them before finishing:\n${tail}\n`);
    process.exit(2);
  }
  process.exit(0);
}

process.stderr.write(`Unknown hook mode: ${mode}\n`);
process.exit(1);

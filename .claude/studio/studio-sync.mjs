#!/usr/bin/env node
// studio-sync: keeps an app's copy of the studio harness in step with app-studio, the master copy.
//
//   node studio-sync.mjs install [--app <dir>] [--studio <dir>]   first copy into an app, plus templates
//   node studio-sync.mjs check   [--app <dir>] [--studio <dir>] [--warn]
//   node studio-sync.mjs health  [--app <dir>] [--studio <dir>]   is the harness sound? (pre-commit hook, CI)
//   node studio-sync.mjs pull    [--app <dir>] [--studio <dir>] [--force]
//   node studio-sync.mjs pack add <name...> [--slug <kebab>] [--title <Name>]   add stack packs (packs/ in app-studio)
//   node studio-sync.mjs pack remove <name...> [--force]   drop stack packs the app no longer uses
//   node studio-sync.mjs ack [<path...>]    mark pack starter files as reviewed against app-studio
//   node studio-sync.mjs hooks   [--app <dir>]   turn on the harness hooks that don't depend on where a session
//                                                 starts (every command but install does this too)
//
// Runs from app-studio (scripts/studio-sync.mjs, app defaults to the current folder) or from an
// app's copy (.claude/studio/studio-sync.mjs, app-studio defaults to $STUDIO_DIR, then ../app-studio).
// The app's .claude/studio/lock.json pins the studio version and a hash of every managed file.
// A stack pack (packs/<name>/) adds two kinds of file: `managed/` files (checklists and release
// notes, kept in step like the skills, under .claude/packs/<name>/) and `starter/` files (CI, configs,
// server, adapters: copied once, with {{slug}} and {{title}} filled in, and the app's own afterwards;
// check only notes when app-studio's version changed, and pull refreshes the ones left unedited).
// health fails (exit 1) on what would mislead a session: shared files edited or missing here, an
// unfilled App profile, harness hooks missing from settings.json, malformed app skills or agents,
// broken links in the docs (and in the app's own .claude/ Markdown), a missing Harness workflow.
// Being behind app-studio is only a note: it never blocks a commit or PR.
// Every command run in an app also turns on the hooks that work wherever a session starts: the git
// pre-commit hook (core.hooksPath), and in a cloud session the app's Claude Code hooks forwarded to
// the parent folder, which is the session's top folder when several repos are attached.
// Exit codes: 0 in step, 1 drift or skipped files, 2 usage error. --warn always exits 0 and prints
// only when something needs attention (for a SessionStart hook).
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const LOCK = ".claude/studio/lock.json";
const SELF = ".claude/studio/studio-sync.mjs";

// Master folders in app-studio and where their files land in an app.
const TREES = [
  ["plugins/studio/skills", ".claude/skills"],
  ["plugins/studio/agents", ".claude/agents"],
  ["plugins/studio/hooks", ".claude/hooks"],
];
// Copied once by install when the app doesn't have them yet; never managed afterwards.
const TEMPLATES = [
  ["plugins/studio/templates/CLAUDE.md", "CLAUDE.md"],
  ["plugins/studio/templates/settings.json", ".claude/settings.json"],
];

const toPosix = (p) => p.split(sep).join("/");

// Line endings don't count as a change (Windows checkouts).
export function hashText(text) {
  return createHash("sha256").update(text.replace(/\r\n/g, "\n")).digest("hex");
}
export function hashFile(file) {
  return hashText(readFileSync(file, "utf8"));
}

function listFiles(dir, { dotfiles = false } = {}) {
  if (!existsSync(dir)) return [];
  // Dotfiles (.DS_Store, editor swap files) are never part of the harness; pack starters keep
  // theirs (.github, .gitignore) apart from OS and editor litter.
  const keep = (name) =>
    dotfiles
      ? name !== ".DS_Store" && name !== "node_modules" && !name.endsWith(".swp")
      : !name.startsWith(".");
  return readdirSync(dir)
    .filter(keep)
    .flatMap((name) => {
      const p = join(dir, name);
      return statSync(p).isDirectory() ? listFiles(p, { dotfiles }) : [p];
    });
}

export function isStudio(dir) {
  return !!dir && existsSync(join(dir, "plugins", "studio", ".claude-plugin", "plugin.json"));
}

export function studioVersion(studio) {
  return JSON.parse(readFileSync(join(studio, "plugins/studio/.claude-plugin/plugin.json"), "utf8"))
    .version;
}

// ---------- stack packs ----------

const packDir = (studio, name) => join(studio, "packs", name);

export function readPack(studio, name) {
  const file = join(packDir(studio, name), "pack.json");
  if (!existsSync(file)) throw new Error(`No pack named "${name}" in app-studio (packs/).`);
  return JSON.parse(readFileSync(file, "utf8"));
}

export function listPacks(studio) {
  const dir = join(studio, "packs");
  return existsSync(dir)
    ? readdirSync(dir).filter((n) => existsSync(join(dir, n, "pack.json"))).sort()
    : [];
}

/** The names with everything they require, requirements first. */
export function packClosure(studio, names) {
  const out = [];
  const visit = (name, trail = []) => {
    if (trail.includes(name)) throw new Error(`Packs require each other in a loop: ${[...trail, name].join(" > ")}`);
    if (out.includes(name)) return;
    for (const dep of readPack(studio, name).requires ?? []) visit(dep, [...trail, name]);
    out.push(name);
  };
  names.forEach((n) => visit(n));
  return out;
}

// Function replacers: a "$" in a name is text, not a replacement pattern.
const fill = (text, vars) =>
  text.replaceAll("{{slug}}", () => vars.slug).replaceAll("{{title}}", () => vars.title);

export function checkVars({ slug, title }) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug))
    throw new Error(`--slug must be lowercase letters, digits and hyphens (got "${slug}").`);
  if (!title.trim() || /["\\`$<>&]/.test(title))
    throw new Error('--title may not contain " \\ ` $ < > & (it is written into code, JSON and HTML).');
}

export function defaultVars(app) {
  const slug =
    basename(resolve(app)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "app";
  const title = slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return { slug, title };
}

// { "<app path>": { src: "<absolute master path>", hash } }
export function masterFiles(studio, packs = []) {
  const files = {};
  for (const [from, to] of TREES) {
    const base = join(studio, from);
    for (const src of listFiles(base)) {
      files[`${to}/${toPosix(relative(base, src))}`] = { src, hash: hashFile(src) };
    }
  }
  const self = join(studio, "scripts", "studio-sync.mjs");
  files[SELF] = { src: self, hash: hashFile(self) };
  // A pack's managed files: kept in step like the skills.
  for (const name of packs) {
    const base = join(packDir(studio, name), "managed");
    for (const src of listFiles(base, { dotfiles: true })) {
      files[`.claude/packs/${name}/${toPosix(relative(base, src))}`] = { src, hash: hashFile(src) };
    }
  }
  return files;
}

// { "<app path>": { pack, src, text, hash } } with {{slug}} and {{title}} filled in.
// `all` is every pack the app has: a pack's `supersededBy` map ({ "<path>": ["<pack>"] }) drops its
// own starter at that path when one of those packs is present (the web pack's CI covers an
// artifact prototype too, so a hybrid app gets one workflow, not two).
export function starterFiles(studio, packs, vars, all = packs) {
  const files = {};
  for (const name of packs) {
    const base = join(packDir(studio, name), "starter");
    const superseded = readPack(studio, name).supersededBy ?? {};
    for (const src of listFiles(base, { dotfiles: true })) {
      const path = toPosix(relative(base, src));
      if ((superseded[path] ?? []).some((other) => all.includes(other))) continue;
      const text = fill(readFileSync(src, "utf8"), vars);
      if (path in files) throw new Error(`Packs ${files[path].pack} and ${name} both ship ${path}.`);
      files[path] = { pack: name, src, text, hash: hashText(text) };
    }
  }
  return files;
}

/** Adds the pack's scripts and dependencies to the app's package.json; never overwrites a key. */
export function mergePackageJson(app, studio, packs, vars) {
  const file = join(app, "package.json");
  const pkg = existsSync(file)
    ? JSON.parse(readFileSync(file, "utf8"))
    : { name: vars.slug, version: "0.0.0", private: true, type: "module", engines: { node: ">=22" } };
  const added = [];
  for (const name of packs) {
    const add = readPack(studio, name).packageJson ?? {};
    for (const [section, entries] of Object.entries(add)) {
      pkg[section] ??= {};
      for (const [key, value] of Object.entries(entries)) {
        if (key in pkg[section]) continue;
        pkg[section][key] = value;
        added.push(`${section}.${key}`);
      }
      if (section.endsWith("ependencies")) {
        pkg[section] = Object.fromEntries(Object.entries(pkg[section]).sort(([x], [y]) => x.localeCompare(y)));
      }
    }
  }
  if (added.length) writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
  return added;
}

export function readLock(app) {
  const p = join(app, LOCK);
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;
}

function writeLock(app, lock) {
  const sortKeys = (o) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));
  const out = { studio: lock.studio };
  if (lock.packs && Object.keys(lock.packs).length) out.packs = sortKeys(lock.packs);
  if (lock.app) out.app = lock.app;
  out.files = sortKeys(lock.files);
  if (lock.starters && Object.keys(lock.starters).length) out.starters = sortKeys(lock.starters);
  mkdirSync(dirname(join(app, LOCK)), { recursive: true });
  writeFileSync(join(app, LOCK), `${JSON.stringify(out, null, 2)}\n`);
}

const localHash = (app, path) => (existsSync(join(app, path)) ? hashFile(join(app, path)) : null);

// Pure comparison; studio may be null (then only local edits are checked).
export function compare(app, studio) {
  const lock = readLock(app);
  const report = {
    installed: !!lock,
    edited: [],
    missing: [],
    behind: [],
    added: [],
    removed: [],
    starters: [],
  };
  if (!lock) return report;
  report.version = lock.studio;
  for (const [path, hash] of Object.entries(lock.files)) {
    const cur = localHash(app, path);
    if (cur === null) report.missing.push(path);
    else if (cur !== hash) report.edited.push(path);
  }
  if (studio) {
    report.studioVersion = studioVersion(studio);
    const master = masterFiles(studio, Object.keys(lock.packs ?? {}));
    for (const [path, { hash }] of Object.entries(master)) {
      if (!(path in lock.files)) report.added.push(path);
      else if (lock.files[path] !== hash) report.behind.push(path);
    }
    for (const path of Object.keys(lock.files)) if (!(path in master)) report.removed.push(path);
    // Starter files are the app's own; a changed one in app-studio is a note, never drift.
    const vars = lock.app ?? defaultVars(app);
    const starters = starterFiles(studio, Object.keys(lock.packs ?? {}), vars);
    for (const [path, rec] of Object.entries(lock.starters ?? {})) {
      const m = starters[path];
      if (!m || m.hash === rec.seen) continue;
      const cur = localHash(app, path);
      report.starters.push({ path, pack: rec.pack, refreshable: cur === rec.installed });
    }
  }
  return report;
}

export const drift = (r) =>
  !r.installed ||
  [r.edited, r.missing, r.behind, r.added, r.removed].some((list) => list.length > 0);

function readLockForPull(app, force) {
  try {
    return readLock(app) ?? { files: {} };
  } catch (e) {
    // A corrupt lock: --force rebuilds it from what is on disk.
    if (!force) throw new Error(`${LOCK} is unreadable (${e.message}). Pass --force to rebuild it.`);
    return { files: {} };
  }
}

export function pull(app, studio, { force = false } = {}) {
  const lock = readLockForPull(app, force);
  const packs = Object.keys(lock.packs ?? {});
  for (const name of packs) readPack(studio, name); // a pack gone from app-studio fails before any file moves
  const files = { ...lock.files };
  const result = { written: [], deleted: [], skipped: [], refreshed: [], starterNotes: [] };
  const master = masterFiles(studio, packs);

  for (const [path, { src, hash }] of Object.entries(master)) {
    const cur = localHash(app, path);
    if (cur === hash) {
      files[path] = hash;
      continue;
    }
    // Keep a local change (or an unmanaged file in the way) unless forced.
    const known = files[path];
    if (cur !== null && cur !== known && !force) {
      result.skipped.push(path);
      continue;
    }
    mkdirSync(dirname(join(app, path)), { recursive: true });
    copyFileSync(src, join(app, path));
    files[path] = hash;
    result.written.push(path);
  }
  for (const path of Object.keys(files)) {
    if (path in master) continue;
    const cur = localHash(app, path);
    if (cur !== null && cur !== files[path] && !force) {
      result.skipped.push(path);
      continue;
    }
    if (cur !== null) rmSync(join(app, path));
    delete files[path];
    result.deleted.push(path);
  }

  // Pack versions follow what was pulled; starters the app has not touched are refreshed, the
  // others are noted for a manual merge (then `ack`).
  const newLock = { ...lock, studio: studioVersion(studio), files };
  if (packs.length) {
    newLock.packs = Object.fromEntries(packs.map((n) => [n, readPack(studio, n).version]));
    const starters = starterFiles(studio, packs, lock.app ?? defaultVars(app));
    newLock.starters = { ...lock.starters };
    for (const [path, rec] of Object.entries(lock.starters ?? {})) {
      const m = starters[path];
      if (!m || m.hash === rec.seen) continue;
      if (localHash(app, path) === rec.installed) {
        writeFileSync(join(app, path), m.text);
        newLock.starters[path] = { pack: rec.pack, installed: m.hash, seen: m.hash };
        result.refreshed.push(path);
      } else {
        result.starterNotes.push(path);
      }
    }
  }
  writeLock(app, newLock);
  return result;
}

export function install(app, studio, opts) {
  const result = pull(app, studio, opts);
  result.templates = [];
  for (const [from, to] of TEMPLATES) {
    if (existsSync(join(app, to))) continue;
    mkdirSync(dirname(join(app, to)), { recursive: true });
    copyFileSync(join(studio, from), join(app, to));
    result.templates.push(to);
  }
  return result;
}

/** Adds stack packs (and what they require): managed files, starter files, package.json entries. */
export function addPacks(app, studio, names, { slug, title, force = false } = {}) {
  if (!names.length) throw new Error("Name at least one pack. Available: " + listPacks(studio).join(", "));
  const lock = readLockForPull(app, force);
  if (!lock.studio) throw new Error("Install the harness first (studio-sync.mjs install).");
  const defaults = defaultVars(app);
  // The name chosen first is kept: files already filled with it must not change under the app.
  const vars = lock.app ?? { ...defaults, ...(slug && { slug }), ...(title && { title }) };
  checkVars(vars);
  const packs = [...new Set([...Object.keys(lock.packs ?? {}), ...packClosure(studio, names)])];
  const order = packClosure(studio, packs);
  const fresh = order.filter((n) => !(n in (lock.packs ?? {})));

  // Register the packs, then reuse pull for the managed files.
  writeLock(app, {
    ...lock,
    app: vars,
    packs: { ...lock.packs, ...Object.fromEntries(fresh.map((n) => [n, readPack(studio, n).version])) },
  });
  const result = pull(app, studio, { force });
  result.added = fresh;
  result.created = [];
  result.kept = [];
  result.packageJson = mergePackageJson(app, studio, fresh, vars);

  const after = readLock(app);
  const starters = starterFiles(studio, fresh, vars, order);
  for (const [path, m] of Object.entries(starters)) {
    const dest = join(app, path);
    if (existsSync(dest) && hashFile(dest) !== m.hash) {
      result.kept.push(path);
      continue;
    }
    if (!existsSync(dest)) {
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, m.text);
      result.created.push(path);
    }
    after.starters = { ...after.starters, [path]: { pack: m.pack, installed: m.hash, seen: m.hash } };
  }
  writeLock(app, after);
  return result;
}

/**
 * Drops packs from an app: their managed files (checklists, release notes) are deleted and the lock
 * forgets them. Starter files and package.json entries are the app's own and stay. Refuses a pack
 * another remaining pack requires, and a managed file edited here unless `force`.
 */
export function removePacks(app, studio, names, { force = false } = {}) {
  if (!names.length) throw new Error("Name at least one pack to remove.");
  const lock = readLock(app);
  if (!lock) throw new Error("Install the harness first (studio-sync.mjs install).");
  const have = Object.keys(lock.packs ?? {});
  for (const n of names) if (!have.includes(n)) throw new Error(`The app has no pack named "${n}" (it has: ${have.join(", ") || "none"}).`);
  const keep = have.filter((n) => !names.includes(n));
  for (const n of keep) {
    const need = (readPack(studio, n).requires ?? []).find((d) => names.includes(d));
    if (need) throw new Error(`Pack "${n}" requires "${need}". Remove "${n}" first.`);
  }
  const result = { removed: names, deleted: [], skipped: [], startersKept: [] };
  for (const n of names) {
    const prefix = `.claude/packs/${n}/`;
    for (const [path, hash] of Object.entries(lock.files)) {
      if (!path.startsWith(prefix)) continue;
      const cur = localHash(app, path);
      if (cur !== null && cur !== hash && !force) {
        result.skipped.push(path);
        continue;
      }
      if (cur !== null) rmSync(join(app, path));
      delete lock.files[path];
      result.deleted.push(path);
    }
    for (const [path, rec] of Object.entries(lock.starters ?? {})) {
      if (rec.pack !== n) continue;
      delete lock.starters[path];
      result.startersKept.push(path);
    }
    if (!result.skipped.some((x) => x.startsWith(prefix))) delete lock.packs[n];
  }
  writeLock(app, lock);
  return result;
}

/** Marks starter files as reviewed against app-studio: their notes stop until the next change. */
export function ack(app, studio, paths = []) {
  const lock = readLock(app);
  if (!lock?.starters) return [];
  const starters = starterFiles(studio, Object.keys(lock.packs ?? {}), lock.app ?? defaultVars(app));
  const done = [];
  for (const [path, rec] of Object.entries(lock.starters)) {
    if (paths.length && !paths.map((x) => x.replaceAll("\\", "/")).includes(path)) continue;
    const m = starters[path];
    if (!m || m.hash === rec.seen) continue;
    lock.starters[path] = { ...rec, seen: m.hash };
    done.push(path);
  }
  writeLock(app, lock);
  return done;
}

function parseArgs(argv) {
  const opts = { cmd: argv[0], warn: false, force: false, rest: [] };
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--warn") opts.warn = true;
    else if (a === "--force") opts.force = true;
    else if (["--app", "--studio", "--slug", "--title"].includes(a)) opts[a.slice(2)] = argv[++i];
    else if (a.startsWith("--")) throw new Error(`Unknown argument: ${a}`);
    else opts.rest.push(a);
  }
  return opts;
}

function siblings(app) {
  try {
    const parent = dirname(app);
    return readdirSync(parent).sort().map((n) => join(parent, n)).filter((d) => d !== app);
  } catch {
    return [];
  }
}

function locate(opts) {
  const here = dirname(fileURLToPath(import.meta.url));
  const fromStudio = isStudio(join(here, ".."));
  const app = resolve(opts.app ?? (fromStudio ? process.cwd() : join(here, "..", "..")));
  const candidates = fromStudio
    ? [opts.studio, join(here, "..")]
    : [opts.studio, process.env.STUDIO_DIR, join(app, "..", "app-studio")];
  // A cloud session clones attached repos side by side, not always under the name app-studio.
  if (!fromStudio) candidates.push(...siblings(app));
  const studio = candidates.filter(Boolean).map((d) => resolve(d)).find(isStudio) ?? null;
  if (opts.studio && !isStudio(resolve(opts.studio)))
    throw new Error(`Not an app-studio checkout: ${opts.studio}`);
  return { app, studio };
}

// Long lists (a pack's starter files) are cut short: the app's git status shows the rest.
const list = (label, paths) =>
  paths.length
    ? [`  ${label}: ${paths.length > 8 ? `${paths.slice(0, 6).join(", ")} and ${paths.length - 6} more` : paths.join(", ")}`]
    : [];

/** Lines of the App profile (CLAUDE.md) that still hold a template placeholder such as `<App name>`. */
export function profileGaps(app) {
  const file = join(app, "CLAUDE.md");
  if (!existsSync(file)) return [];
  const text = readFileSync(file, "utf8");
  const start = text.indexOf("## App profile");
  if (start < 0) return [];
  const end = text.indexOf("\n## ", start + 5);
  const section = text.slice(start, end < 0 ? undefined : end);
  return section
    .split("\n")
    .filter((l) => /(\|\s*|\*\*\s*|^- |^)`?<[^<>\n]{2,}>/.test(l) && !/^Build, QA/.test(l))
    .map((l) => l.replace(/\s+/g, " ").trim().slice(0, 70));
}

// Hooks every app's .claude/settings.json must wire, as [event, part of the command].
export const REQUIRED_HOOKS = [
  ["SessionStart", "hooks/cloud-setup.mjs"],
  ["SessionStart", "studio-sync.mjs check"],
  ["PreToolUse", "hooks/check.mjs commit"],
  ["PreToolUse", "hooks/check.mjs merge"],
  ["PreToolUse", "hooks/check.mjs write"],
  ["PostToolUse", "hooks/check.mjs lint"],
  ["Stop", "hooks/check.mjs test"],
];

// Starter files the app owns but must keep, as [pack, path]: without the Harness workflow, a PR
// that deletes it (or any docs-only PR) is never checked.
const REQUIRED_STARTERS = [["base", ".github/workflows/harness.yml"]];

const GIT_HOOKS = ".claude/hooks";
// Claude Code hooks forwarded to the parent folder in a cloud session, as [event, matcher, check.mjs mode].
// The git pre-commit hook covers commits, and SessionStart has already run by then.
export const FORWARDED_HOOKS = [
  ["PreToolUse", "mcp__.*github.*__merge_pull_request", "merge"],
  ["PreToolUse", "mcp__.*github.*__(push_files|create_or_update_file|delete_file)", "write"],
  ["PostToolUse", "Edit|Write|MultiEdit", "lint"],
  ["Stop", undefined, "test"],
];

/**
 * Turns on what works wherever a session starts: the git pre-commit hook, and in a cloud session
 * (CLAUDE_CODE_REMOTE) the app's hooks forwarded to <parent>/.claude/settings.json. Claude Code loads
 * settings only from the session's top folder, which is the parent when several repos are attached,
 * and it usually picks up the file mid-session (best effort). Returns notes; does nothing in CI.
 */
export function activateHooks(app, env = process.env) {
  const notes = [];
  if (env.CI || !existsSync(join(app, LOCK))) return notes;
  const hook = join(app, GIT_HOOKS, "pre-commit");
  if (existsSync(join(app, ".git")) && existsSync(hook)) {
    const git = (...a) => spawnSync("git", ["-C", app, ...a], { encoding: "utf8" });
    const cur = (git("config", "--get", "core.hooksPath").stdout ?? "").trim();
    if (!cur || cur === GIT_HOOKS) {
      try {
        chmodSync(hook, 0o755);
      } catch {
        // Windows: Git runs hooks through sh, no mode needed.
      }
      if (!cur && git("config", "core.hooksPath", GIT_HOOKS).status === 0) notes.push("turned on the git pre-commit health check");
    } else
      notes.push(`git core.hooksPath is "${cur}", so the harness pre-commit check is off: call .claude/hooks/pre-commit from that folder's pre-commit hook`);
  }
  if (env.CLAUDE_CODE_REMOTE === "true") {
    const parent = dirname(app);
    const file = join(parent, ".claude", "settings.json");
    const mine = `${toPosix(app)}/.claude/hooks/`;
    let settings = {};
    try {
      settings = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
    } catch {
      settings = {};
    }
    const before = JSON.stringify(settings);
    settings.hooks ??= {};
    // The "app-studio apps" cloud environment already runs the app's hooks there (scripts/studio-env.mjs).
    const viaEnv = JSON.stringify(settings.hooks).includes("studio-env");
    for (const event of Object.keys(settings.hooks))
      settings.hooks[event] = settings.hooks[event]
        .map((g) => ({ ...g, hooks: (g.hooks ?? []).filter((h) => !String(h.command ?? "").includes(mine)) }))
        .filter((g) => g.hooks.length);
    for (const [event, matcher, mode] of viaEnv ? [] : FORWARDED_HOOKS)
      (settings.hooks[event] ??= []).push({
        ...(matcher ? { matcher } : {}),
        hooks: [{ type: "command", command: `node "${mine}check.mjs" ${mode}`, timeout: mode === "test" || mode === "lint" ? 300 : 30 }],
      });
    if (JSON.stringify(settings) !== before) {
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, `${JSON.stringify(settings, null, 2)}\n`);
      notes.push(`forwarded the app's hooks to ${toPosix(file)} (sessions whose top folder is ${toPosix(parent)})`);
    }
  }
  return notes;
}

function hookGaps(app) {
  const file = join(app, ".claude/settings.json");
  if (!existsSync(file)) return [".claude/settings.json is missing"];
  let settings;
  try {
    settings = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    return [`.claude/settings.json is not valid JSON (${e.message})`];
  }
  const commands = (event) =>
    (settings.hooks?.[event] ?? []).flatMap((m) => (m.hooks ?? []).map((h) => String(h.command ?? "")));
  return REQUIRED_HOOKS.filter(([event, cmd]) => !commands(event).some((c) => c.includes(cmd))).map(
    ([event, cmd]) => `${event} hook "${cmd}" is not in .claude/settings.json (see app-studio's templates/settings.json)`,
  );
}

const frontmatter = (text) => {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!m) return null;
  return Object.fromEntries(
    m[1].split(/\r?\n/).map((l) => /^([a-z-]+):\s*(.*)$/i.exec(l)).filter(Boolean).map((x) => [x[1], x[2].trim()]),
  );
};

/** The app's own skills and agents (not in the lock): front matter with a name and a description, no clash. */
function ownGaps(app, lock) {
  const gaps = [];
  const managed = Object.keys(lock.files);
  for (const [kind, dir, fileOf] of [
    ["skill", ".claude/skills", (n) => join(n, "SKILL.md")],
    ["agent", ".claude/agents", (n) => n],
  ]) {
    const base = join(app, dir);
    if (!existsSync(base)) continue;
    const shared = new Set(
      managed.filter((p) => p.startsWith(`${dir}/`)).map((p) => p.slice(dir.length + 1).split("/")[0].replace(/\.md$/, "")),
    );
    for (const entry of readdirSync(base).filter((n) => !n.startsWith(".")).sort()) {
      const name = entry.replace(/\.md$/, "");
      if (shared.has(name)) continue;
      if (kind === "agent" && !entry.endsWith(".md")) continue;
      const rel = `${dir}/${fileOf(entry)}`;
      if (!existsSync(join(app, rel))) {
        gaps.push(`${dir}/${entry}: a skill folder needs a SKILL.md`);
        continue;
      }
      const fm = frontmatter(readFileSync(join(app, rel), "utf8"));
      if (!fm?.name || !fm?.description) gaps.push(`${rel}: front matter needs a name and a description`);
      else if (shared.has(fm.name)) gaps.push(`${rel}: ${kind} name "${fm.name}" clashes with a harness ${kind}`);
    }
  }
  return gaps;
}

/** Relative links in CLAUDE.md, README.md, docs/ and the app's own .claude/ Markdown that point at a file that isn't there. */
function linkGaps(app, lock) {
  const files = ["CLAUDE.md", "README.md"].filter((f) => existsSync(join(app, f)));
  for (const f of listFiles(join(app, "docs"))) if (f.endsWith(".md")) files.push(toPosix(relative(app, f)));
  for (const f of listFiles(join(app, ".claude"))) {
    const rel = toPosix(relative(app, f));
    if (rel.endsWith(".md") && !(rel in (lock?.files ?? {}))) files.push(rel);
  }
  const gaps = [];
  for (const rel of files) {
    const text = readFileSync(join(app, rel), "utf8")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`\n]*`/g, "");
    for (const [, target] of text.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      if (/^([a-z][a-z0-9+.-]*:|#|\/|<|\{\{)/i.test(target)) continue;
      let path = target.split(/[#?]/)[0];
      try {
        path = decodeURIComponent(path);
      } catch {
        // Keep it as written.
      }
      if (path && !existsSync(join(app, dirname(rel), path))) gaps.push(`${rel}: broken link to ${target}`);
    }
  }
  return gaps;
}

/** { problems, notes }: problems fail the check, notes don't. */
export function health(app, studio) {
  const problems = [];
  const notes = [];
  let r;
  try {
    r = compare(app, studio);
  } catch (e) {
    return { problems: [`the harness lock can't be read: ${e.message}`], notes };
  }
  if (!r.installed) return { problems: [`no studio harness lock (${LOCK}); install it with the new-app skill`], notes };
  const lock = readLock(app);
  if (r.edited.length) problems.push(`shared harness files edited here (change them in app-studio, then harness-sync): ${r.edited.join(", ")}`);
  if (r.missing.length) problems.push(`shared harness files missing here (harness-sync pull restores them): ${r.missing.join(", ")}`);
  if (!existsSync(join(app, "CLAUDE.md"))) problems.push("CLAUDE.md is missing");
  else if (!readFileSync(join(app, "CLAUDE.md"), "utf8").includes("## App profile"))
    problems.push('CLAUDE.md has no "## App profile" section (merge it from app-studio\'s templates/CLAUDE.md)');
  const gaps = profileGaps(app);
  if (gaps.length) problems.push(`the App profile in CLAUDE.md still has ${gaps.length} placeholder(s), for example:\n${gaps.slice(0, 3).map((g) => `      ${g}`).join("\n")}`);
  problems.push(...hookGaps(app), ...ownGaps(app, lock), ...linkGaps(app, lock));
  for (const [pack, file] of REQUIRED_STARTERS)
    if (lock.packs?.[pack] && !existsSync(join(app, file)))
      problems.push(`${file} is missing (the ${pack} pack's starter; copy it from app-studio's packs/${pack}/starter/)`);
  const behind = [...r.behind, ...r.added, ...r.removed];
  if (behind.length) notes.push(`behind app-studio v${r.studioVersion} in ${behind.length} file(s); the harness-sync skill brings it in step`);
  if (r.starters.length) notes.push(`pack starter files changed in app-studio: ${r.starters.map((n) => n.path).join(", ")}`);
  if (!studio) notes.push("app-studio not found, so the copy was checked against its lock only");
  return { problems, notes, version: r.version };
}

function main() {
  const argv = process.argv.slice(2);
  const code = run(argv);
  if (code === 2 || argv[0] === "ack") return code;
  let app;
  try {
    ({ app } = locate(parseArgs(argv)));
  } catch {
    return code;
  }
  const notes = activateHooks(app);
  const quiet = argv.includes("--warn") ? notes.filter((n) => n.includes("is off")) : notes;
  if (quiet.length) console.log(quiet.map((n) => `Harness hooks: ${n}.`).join("\n"));
  else if (argv[0] === "hooks") console.log("Harness hooks are on.");
  return code;
}

function run(argv) {
  let opts, app, studio;
  try {
    opts = parseArgs(argv);
    ({ app, studio } = locate(opts));
  } catch (e) {
    console.error(e.message);
    return argv.includes("--warn") ? 0 : 2;
  }

  if (opts.cmd === "check") {
    let r;
    try {
      r = compare(app, studio);
    } catch (e) {
      console.log(`Studio harness check failed: ${e.message}`);
      return opts.warn ? 0 : 1;
    }
    const gaps = profileGaps(app);
    const notes = r.starters.length
      ? [
          "Pack starter files changed in app-studio (the app owns them; use the harness-sync skill):",
          ...r.starters.map(
            (n) => `  ${n.path} (${n.pack} pack): ${n.refreshable ? "unedited here, pull refreshes it" : "edited here, merge by hand then run ack"}`,
          ),
        ]
      : [];
    if (gaps.length)
      notes.push("The App profile in CLAUDE.md still has unfilled placeholders:", ...gaps.map((g) => `  ${g}`));
    if (!drift(r)) {
      if (notes.length) console.log(notes.join("\n"));
      if (!studio && opts.warn && process.env.CLAUDE_CODE_REMOTE === "true")
        notes.push("app-studio isn't attached to this session, so the harness copy wasn't compared with the master copy.");
      if (!notes.length && !opts.warn)
        console.log(
          `Studio harness v${r.version} is in step${studio ? "" : " with its lock (app-studio not found, so not compared with the master copy)"}.`,
        );
      return 0;
    }
    const lines = r.installed
      ? [
          `Studio harness v${r.version}${r.studioVersion ? ` (app-studio has v${r.studioVersion})` : ""} is out of step:`,
          ...list("behind app-studio", r.behind),
          ...list("new in app-studio", r.added),
          ...list("removed in app-studio", r.removed),
          ...list("edited here", r.edited),
          ...list("missing here", r.missing),
          "Use the harness-sync skill to bring it in step.",
          ...notes,
        ]
      : [`No studio harness lock in ${app} (${LOCK}). Install it with the new-app or harness-sync skill.`];
    console.log(lines.join("\n"));
    return opts.warn ? 0 : 1;
  }

  if (opts.cmd === "health") {
    const h = health(app, studio);
    const notes = h.notes.map((n) => `  note: ${n}`);
    if (!h.problems.length) {
      console.log([`Studio harness v${h.version} is healthy.`, ...notes].join("\n"));
      return 0;
    }
    console.log(
      ["Studio harness health check failed:", ...h.problems.map((p) => `  - ${p}`), ...notes].join("\n"),
    );
    return 1;
  }

  if (opts.cmd === "pull" || opts.cmd === "install") {
    if (!studio) {
      console.error("app-studio not found. Pass --studio <dir> or set STUDIO_DIR.");
      return 2;
    }
    let r;
    try {
      r = (opts.cmd === "install" ? install : pull)(app, studio, opts);
    } catch (e) {
      console.error(e.message);
      return 1;
    }
    const lines = [
      `Studio harness v${studioVersion(studio)} ${opts.cmd === "install" ? "installed in" : "pulled into"} ${app}.`,
      ...list("updated", r.written),
      ...list("deleted", r.deleted),
      ...list("added from templates", r.templates ?? []),
      ...list("pack starters refreshed", r.refreshed ?? []),
      ...list("pack starters changed upstream but edited here (merge by hand, then ack)", r.starterNotes ?? []),
      ...list("skipped (changed here; move the change to app-studio, or pass --force)", r.skipped),
    ];
    console.log(lines.join("\n"));
    return r.skipped.length ? 1 : 0;
  }

  if (opts.cmd === "pack") {
    const [sub, ...names] = opts.rest;
    if ((sub !== "add" && sub !== "remove") || !studio) {
      console.error(studio ? "Usage: studio-sync.mjs pack add <name...> [--slug <kebab>] [--title <Name>] | pack remove <name...> [--force]" : "app-studio not found. Pass --studio <dir> or set STUDIO_DIR.");
      return 2;
    }
    if (sub === "remove") {
      let r;
      try {
        r = removePacks(app, studio, names, opts);
      } catch (e) {
        console.error(e.message);
        return 1;
      }
      console.log(
        [
          `Packs removed from ${app}: ${r.removed.join(", ")}.`,
          ...list("managed files deleted", r.deleted),
          ...list("starter files kept (the app's own now)", r.startersKept),
          ...list("skipped (changed here; pass --force)", r.skipped),
          "  package.json entries and any files you built on the pack stay; remove those by hand if unused.",
        ].join("\n"),
      );
      return r.skipped.length ? 1 : 0;
    }
    let r;
    try {
      r = addPacks(app, studio, names, opts);
    } catch (e) {
      console.error(e.message);
      return 1;
    }
    console.log(
      [
        `Packs added to ${app}: ${r.added.join(", ") || "none new"}.`,
        ...list("managed files", r.written),
        ...list("starter files created", r.created),
        ...list("starter files kept (already there, different)", r.kept),
        ...list("package.json entries added", r.packageJson),
        ...list("skipped (changed here; pass --force)", r.skipped),
      ].join("\n"),
    );
    return r.skipped.length ? 1 : 0;
  }

  if (opts.cmd === "hooks") return 0;

  if (opts.cmd === "ack") {
    if (!studio) {
      console.error("app-studio not found. Pass --studio <dir> or set STUDIO_DIR.");
      return 2;
    }
    const done = ack(app, studio, opts.rest);
    console.log(done.length ? `Marked as reviewed: ${done.join(", ")}` : "Nothing to mark.");
    return 0;
  }

  console.error("Usage: studio-sync.mjs <install|check|health|pull|pack add|pack remove|ack|hooks> [--app <dir>] [--studio <dir>] [--warn] [--force]");
  return 2;
}

// Run main only when executed directly, not when imported by the tests.
const same = (a, b) => {
  const norm = (p) => realpathSync(p)[process.platform === "win32" ? "toLowerCase" : "toString"]();
  return norm(a) === norm(b);
};
if (process.argv[1] && existsSync(process.argv[1]) && same(process.argv[1], fileURLToPath(import.meta.url))) {
  process.exitCode = main();
}

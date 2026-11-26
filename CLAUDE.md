# Habit Tracker — project instructions

Read this first in every session. It applies to every change in this repo.

## App profile

The skills and agents in `.claude/` are the shared studio harness, copied from `app-studio`. They know nothing about this app: they read this table and the two lists below for everything app-specific. Keep it current.

| Field          | Value                                                                       |
| -------------- | --------------------------------------------------------------------------- |
| App            | Habit Tracker                                                               |
| Id prefix      | `HT` (backlog items are `HT-001`, `HT-002`, …)                        |
| Stack          | `artifact`                                       |
| User           | Ale, as someone tracking daily habits           |
| Repo           | https://github.com/ildruido/studio-scratch (private)                                |
| Release target | https://claude.ai/artifact/7iPxK1VYa2DezPqXZe5eZh (private Claude artifact)                      |
| Preview target | none                                |
| Capabilities   | `{"db": {}}` (saved habits and check-ins) |
| AI             | off (existing app: no AI) |
| AI plan        | none |
| Access model   | `whoever the owner shares it with (artifact app)` (existing app: private artifact, no sign-in) |
| Storage shape  | `per-person documents` (existing app: one person's habits and check-ins in `db`) |
| Decision log   | `docs/discovery/decision-log.md` |
| Owner-merged repos | |
| Phase          | discovery |

### Domain rules

Rules about this app's subject that every plan, prompt and diff must respect. The planner lists them under Risks, prd-intake checks requests against them, and the reviewer treats a breach as blocking.

- At most 5 habits; a habit is just a name.
- A day is ticked or not; ticking the same habit twice on one day never counts twice.
- Streak = consecutive days ending today (or yesterday if today is not yet ticked); a missed day resets it to 0.
- No sign-in, no AI. Data lives in the `db` capability; the page still renders if it is absent.

### Stack notes

Build, QA and release steps that depend on the stack. Skills say "the stack notes" when they mean this list **plus** the docs of each stack pack the app has (`.claude/packs/<name>/`, listed under `packs` in `.claude/studio/lock.json`): `STACK.md` (rules and limits), `RELEASE.md`, `QA.md` and `REVIEW.md`. Keep this list to what is specific to this app; the packs cover the rest.

- **Build:** `npm run build` produces one `dist-artifact/index.html` (< 16 MB).
- **QA:** see `.claude/packs/artifact/QA.md`; fake `db` in e2e; streak logic unit-tested with fixed dates.
- **Release:** `.claude/packs/artifact/RELEASE.md`, capabilities `{"db": {}}`.
- **Preview:** none.

## Discovery profile

The discovery skills are generic: they read this section for everything about this product. Keep it current as the documents evolve (`node .claude/hooks/app-setup.mjs discovery-profile set "Row=value"`). What each row means: `.claude/packs/discovery/STACK.md`.

| Field | Value |
| --- | --- |
| Product        | A booking page for a small yoga studio |
| Target users   | Owners of one-room yoga studios |
| Starting idea  | `docs/discovery/starting-idea.md` (a starting point, not a fixed plan) |
| Docs folder    | `docs/discovery/` |
| Sign-off mode  | per artifact |
| Exit criteria  | default |
| Principles     | not set yet |
| Domain risks   | not set yet |
| Prototype look and feel | not set yet |

## Roles

<!-- studio:begin roles (harness-owned: a sync replaces everything up to the end marker; keep app-specific roles outside it) -->
- **The App Creator (PM) and the Tester.** The App Creator is also the Tester unless someone else tests. The App Creator describes requirements and sets priority by ordering the backlog; the Tester tests releases and reports results. Neither writes code, runs commands or manages git. The few things only the Admin can do (creating a repo, adding a repository secret, a host's settings) Claude hands over as exact clicks.
- **Claude (engineer).** Owns all code, tests, versioning, releases and the harness. Turns the App Creator's words into PRD and backlog changes, builds, ships and hands over a test script.
- Ask the App Creator only when a requirement is genuinely ambiguous or a decision is product-level. Ask one question at a time, each with a recommended answer and one line on why. Everything technical is ours to decide.
<!-- studio:end roles -->

## The product in one paragraph

A tiny habit tracker: Ale adds up to 5 daily habits (just a name), ticks off the ones done each day, and sees each habit's current streak next to it. The one rule: a missed day resets the streak to zero, and a day is never counted twice. See `docs/PRD.md` and `docs/BACKLOG.md` (finished items are archived in `docs/BACKLOG-DONE.md`; read it only to look one up).

## Stack and commands

Every app defines these npm scripts; the harness relies on them.

| Command            | What it does                                                   |
| ------------------ | -------------------------------------------------------------- |
| `npm run dev`      | Local dev server                                               |
| `npm run check`    | Format check, lint, unit tests, build. Run before every push   |
| `npm test`         | Unit tests                                                     |
| `npm run test:e2e` | Build, then the browser tests (`-- e2e/<name>.spec.ts` for one area) |
| `npm run build`    | Production build                                               |

Layout: `src/` app code (keep logic that doesn't touch the DOM in plain modules so it is unit-testable), `tests/unit/` unit tests, `e2e/` browser tests, `docs/` PRD and backlog, `.claude/` harness.

Scripts: `build` builds the app's primary target; `build:artifact` and `build:web` build one target each (added by the stack packs). Browser tests live in `e2e/<target>/`.

Platform layer: every host capability (storage, AI calls, sign-in, voice, downloads) is reached through one platform module, so the artifact and web builds swap implementations without touching features.

CI (`.github/workflows/ci.yml`, a starter file from the stack pack that is now this app's own) runs once per PR and on `main`, scaled to what changed: Markdown-only and harness-only (`.claude/`) changes start no run (the `Harness` workflow checks those), a version bump skips the browser tests, draft PRs wait until marked ready, and `main` runs only the quick checks after a merge (start the full suite by hand before a release). Push once per feature.

## Runtime rules

- Every host capability (storage, AI, sign-in, downloads) may be missing or denied. Design for absence: the app still renders and explains itself.
- The app declares exactly the capabilities the code uses (App profile, Capabilities). Adding one is a release-note item, because Ale gets a new consent prompt.
- AI calls happen only on a user action, never in a loop or timer. Branch on the error code; never retry automatically. Use the cheapest model tier that does the job (App profile, AI plan).
- Tests fake every host capability and AI call; they never call a real model.
- Only load what the stack allows from outside (see the stack notes); bundle everything else.

## Backlog and roadmap

The repo is the single source of truth: the roadmap is the **Roadmap** list (Now / Next / Later ids, in priority order) at the top of `docs/BACKLOG.md`. A roadmap page, if the app has one, is rebuilt from it (`npm run roadmap:data`), never edited by hand.

- **The coordinator (the Project chat) owns Ale's product decisions:** new ideas, priorities and order. It has the backlog change made in a short thread of its own (no standing roadmap thread, which would be a long-idle thread revived over and over), and that thread places new items in the list and rebuilds the roadmap page.
- **Planning threads** may add Ale-approved items to the backlog in their own PR (the plan and its items stay together) but must place every new open item in the Roadmap list. The coordinator gives a planning thread an ID range up front.
- **Feature threads** keep marking their own items To test and Done (`test-handoff`) and move them out of the Roadmap list when they reach Done.
- **A check keeps it honest:** the unit test `tests/unit/roadmap.test.ts` (and `npm run roadmap:check`, for Markdown-only PRs that start no CI) fails when an open item is missing from the Roadmap list, listed twice, or listed but not open.

## Definition of done

A backlog item is done when all of these are true:

1. Every acceptance criterion in `docs/BACKLOG.md` is met.
2. New logic has unit tests; any new user flow has a browser test.
3. `npm run check` and the e2e specs for the changed area pass locally, and CI (the full suite) is green on the PR.
4. The `reviewer` agent has reviewed the diff and its blocking findings are fixed.
5. `CHANGELOG.md` has an entry under `Unreleased`.
6. The item moved to **To test** with a test script for Ale (`test-handoff` skill). It moves to **Done** only after Ale confirms.

## Git workflow

- Never commit straight to `main`. One branch per backlog item: `feat/<id>-<slug>`, `fix/<id>-<slug>`, `chore/<slug>`.
- **Conventional Commits** for every commit: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`, `ci:`, `build:`. Add a scope when useful. Breaking changes use `!` or a `BREAKING CHANGE:` footer. Reference the backlog id in the body (`Refs: <XX>-012`).
- **Tests green before every push.** Run `npm run check` first; the Stop hook also runs the unit tests. Never push red, never skip hooks.
<!-- studio:begin merge-rule (harness-owned: a sync replaces everything up to the end marker; keep app-specific rules outside it) -->
- **Merging a PR** (every skill that says "merge it" means this). Open it ready for review with a Conventional Commit title. **Never open a draft PR: its checks are skipped and it never merges, silently.** Read it back (`pull_request_read`, `get`); if `draft` is `true`, mark it ready (`update_pull_request`, `draft: false`) before you hand back. Then squash-merge once `CI gate` and `health` are green, else switch on auto-merge (`enable_pr_auto_merge`, `SQUASH`) and follow the PR (`subscribe_pr_activity` plus a wake-up about 3 minutes out). Never bypass a check or merge a blocked PR. The full procedure is `.claude/skills/build-feature/merge.md`.
  - **Owner-merged repos** (App profile): never merge, auto-merge or approve there; open the PR and say it waits for the App Creator.
  - **No safety checks, no merge.** If the session did not start with "Studio harness loaded" (see `.claude/skills/harness-sync/harness.md`, "Cloud sessions"), say so in your first reply and leave merging to the App Creator unless `/tmp/studio-hooks.log` shows hooks ran.
  - **`app-studio` is never changed from here, with no exceptions** (no approval lifts it): decline in one line and file a `harness-idea` issue instead. Issues and comments there stay allowed.
<!-- studio:end merge-rule -->
- **The checks.** Every PR gets `CI gate` (it sums up the `CI` jobs: a job rightly skipped, as for a Markdown- or `.claude/`-only change, counts as passed, and a draft never passes) and `health` (the `Harness` workflow). Never merge around them.
- Never force-push `main`. Never rewrite a published tag.
- Scratch rule: keep this line.

## Versioning and releases

- **SemVer tags** `vMAJOR.MINOR.PATCH` on `main`, matching `package.json`'s `version`. While below 1.0.0: `feat` bumps MINOR, `fix` bumps PATCH, breaking changes bump MINOR.
- `CHANGELOG.md` follows Keep a Changelog. Work lands under `Unreleased`; a release moves it under the new version with the date.
- Releases follow the `release` skill: only from a green `main`, then the stack notes' release steps, so Ale's link never changes.

## Harness

- Shared harness, copied from `app-studio` (the master copy) and pinned in `.claude/studio/lock.json`: skills `prd-intake`, `build-feature`, `test-handoff`, `release`, `new-app`, `harness-sync`, `harness-idea`; agents `planner`, `reviewer`, `qa`; hook scripts `.claude/hooks/check.mjs`, `.claude/hooks/cloud-setup.mjs` and the git hook `.claude/hooks/pre-commit`; and the stack packs' docs in `.claude/packs/`. Anything app-specific goes in the App profile above.
- **The harness changes only in `app-studio`'s own Project or session, never from this app's work.** Don't edit these files here and don't change `app-studio` from here: send ideas with the `harness-idea` skill (it opens an issue on app-studio), and pull released changes with the `harness-sync` skill when Ale asks.
- A stack pack's starter files (CI workflow, configs, server, platform adapters) were copied in once and are this app's own code. When `app-studio` improves one, the session-start check says so; merge it by hand and run `node .claude/studio/studio-sync.mjs ack`.
- Hooks in `.claude/settings.json`: ESLint on every edited TS/JS file, unit tests when a turn ends, a harness sync warning when a session starts, a harness health check before every `git commit` (`node .claude/studio/studio-sync.mjs health`: shared files unedited, this App profile filled in, hooks wired, the app's own skills and agents well formed, doc links working, the `Harness` workflow present), a merge gate on the GitHub merge tool (blocks until the PR's checks were read and are all green), and a block on writing files to this repo through the GitHub API (use the local clone, so the health check runs). The health check is also a real git pre-commit hook (`core.hooksPath` = `.claude/hooks`), which every `studio-sync.mjs` command turns on, so it holds for any commit. A lint, test, health or merge hook failure is a blocker: fix it, don't bypass it (no `--no-verify`).
- The `Harness` workflow (`.github/workflows/harness.yml`) runs the same health check on PRs that touch `.claude/`, Markdown or workflows, so a harness- or docs-only change is still checked.

## Cloud sessions (claude.ai/code)

- **One branch.** A cloud session is given one branch (e.g. `claude/…`) and may push only there. Use it for every PR in turn: after a squash-merge, reset it to `origin/main` (`git reset --hard origin/main`) before the next item, and push only together with that item's first commit. Never push the bare reset: GitHub deletes the branch on merge and that push would recreate it as a leftover. Don't push any other branch from a cloud session; open the PR from the session branch. The PR title and `Refs:` carry the item id.
- **Tags are made by CI.** A cloud session can't push tags (the git proxy refuses them), so the `Release tag` workflow tags each release when its PR merges (`release` skill, step 8). Only an app without that workflow lists pending tags in `docs/RELEASES.md` for a local session to push.
- **Several repos attached (always, in a Claude Code Project).** The session then starts in the folder above this repo, and Claude Code loads skills, agents and `.claude/settings.json` only from that start folder, so nothing of this app's harness loads by itself. The **"app-studio apps" cloud environment** fixes that before the session starts: its setup script (`app-studio/scripts/env-setup.sh`) wires a launcher into the start folder that, at every session start and hook, links this app's skills and agents there, runs this app's hooks, installs dependencies (`cloud-setup`), sets `PW_CHROMIUM` and turns on the git pre-commit check, and the session opens with "Studio harness loaded for the app repo …". **Without that message**, run `node <this repo>/.claude/studio/studio-sync.mjs check` before any other work: it turns on the git pre-commit check and forwards the lint, test, merge and write hooks to the start folder's settings (Claude Code usually picks those up mid-session, but not always; the git pre-commit check holds either way, and the merge and write rules in "Git workflow" apply even if no hook stops you). Then run `npm ci` here if the app has dependencies, and tell Ale the session isn't on that environment.
- **One repo attached.** This repo's own `.claude/` loads, and the `SessionStart` hook `.claude/hooks/cloud-setup.mjs` (cloud sessions only) installs dependencies (the container's global Prettier is older than the repo's, so `npm run check` fails on untouched files until `npm ci` has run), sets `PW_CHROMIUM`, and runs the app's own `scripts/cloud-setup.sh` if it has one (e.g. a local database for server tests). Output: `/tmp/cloud-setup.log`. The environment's setup script runs that script too.
- **E2E:** the container's Chromium may not match Playwright's, so `PW_CHROMIUM` points at it (set by the environment or `cloud-setup`). If it's unset: `PW_CHROMIUM=/opt/pw-browsers/chromium-<n>/chrome-linux64/chrome npm run test:e2e` (`chrome-linux` on older images; check the folder names under `/opt/pw-browsers`). Never run `playwright install`.
- **Keep command output small.** Pipe test, build and CI output through `| tail -n 40` (or list only failing test names); read the failing CI job's log, not the whole run. Agents return short findings, not command transcripts.

## Models and threads

In a Claude Code Project these are Project settings, which `new-app` asks the coordinator to set; the Project instructions (template: `app-studio/plugins/studio/templates/project-instructions.md`) repeat the thread rules for every thread.

- **Opus:** the Project coordinator, and reviews of risky diffs (AI prompts, storage, capabilities, auth).
- **Sonnet (medium effort):** feature, backlog, release and harness-sync threads.
- Raise effort or model only after a thread fails twice, never up front.
- **A thread stays inside its backlog item.** When the item is done or blocked it hands back (the PR description and a short message) and stops; it never proposes, plans or starts the next item or phase, even if offered. Only the coordinator picks the next item and starts its thread. If a thread catches itself about to go past its item, it stops and tells the coordinator.
<!-- studio:begin thread-reports (harness-owned: a sync replaces everything up to the end marker; keep app-specific rules outside it) -->
- **Point, don't repeat.** The App Creator reads and answers in threads. A thread puts everything the App Creator must act on in its own message: the result in plain English, the test steps, and any product decision about its own item (one question, with a recommended answer; a release question about its own item too). The coordinator then posts only "<what is needed> - open the thread", with the thread link. It does not restate the result, the test steps or PR numbers, and it adds no question of its own, even though a coordinator's habit is to relay results. With parallel threads it posts one such line per thread. A summary is for a matter that spans threads (ordering, the next item, one release covering several). The App Creator can ask a thread for a shorter recap.
<!-- studio:end thread-reports -->
- One thread per backlog item. A bug found in Ale's testing gets a new thread that reads the backlog item and its PR. Don't reopen the old thread.
- **Never resume a thread that has been idle for over an hour.** Its cached context has expired, so the first step re-pays the whole context. Start a new thread that reads the backlog item and its PR instead; that's why every PR description ends with a hand-over (what changed, what's left, how to test).

## Writing for the App Creator

Plain English, no jargon. Lead with what changed for the user, then how to check it. Test scripts are numbered steps with an expected result each.

Before saying something is done, check it, and say plainly what you did not check (for example, "no code tests ran" or "not tried on a phone").

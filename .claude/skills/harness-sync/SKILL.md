---
name: harness-sync
description: Pull released app-studio updates into this app - update the harness, add or remove a stack pack or module ("add the web pack"), or act on a start-up warning that the harness is behind. Not for old hand-built apps (migrate-app). Never changes app-studio itself.
---

# Harness sync

`app-studio` holds the master copy of the shared skills, agents, hook script and stack packs. Each app carries a copy pinned in `.claude/studio/lock.json` (studio version plus a hash per file). `.claude/studio/studio-sync.mjs` compares the two; it looks for `app-studio` in `--studio <dir>`, then `$STUDIO_DIR`, then a sibling `../app-studio` checkout, then any sibling folder that is an app-studio checkout (cloud sessions clone attached repos side by side).

## Pull updates into an app (part A)

1. `git -C ../app-studio pull` so the master copy is current.
2. `node ../app-studio/scripts/studio-sync.mjs check --app .`. It lists files that are **behind** (changed in `app-studio`), **edited** (changed here since the last sync) and **missing**.
3. An **edited** file is a local change that never reached `app-studio`. Send it as an idea (`harness-idea` skill) if it would help every app, or move it to the App profile if it was app-specific; then let step 4 restore the shared version (`--force`).
4. `node ../app-studio/scripts/studio-sync.mjs pull --app .` (the master script, so a newer copy rule applies on the first pull). If it stops with "not live-checked yet", the newest release is marked `Live check: pending` in `app-studio`'s `CHANGELOG.md`: nothing was changed; tell the App Creator and stop. Never work around it, never pass `--live-check` (only the studio-scratch check does). It updates the managed files and the lock, and also adds missing template wording to `CLAUDE.md` (the Decision log row, the "say plainly what you did not check" line; app text is never replaced). It refuses to overwrite an edited file unless you pass `--force`.
5. **Pack starter files** (CI workflow, configs, server, platform adapters) are the app's own code. `pull` refreshes the ones you never edited and adds files new in a pack; for the rest the check says "edited here". If it says starter files are **held back** (the app calls a module's capability, e.g. `sample()`, without that module), add the module it names in the same sync (`pack add ai`, or `pack add ai-web` on the web) and follow its **App action** in the changelog. Read the pack's entry in `app-studio`'s `CHANGELOG.md`, diff the file against `app-studio/packs/<name>/starter/…` (placeholders `{{slug}}` and `{{title}}` stand for the app's name), merge what applies, then run `node .claude/studio/studio-sync.mjs ack` so the note stops.
6. Read `app-studio`'s `CHANGELOG.md` for the versions you skipped. Apply any step it marks **App action** (for example a new App profile field or a settings change). `pull` does not print the changelog's steps, so read them yourself. An **Admin action** is not yours to do: relay it to the App Creator (or, in a Project, the coordinator) as exact, copy-ready steps, and say in the sync summary that it is pending.
   Then look for this app's own ideas that got fixed: closed issues on `app-studio` whose body names this app, with the label `harness-idea` or `studio-backlog`. Their closing comment names the release. Say in the sync summary which of this app's ideas were fixed and in which release, and which were declined (and why).
7. **Project instructions.** If the `pull` or `check` output says "Project instructions template changed", an app's instructions live in Project settings, so no sync can update them. Tell the coordinator in your hand-back with the ready prompt the tool printed; the coordinator compares and updates its own instructions (keeping app-specific text). Once the coordinator confirms, run `node .claude/studio/studio-sync.mjs ack instructions` and commit the lock. Until then the start-up check keeps reminding.
8. Run `node .claude/studio/studio-sync.mjs health` and fix what it reports (the commit hook blocks the commit otherwise). Commit `chore(harness): sync studio vX.Y.Z` and merge it via a PR (CLAUDE.md "Git workflow"). Only `.claude/` changed, so `CI gate` passes quickly and `health` checks the harness.

An app set up before the harness had modules or a lock is not a plain sync: use the `migrate-app` skill, which starts with `studio-sync.mjs inventory` and the App Creator's OK on a plan.

## Add a stack pack to an existing app

`node .claude/studio/studio-sync.mjs pack add <name>` (for example when an artifact prototype gets a web version: `pack add web`). Files the app already has are kept and listed; merge those by hand from `app-studio/packs/<name>/starter/`. Then `npm install` (and `npm install --prefix server` for `web`) and commit the lockfiles. Adding `web` to an artifact app: replace `.github/workflows/ci.yml` with the web starter by hand and set `build` to `build:web`.

## Changing the harness itself

Never from an app. If the harness needs to change, send a `harness-idea` (the `harness-idea` skill). Changing app-studio happens only in the app-studio Project, as `docs/GOVERNANCE.md` in the app-studio repo says.

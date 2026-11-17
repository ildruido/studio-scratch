---
name: harness-sync
description: Keep an app's copy of the studio harness in step with app-studio - pull released updates into an app, or (only in app-studio's own Project or session) change the harness and roll it out. Use when a session warns the harness is behind or edited, when the App Creator asks to update an app's harness, or when working on app-studio itself.
---

# Harness sync

`app-studio` holds the master copy of the shared skills, agents, hook script and stack packs. Each app carries a copy pinned in `.claude/studio/lock.json` (studio version plus a hash per file). `.claude/studio/studio-sync.mjs` compares the two; it looks for `app-studio` in `--studio <dir>`, then `$STUDIO_DIR`, then a sibling `../app-studio` checkout, then any sibling folder that is an app-studio checkout (cloud sessions clone attached repos side by side).

## Part A: pull updates into an app

1. `git -C ../app-studio pull` so the master copy is current.
2. `node ../app-studio/scripts/studio-sync.mjs check --app .`. It lists files that are **behind** (changed in `app-studio`), **edited** (changed here since the last sync) and **missing**.
3. An **edited** file is a local change that never reached `app-studio`. Send it as an idea (`harness-idea` skill) if it would help every app, or move it to the App profile if it was app-specific; then let step 4 restore the shared version (`--force`).
4. `node ../app-studio/scripts/studio-sync.mjs pull --app .` (the master script, so a newer copy rule applies on the first pull). If it stops with "not live-checked yet", the newest release is marked `Live check: pending` in `app-studio`'s `CHANGELOG.md`: nothing was changed; tell the App Creator and stop. Never work around it, never pass `--live-check` (only the studio-scratch check does). It updates the managed files and the lock, and also adds missing template wording to `CLAUDE.md` (the Decision log row, the "say plainly what you did not check" line; app text is never replaced). It refuses to overwrite an edited file unless you pass `--force`.
5. **Pack starter files** (CI workflow, configs, server, platform adapters) are the app's own code. `pull` refreshes the ones you never edited and adds files new in a pack; for the rest the check says "edited here". If it says starter files are **held back** (the app calls a module's capability, e.g. `sample()`, without that module), add the module it names in the same sync (`pack add ai`, or `pack add ai-web` on the web) and follow its **App action** in the changelog. Read the pack's entry in `app-studio`'s `CHANGELOG.md`, diff the file against `app-studio/packs/<name>/starter/…` (placeholders `{{slug}}` and `{{title}}` stand for the app's name), merge what applies, then run `node .claude/studio/studio-sync.mjs ack` so the note stops.
6. Read `app-studio`'s `CHANGELOG.md` for the versions you skipped. Apply any step it marks **App action** (for example a new App profile field or a settings change).
   Then look for this app's own ideas that got fixed: closed issues on `app-studio` whose body names this app, with the label `harness-idea` or `studio-backlog`. Their closing comment names the release. Say in the sync summary which of this app's ideas were fixed and in which release, and which were declined (and why).
7. **Project instructions.** If the `pull` or `check` output says "Project instructions template changed", an app's instructions live in Project settings, so no sync can update them. Tell the coordinator in your hand-back with the ready prompt the tool printed; the coordinator compares and updates its own instructions (keeping app-specific text). Once the coordinator confirms, run `node .claude/studio/studio-sync.mjs ack instructions` and commit the lock. Until then the start-up check keeps reminding.
8. Run `node .claude/studio/studio-sync.mjs health` and fix what it reports (the commit hook blocks the commit otherwise). Commit `chore(harness): sync studio vX.Y.Z` and merge it via a PR (CLAUDE.md "Git workflow"). Only `.claude/` changed, so `CI gate` passes quickly and `health` checks the harness.

An app set up before the harness had modules or a lock is not a plain sync: use the `migrate-app` skill, which starts with `studio-sync.mjs inventory` and the App Creator's OK on a plan.

## Add a stack pack to an existing app

`node .claude/studio/studio-sync.mjs pack add <name>` (for example when an artifact prototype gets a web version: `pack add web`). Files the app already has are kept and listed; merge those by hand from `app-studio/packs/<name>/starter/`. Then `npm install` (and `npm install --prefix server` for `web`) and commit the lockfiles. Adding `web` to an artifact app: replace `.github/workflows/ci.yml` with the web starter by hand and set `build` to `build:web`.

## Part B: change the harness itself

**Only in a Project or session that works on `app-studio` alone**, never from an app's work (apps send `harness-idea` issues instead). Start from the open issues labelled `harness-idea`: decide with the App-Studio Owner which to build, and close the others with a one-line reason.

1. Make the change in `app-studio` on its own branch (the session branch in a cloud session). Keep the core generic: app facts go in an App profile, stack facts in a stack pack (`packs/<name>/`: `managed/` docs kept in step, `starter/` files copied once; bump the pack's `version` in `pack.json` when you change it). `node scripts/core-lint.mjs` must pass.
2. Bump `version` in `plugins/studio/.claude-plugin/plugin.json` (PATCH for wording and fixes, MINOR for a new skill, agent or profile field) and add a `CHANGELOG.md` entry. Mark anything an app must do by hand as **App action**. A release that changes what apps get starts its entry with the line `Live check: pending`; after the studio-scratch check passes (run there with `--live-check`), a small PR changes it to `Live check: passed <date>`, and only then can apps pull it.
3. Run `node --test scripts/studio-sync.test.mjs`, open a PR that closes the issues it builds (`Closes #<n>`), merge it when CI is green.
4. Apps pick it up with part A, in a thread of their own Project, when the App Creator asks. Tell the App-Studio Owner which apps it matters for.
5. **Rolling out to every app at once** (a change with an **App action** that matters now): list the app repos (those with `.claude/studio/lock.json`; ask the App-Studio Owner if unsure) and give the App-Studio Owner one line per app to paste into that app's Project coordinator ("Run harness-sync part A for app-studio vX.Y.Z"), one PR per app.

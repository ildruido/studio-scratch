---
name: migrate-app
description: Move an existing app that was set up by hand or before the harness had modules onto the current harness and its feature modules, with no change for its users. Use when Ale asks to migrate an app, one app at a time, in that app's own Project.
---

# Migrate an existing app

For an app that already ships, set up before the harness had modules (AI, who is signed in, roadmap) or before it had a lock. Goal: the app runs on the current harness with the **same behaviour for its users**. The app keeps what it has: AI on, its sign-in mode (invite-only unless its profile says otherwise) and its own roadmap files. The harness never picks a feature for it; the modules just make the app's existing features explicit.

Run this **in the app's own Project**, never from app-studio, and **one app at a time**: the second app starts only after the first app's follow-up PR (step 6) has merged by itself. Between features is best: no feature branch should be open. If `inventory` stops you, tell Ale and stop; never work around it.

## Steps

1. **Look first (read-only).** Make sure `app-studio` is current (`git -C ../app-studio pull`) and that its newest release says `Live check: passed` (if it says pending, tell Ale and stop). Run `node ../app-studio/scripts/studio-sync.mjs inventory --app .` (the master script, so it works on an app whose own copy is old). It changes nothing. Also read, without changing them: the default branch and leftover branches, `.github/workflows/` against the pack starters it lists as differing, and the app's Project instructions as the coordinator reports them.
2. **Write the plan, and get Ale's OK.** Before any change, send Ale (through the coordinator) a short plan in plain product terms: what the app uses today (AI on, access model, storage), which modules get switched on, which of the app's own files differ and how each will be merged, the way back for each step, and anything the inventory flagged as a stop (below). Ale approves it; without the OK, stop.
3. **Migrate on one branch** (`chore/migrate-harness`), one PR, so the way back is reverting that PR:
   - `node ../app-studio/scripts/studio-sync.mjs pull --app .` (part A of `harness-sync`). If it says starter files are **held back**, that is expected: add the modules the inventory named in the same branch, `node .claude/studio/studio-sync.mjs pack add ai` (artifact-only app), or `pack add ai-web` on a web app (it adds `ai` too), plus `pack add user` when the inventory found `user()` calls. **Do not add `roadmap`** unless the app has none and Ale asks: an app with its own roadmap files keeps them as they are.
   - Merge by hand each file the inventory listed as **differ**, from `app-studio/packs/*/starter/…`, keeping the app's own behaviour, then `node .claude/studio/studio-sync.mjs ack`. Apply the **App action** lines in `CHANGELOG.md` for the versions skipped (0.8 to now), notably 0.14.0 (profile rows), 0.16.0 (platform files, `fakePlatform(fakeAi(...))` in tests) and 0.17.0 (sign-in mode).
   - Record in the App profile: `AI | on`, `AI plan` as it is today, `Access model | only invited people` (or what the app really does), and `Storage shape` as the app stores things. Keep the sign-in behaviour unchanged: with no `SIGN_IN_MODE` set the server means invite-only; setting it to `invite` in `render.yaml` and `.github/workflows/ci.yml` is optional and recommended, never `open` or `none` here.
   - `node .claude/studio/studio-sync.mjs health` must pass, then `npm run check` (and the server checks on a web app), then the app's browser tests.
4. **Stop on a usage table under another name.** If the inventory says the AI usage table is not `ai_usage`, do not add `ai-web`: the module would create an empty `ai_usage` and every user's monthly allowance would start from zero. Report it to Ale with the table's name and propose a safe copy as its own step. Never touch the app's live database from here.
5. **Open the PR** (ready for review, titled `chore(harness): migrate to studio vX.Y.Z`) with a hand-over: what changed, what the inventory found, **what wasn't verified** (typically the live site and real AI calls). Merge as the app's `CLAUDE.md` says.
6. **Prove it with one small follow-up PR** (a one-line docs change) that merges by itself. If auto-merge or the `main` ruleset isn't set up, say which of the one-time repo settings is missing (`new-app` step 10 has the exact clicks) and put it on Ale's checklist; never call the migration done before this PR has merged.
7. **Hand back to the coordinator**: the result, the inventory in one paragraph, what wasn't verified, and any Ale action (for example selecting the "app-studio apps" cloud environment when the start-up message doesn't say "Studio harness loaded"). Do not start the other app.

## Way back

Revert the migration PR: it restores the app's previous harness copy, files and profile in one step. Nothing outside the app's repo is touched, and the database is never changed by this skill (the module's `ai_001_usage.sql` changes nothing where `ai_usage` and `monthly_allowance` already exist, and runs only when the app is next deployed).

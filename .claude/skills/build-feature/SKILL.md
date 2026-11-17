---
name: build-feature
description: Build the top Ready backlog item end to end - branch, plan, implement, test, review, merge, changelog. Use when the App Creator says "build the next thing", names a backlog id, or asks for a fix.
---

# Build feature

App-specific facts (id prefix, stack, domain rules, stack notes) come from the **App profile** in `CLAUDE.md`. `<XX>` below is its id prefix.

## Steps

0. **Phase check.** Run `node .claude/studio/studio-sync.mjs phase --build-only`. If it stops (the App profile's Phase is `discovery`: no stack yet), tell the App Creator why in one line and stop; nothing here applies until the app starts building.
1. **Pick the item.** Take the top item under **Ready** in `docs/BACKLOG.md` (or the id the App Creator named). If Ready is empty, run `prd-intake` on what the App Creator asked for first.
2. **Sync and branch.** `git switch main && git pull`, then `git switch -c feat/<XX>-0NN-short-slug` (`fix/` for bugs). In a cloud session use the session branch instead (CLAUDE.md "Cloud sessions"). Move the item to **In progress**.
3. **Plan.** For anything beyond a one-file change, run the `planner` agent with the item text. Resolve its open questions using CLAUDE.md rules; ask the App Creator only for product-level questions.
4. **Write tests first where practical.**
   - Pure logic (prompts, adapters, scoring, storage mapping) goes in `src/` modules without DOM access, with unit tests in `tests/unit/`.
   - Each new user flow gets a browser test in `e2e/`. Fake every host capability in tests, and every AI call if the App profile says AI is on (see the stack notes); never call a real model from tests.
   - **Bugs: reproduce first.** Before changing code, write a test (unit or e2e) that shows what the App Creator saw, run it, and watch it fail for that reason. Find the root cause rather than patching the symptom; if three fixes in a row don't hold, stop and question the design instead of trying a fourth. The fix is done when that test passes and the rest of the suite stays green. Same rule for bugs the `reviewer` or `qa` agent finds.
5. **Implement** in small commits using Conventional Commits (`feat(scope): …`, `Refs: <XX>-0NN` in the body). Reach host capabilities only through the platform layer. Respect the App profile's domain rules and the stack notes' build limits.
6. **If capabilities change** (a host capability or permission is added or removed), update the Capabilities line in the App profile and note it for the release, because the App Creator will see a new consent prompt.
7. **Verify locally.** `npm run check` must pass, plus the e2e specs for the area you changed and any you added (`npm run test:e2e -- e2e/<name>.spec.ts …`). CI runs the full suite on the PR. Then run the `qa` agent and fix what it finds.
8. **Review.** Run the `reviewer` agent on `git diff main...HEAD`. Fix every blocking finding; note any deferred non-blocking ones as backlog items.
9. **Changelog.** Add a user-facing line under `## [Unreleased]` in `CHANGELOG.md` (Added / Changed / Fixed).
10. **Push and merge.** One push per feature: only push once step 7 and the reviewer are clean, because every push re-runs CI and CI minutes are limited. Push, then merge it as CLAUDE.md "Git workflow" says (PR opened ready, never a draft: read it back and confirm `draft: false`; then merge it if its checks already passed, else switch on auto-merge, subscribed to the PR plus a wake-up instead of waiting idle).
11. **Hand over.** Move the item to **To test** and run the `test-handoff` skill. Ship it to the Tester with the `release` skill when the Tester wants to test it (usually right away; if the Tester batches tests, hold the script until the batch ends). Hand back the full script to the coordinator, which posts it to the App Creator in the Project chat.
12. **Harness friction.** If a skill, agent or hook got in the way, note it for `app-studio` (`harness-sync` skill, part B) instead of editing the local copy.

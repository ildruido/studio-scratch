---
name: release
description: Cut a SemVer release from a green main - bump version, update CHANGELOG, tag, build and ship to the app's release target. Use when work under Unreleased should reach Ale.
---

# Release

Never release from a branch or a red `main`. The build and ship steps depend on the stack: they come from the **stack notes** in `CLAUDE.md`'s App profile and from `RELEASE.md` in each installed pack (`.claude/packs/<name>/`).

## Steps

1. **Preconditions.** Run `node .claude/studio/studio-sync.mjs release-gate`: it stops the release while the App profile's Access model is blank (ask Ale who can get in, record it, then continue), or while a web app's `SIGN_IN_MODE` in `render.yaml` or `.github/workflows/ci.yml` disagrees with it (fix the file, then continue), and while an app with AI that anyone can get into (open sign-up or no login) has no AI public use decision (say that a usage quota or spend cap is strongly recommended, ask Ale to decide, record it, then continue). `git switch main && git pull`. Working tree clean. Latest CI run on `main` is green. CI on `main` runs only the quick checks after a merge (the PR ran the full suite), so start the full suite on `main` before releasing: run `CI` with `workflow_dispatch` (Actions > CI > Run workflow, or the `actions_run_trigger` tool) and wait for it to pass. Skip this if the last code change on `main` already had a manual full run. `CHANGELOG.md` has entries under `## [Unreleased]`. If not, stop and say why.
2. **Pick the version** from the commits since the last release (`git log <last tag or release commit>..HEAD --oneline`):
   - Below 1.0.0: any `feat` or breaking change → bump MINOR; only `fix`/`perf` → bump PATCH.
   - From 1.0.0: breaking → MAJOR, `feat` → MINOR, otherwise PATCH.
   - `docs`/`chore`/`ci`/`test` only → no release; tell Ale nothing user-facing changed.
3. **Release branch.** `git switch -c chore/release-vX.Y.Z` (the session branch in a cloud session).
4. **Bump.** `npm version X.Y.Z --no-git-tag-version` (updates `package.json` and the lockfile).
5. **Changelog.** Move the `Unreleased` entries under `## [X.Y.Z] - YYYY-MM-DD`, leave an empty `## [Unreleased]`, update the compare links at the bottom.
6. **Verify.** `npm run check` passes. No local e2e: only the version and notes changed, and `main` passed the full suite in step 1. CI sees a version-only change and skips the browser tests too.
7. **Commit and merge.** `git commit -am "chore(release): vX.Y.Z"`, push, and merge it (CLAUDE.md "Git workflow"). Step 8 starts once it has merged.
8. **Tag main.** The `Release tag` workflow (`.github/workflows/release-tag.yml`, from the base pack) tags the merged release commit `vX.Y.Z` and creates the GitHub release from the changelog section. Wait for its run on `main` to pass and check the tag exists (`git ls-remote --tags origin vX.Y.Z`). Never move or delete an existing tag. **Only if the app has no such workflow** (older apps): `git switch main && git pull`, `git tag -a vX.Y.Z -m "vX.Y.Z"`, `git push origin vX.Y.Z`; in a cloud session that push is refused, so record the tag in `docs/RELEASES.md` with the commit, carry on, and suggest adding the workflow (`harness-sync`).
9. **Build and ship** from the tagged commit, following the stack notes' **Release** steps and each pack's `RELEASE.md` exactly (build command, size limits, where it is published, which link must stay the same). If the release adds or removes a capability, ship the new set and say so in step 11.
10. **Preview target too,** if the App profile has one and the stack notes say to refresh it on release. Never send Ale a script for the preview before it is refreshed, and give both links.
11. **Release notes.** The `Release tag` workflow already made the GitHub release. Without the workflow: `gh release create vX.Y.Z --notes-file …` once the tag exists; in a cloud session note it next to the pending tag.
12. **Tell Ale** in plain words what changed for the user, where it shows, the link, the version shown in the app, and any new consent prompt or manual step. Every target is published on every release, but give only the links where the change can be seen; say in one line which targets have nothing new. Then run `test-handoff` (or hold the script if Ale tests in batches); in a Project the script reaches Ale through the coordinator in the Project chat.

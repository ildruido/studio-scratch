---
name: harness-idea
description: Send an idea for improving the studio harness (a skill, agent, hook, template or stack pack) to app-studio as a GitHub issue, without changing app-studio. Use when work on an app shows the harness could do better, when a harness file seems wrong, or when the App Creator suggests a harness change while working on an app.
---

# Harness idea

Apps never change `app-studio`. They send ideas; a Project or session that works only on `app-studio` decides which to build and builds them (`harness-sync`, part B). This keeps every app on a harness that was changed on purpose, in one place.

## Steps

1. **Is it about the harness?** Something only this app needs belongs in its App profile (`CLAUDE.md`) or in the app's own skills, not in an idea.
2. **Look for the same idea.** On the app-studio repo (owner and name from `git -C <app-studio folder> remote get-url origin`), check open issues labelled `harness-idea` **and** open issues whose title starts with `[harness-idea]` or that mention the same skill, agent, hook, template or pack name, labelled or not (an earlier idea may have lost its label). Include open `studio-backlog` issues: accepted work may already cover it. If one does, add a comment with this app's evidence and stop.
3. **Open an issue** on the app-studio repo, with the same fields as its `Harness idea` issue template (the API doesn't apply templates, so fill them in yourself):
   - Title: `[harness-idea] <area>: <the idea in one line>`, where the area is a skill, agent, hook, template or pack name.
   - Label: `harness-idea`. If it can't be set, the title prefix is what keeps the idea findable.
   - Body, with these headings: **App name**, **Harness version** (from `.claude/studio/lock.json`), **What happened** (the backlog item or PR, and what went wrong, was slow or was done by hand), **Why it's the harness** (which file or step), **Suggested change** (optional, a sentence or two). Never leave out the app name or the harness version.
4. **Change nothing else.** Don't edit `app-studio`, and don't edit this app's copy of the harness: the health check blocks commits with edited harness files. If the problem blocks the current item, work around it in the app's own code or docs, or tell the App Creator.
5. **Tell the App Creator** in one line, with the issue link.

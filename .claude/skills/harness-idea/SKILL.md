---
name: harness-idea
description: File an idea for improving the harness (a skill, agent, hook, template or stack pack) as a GitHub issue on app-studio. Harness files under .claude/ are never edited in an app - when someone asks to change one ("change the release skill's wording here"), says a skill or the harness should change, or a hook blocked work for no reason, use this to file the idea instead. Not for bugs in the app.
---

# Harness idea

Apps never change `app-studio`. They send ideas; the app-studio Project decides which to build and builds them. This keeps every app on a harness that was changed on purpose, in one place.

## Steps

1. **Is it about the harness?** Something only this app needs belongs in its App profile (`CLAUDE.md`) or in the app's own skills, not in an idea.
2. **Look for the same idea.** On the app-studio repo (owner and name from `git -C <app-studio folder> remote get-url origin`), check open issues labelled `harness-idea` **and** open issues whose title starts with `[harness-idea]` or that mention the same skill, agent, hook, template or pack name, labelled or not (an earlier idea may have lost its label). Include open `studio-backlog` issues: accepted work may already cover it. **Then search closed issues the same way** (same label, title prefix and names) and read the closing comment: if the idea was fixed (the comment names the release) or declined (it gives the reason), don't file it again; tell the App Creator what the comment says and stop. Only if the app's evidence is new, or the fix doesn't hold, file a new issue that links the closed one. If an open issue covers it, add a comment with this app's evidence and stop.
3. **Open an issue** on the app-studio repo, with the same fields as its `Harness idea` issue template (the API doesn't apply templates, so fill them in yourself):
   - Title: `[harness-idea] <area>: <the idea in one line>`, where the area is a skill, agent, hook, template or pack name.
   - Label: `harness-idea`. If it can't be set, the title prefix is what keeps the idea findable.
   - Body, with these headings: **App name**, **Harness version** (from `.claude/studio/lock.json`), **What happened** (the backlog item or PR, and what went wrong, was slow or was done by hand), **Why it's the harness** (which file or step), **Suggested change** (optional, a sentence or two). Never leave out the app name or the harness version.
4. **Change nothing else.** Don't edit `app-studio`, and don't edit this app's copy of the harness: the health check blocks commits with edited harness files. If the problem blocks the current item, work around it in the app's own code or docs, or tell the App Creator.
5. **Tell the App Creator** in one line, with the issue link, and that the answer arrives at the app's next `harness-sync`, which lists this app's ideas that were fixed or declined.

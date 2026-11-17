---
name: prd-intake
description: Turn what the App Creator (the PM) describes into PRD changes and backlog items with acceptance criteria. Use whenever the App Creator asks for a feature, a change, or reports an idea or complaint about the app.
---

# PRD intake

The App Creator describes outcomes in plain words, or hands over a document that already describes them: a spec or PRD (for example from `product-management:write-spec`), a Google Doc or Claude Doc link, or discovery docs in the repo (an MVP definition, a roadmap, a decision log). Your job is to turn either into precise, testable work without making the App Creator write a spec. App-specific facts come from the **App profile** in `CLAUDE.md`; `<XX>` below is its id prefix.

**From a document:** read all of it first (a Google Doc through the Drive connector, a Claude Doc with the docs tools, a repo file directly). Treat it as the App Creator's request: map its sections to the PRD's, its requirements to backlog items, its decisions to the app's decision log (App profile, Decision log row; PRD "Decisions" by default), citing the source, and its priorities to the Roadmap list. Don't copy it wholesale; the PRD stays short and links the source. Questions it leaves open, and places where it contradicts the PRD or the rules, go through step 3 like any other question.

## Features (the first request for a new app, or whenever the App profile's Features rows are blank)

Before any backlog item, make sure the App profile's **AI**, **Access model** and **Storage shape** rows are filled in. Ask them one at a time, in the App Creator's words, with the options below and **no preselected answer**: never assume it, and never record one the App Creator hasn't given. You may add a short recommendation after the options, only if the app's stated purpose points one way (say why); the App Creator still answers. Then record each answer in the App profile and name what it adds:

1. **AI:** does the app use AI: on or off? If on, also record the AI plan (whose plan or key pays, and the default model tier). Off means no AI code, no AI capability, and no AI runtime rules apply.
2. **Access model:** who can get in: only invited people, anyone who signs up, anyone with no login, or (for an artifact app) whoever the owner shares it with in the Claude app. A release stops while this is blank.
3. **Storage shape:** per-person documents, shared documents, or "needs something else". The `web` pack stores documents only; "needs something else" is a product decision to raise with the coordinator before building.

4. **AI public use** (only when AI is on and the access model is "anyone who signs up" or "anyone, no login"): say plainly that anyone on the internet can then spend the app's AI, and that a usage quota or spend cap is **strongly recommended before launch**. Ask the owner to decide (a cap, with its numbers, or no cap and why) and record the answer in the App profile's **AI public use** row. The `ai-web` module has an opt-in site-wide cap (`AI_SITE_CAP_TOKENS` per day or month, optionally `AI_PER_ADDRESS_TOKENS`): a no-login app can offer AI to visitors only with it set, and an open sign-up app should set it too, since one person can make many accounts. Offer it as the way to carry out a cap decision, with numbers the owner picks. Allowing AI is the owner's call; the harness doesn't pick, but a release stops until the decision is recorded.

Name the modules the answers add. For a web app, the access model sets the server's sign-in mode (`SIGN_IN_MODE` in `render.yaml` and `.github/workflows/ci.yml`; `.claude/packs/web/STACK.md`, "Sign-in modes"): only invited people is `invite`, anyone who signs up is `open`, anyone with no login is `none`. Every access model with sign-in, and an artifact app with per-person documents, adds the `user` module (who is using the page); a no-login app leaves it out and keeps only shared documents. If a module is not available in the harness yet, say so plainly and record the choice anyway; don't pretend it exists.

## Steps

1. **Read the current state.** Open `docs/PRD.md` and `docs/BACKLOG.md`. Pick ids by the rule in `CLAUDE.md` ("Backlog ids"): use the ids the coordinator gave you; if none, run `git fetch origin`, read `docs/BACKLOG.md` and `docs/BACKLOG-DONE.md` on `origin/main` **and** in every open PR (`git diff origin/main origin/<branch> -- docs/BACKLOG.md`), and take the next number above all of them. Check again right before you open the PR.
2. **Restate the request** to yourself as: who (the App profile's User), what they want to do, why it matters. Find the PRD section it belongs to, or decide it needs a new one.
3. **Check for ambiguity.** List the open product questions (behavior, scope, priority), not technical ones. Technical choices are yours.
   - If a question would change what gets built, ask the App Creator. Ask one question at a time, each with a recommended default and one line on why (the Features questions above are the exception: they get a recommendation only as described there, never a preselected answer).
   - Otherwise pick the sensible default and record it in the decision log (App profile, Decision log row; PRD "Decisions" by default).
4. **Check against the rules.** Check the request against the App profile's domain rules and the runtime rules in `CLAUDE.md` (capabilities, and the AI plan and its costs when the App profile says AI is on). If the request breaks one, say so and propose an alternative.
5. **Update `docs/PRD.md`.** Edit the relevant section, keep it short, add the request to "Change log" with today's date.
6. **Write backlog items** in `docs/BACKLOG.md`, one per independently testable slice, using this template:

   ```md
   ### <XX>-0NN Title in plain words
   - Why: one sentence of user value
   - Acceptance criteria:
     - [ ] Given …, when …, then … (observable in the app)
   - Notes: technical hints, dependencies (<XX>-0xx), capability changes
   ```

   Keep each item small enough to build in one session. Every criterion must be something the App Creator can see and check.
7. **Place the items.** If the app has the `roadmap` module (`.claude/packs/roadmap/` exists), add every new open item to the **Roadmap** list at the top of `docs/BACKLOG.md` (Now / Next / Later, create the section if missing: `## Roadmap` with `- **Now:**`, `- **Next:**`, `- **Later:**` lines); `npm run roadmap:check` fails otherwise. Without the module there is no Roadmap list and nothing to place; on a new app, offer the module as a process choice (a prioritised Now / Next / Later list kept honest by a check; recommended when the backlog will grow beyond a handful of items) and add it with `pack add roadmap` only if the App Creator says yes. New work goes into **Backlog**. Move it to **Ready** only when it has no open questions. Keep the App Creator's existing order; put urgent bugs at the top of Ready and say so.
8. **Commit** on a `docs/<slug>` branch (the session branch in a cloud session) with `docs(prd): …`, and merge it via a PR (CLAUDE.md "Git workflow"): a Markdown-only change still gets `CI gate` and `health`, which must pass.
9. **Reply to the App Creator** with: the items created (id + title), any decision you made on their behalf, and any question that still needs an answer.

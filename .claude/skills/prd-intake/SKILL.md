---
name: prd-intake
description: Turn what Ale (the PM) describes into PRD changes and backlog items with acceptance criteria. Use whenever Ale asks for a feature, a change, or reports an idea or complaint about the app.
---

# PRD intake

Ale describes outcomes in plain words, or hands over a document that already describes them: a spec or PRD (for example from `product-management:write-spec`), a Google Doc or Claude Doc link, or discovery docs in the repo (an MVP definition, a roadmap, a decision log). Your job is to turn either into precise, testable work without making Ale write a spec. App-specific facts come from the **App profile** in `CLAUDE.md`; `<XX>` below is its id prefix.

**From a document:** read all of it first (a Google Doc through the Drive connector, a Claude Doc with the docs tools, a repo file directly). Treat it as Ale's request: map its sections to the PRD's, its requirements to backlog items, its decisions to PRD "Decisions" (citing the source), and its priorities to the Roadmap list. Don't copy it wholesale; the PRD stays short and links the source. Questions it leaves open, and places where it contradicts the PRD or the rules, go through step 3 like any other question.

## Steps

1. **Read the current state.** Open `docs/PRD.md` and `docs/BACKLOG.md`. Note the next free item id (`<XX>-0NN`; check `docs/BACKLOG-DONE.md` too so ids never repeat).
2. **Restate the request** to yourself as: who (the App profile's User), what they want to do, why it matters. Find the PRD section it belongs to, or decide it needs a new one.
3. **Check for ambiguity.** List the open product questions (behavior, scope, priority), not technical ones. Technical choices are yours.
   - If a question would change what gets built, ask Ale. Ask at most 3 questions at once, each with a recommended default.
   - Otherwise pick the sensible default and record it under PRD "Decisions".
4. **Check against the rules.** Check the request against the App profile's domain rules and the runtime rules in `CLAUDE.md` (capabilities, the App profile's AI plan and its costs). If the request breaks one, say so and propose an alternative.
5. **Update `docs/PRD.md`.** Edit the relevant section, keep it short, add the request to "Change log" with today's date.
6. **Write backlog items** in `docs/BACKLOG.md`, one per independently testable slice, using this template:

   ```md
   ### <XX>-0NN Title in plain words
   - Why: one sentence of user value
   - Acceptance criteria:
     - [ ] Given …, when …, then … (observable in the app)
   - Notes: technical hints, dependencies (<XX>-0xx), capability changes
   ```

   Keep each item small enough to build in one session. Every criterion must be something Ale can see and check.
7. **Place the items.** Add every new open item to the **Roadmap** list at the top of `docs/BACKLOG.md` (Now / Next / Later, create the section if missing: `## Roadmap` with `- **Now:**`, `- **Next:**`, `- **Later:**` lines); `npm run roadmap:check` fails otherwise. New work goes into **Backlog**. Move it to **Ready** only when it has no open questions. Keep Ale's existing order; put urgent bugs at the top of Ready and say so.
8. **Commit** on a `docs/<slug>` branch (the session branch in a cloud session) with `docs(prd): …`, open a PR, and merge when its checks are green: Markdown-only changes start no `CI` run, but the `Harness` workflow runs and must pass (CLAUDE.md "Git workflow").
9. **Reply to Ale** with: the items created (id + title), any decision you made on their behalf, and any question that still needs an answer.

# Architecture handoff: booking page for a small yoga studio

**This is a recommendation.** The stack question is still asked at "start building". Written 2026-11-26 with documents missing: the product foundation, success metrics, constraints, hypotheses, MVP and roadmap do not exist yet, and the starting idea is empty. Everything below rests on the personas, one thin study (R-001), the picked design direction (D-007) and the current App profile. Where a point rests on a guess it says so.

## Conclusions

- **Recommended direction (depends on two unverified premises: students have no Claude accounts, and the artifact has no shared storage; see S4 and open question 2):** a web app (`web` pack, with the `artifact` pack kept only as a prototype), not an artifact-only app. Reason: students must book into the same shared timetable the owner sees. The artifact `db` capability holds documents per person (CLAUDE.md, Storage shape), and students are not people the owner can be assumed to share a private Claude artifact with. (Assumption: students are the public. Nothing in the documents says so; the foundation would.)
- **Running cost:** not verified. The web pack runs on Render paid plans with Postgres (`packs/README.md`); current prices were not checked. A cost ceiling does not exist yet (no constraints document).
- **The web pack does not cleanly fit the two roles.** Its sign-in is one setting for the whole app: invite-only, open sign-up or no login (the web pack's STACK.md). Public students plus a protected owner side is not one of them. Open sign-up makes students create accounts; no login leaves the owner's list of names and emails unprotected. This is the main technical risk (spike S0).
- **Biggest unknown is not technical:** R-001 found no evidence that bookings are the owner's pain, and none that they are not. Building anything beyond the existing prototype rests on that.

## 1. What the product needs

**Domain objects (Assumption, from D-007 and the prototype):** studio, class (time, teacher, capacity), mat (a fixed position on one floor plan), booking (student, class, mat), student ("your usual" needs a remembered preference).

**Core flow (D-007, Pick your mat):** a student sees a week strip, picks a class, taps a free mat, confirms. Returning students get a "your usual" shortcut. Parked, not scope: owner floor-plan editor, bring-a-friend, mat rental, waitlist, add to calendar, cancel link.

**The owner's side is undefined.** Someone must create classes and see who booked. No document says how; there is no MVP. This is the largest gap.

**AI:** none identified. No document asks for it. (Assumption.)

**Data:** classes, bookings, student contact details if bookings need them. Small volume for one room. Sensitivity: names and contact details are personal data; payments are not in scope (nothing says otherwise; the prototype cannot test payments).

**People and roles:** owner (and maybe a helper, Persona 2) edits; students book. Whether students sign in is undecided (Assumption: no password, name and email at booking).

**Integrations:** email confirmation is implied by the prototype's confirmation step but not decided. Payments, calendar: none decided.

**Quality needs:** phone-first (a studio page is opened on phones; not tried on a real phone). Double booking of a mat must be impossible, which needs a server-side or atomic check. No speed, availability or cost targets exist.

**Spikes (time-boxed trials).** S3's one-minute target is an Assumption. S2 is trivial on the web path; it matters for the artifact path (S4).


| # | Question | Trial | Must show |
| --- | --- | --- | --- |
| S0 | Can one web app serve public students and a protected owner? | Read the web pack's server README; try an owner-only route under no-login mode or a separate owner path | A documented way to protect owner pages while students book unauthenticated, or a verdict that it needs custom work or a second app |
| S1 | Can two students never book the same mat? | Web pack with Postgres: two parallel booking requests for one mat | Exactly one succeeds; the other gets a clear "taken" message |
| S2 | Can students without Claude accounts use it? | Open the built page signed out, on a phone | Booking works with no sign-in |
| S3 | Is the owner's side small enough for the MVP? | Sketch owner class creation and booking list on the web pack | Owner can add a class and see its mats in under a minute |
| S4 | Is a shared artifact enough for a single-owner pilot? | Try the artifact with a shared document, if the runtime offers one | Whether anyone but the owner can write bookings (not verified here: only the per-person `db` is documented in the repo) |
| S5 | Does the floor plan work on a small phone screen? | Render the fixed layout at phone width | Mats are tappable and readable |

## 2. Fit with the harness

- **Recommended pack:** `web` (invite-only, open sign-up or no login from one setting; Postgres documents; Dockerfile; Render service). A no-login setting fits the assumed student flow, owner access would need the sign-in. Optional module: `user` (to know who is using the page). `ai`, `ai-web`: not needed. `roadmap`: already in use.
- **Keep `artifact` as a prototype target** (`pack add web artifact`) so the picked design can still be tried inside Claude.
- **Gaps (nothing in `packs/README.md` provides them):** outgoing email, payments, scheduled reminders, per-mat uniqueness rules. Email and uniqueness are built by the app itself; a `harness-idea` for email would be worth filing only if a second app needs it. (Filing is Ale's choice.)
- **Known limits that touch this product:** one server instance on Render; JSON documents only, no relational data, no teams (Persona 2's helper would share the owner's access), one App Creator (`packs/README.md`, Known limits). Booking uniqueness on JSON documents needs care (S1).
- **Alternative considered, not recommended:** stay artifact-only with `db`. Possibly free to run (not sourced) and already in place, but per-person documents mean the owner and students would not share one timetable. Only viable as an owner-only tool, which is not the product in D-007.

## 3. App profile draft

Not applied here. Rows discovery has not decided stay `TBD`.

```
"Stack=web, artifact (prototype)"
"User=a student booking a class; the owner running the timetable"
"Access model=TBD"
"Storage shape=shared documents (classes, mats, bookings)"
"AI=off"
"AI plan=none"
```

`Capabilities`, `Release target`, `Preview target`, `Repo`: left `TBD` (artifact capabilities no longer describe the main target; the host and repo are the Admin's decision).

Note: the current App profile in `CLAUDE.md` still describes the older habit tracker (Stack `artifact`, `{"db": {}}`, per-person documents), while the Discovery profile describes the yoga booking page. They are two different products in one repo; deciding what happens to the habit tracker is for Ale at "start building" (open question 1).

**Proposed domain rules (Assumptions, to confirm):**
- A mat can be held by at most one booking per class.
- A class never has more bookings than it has mats.
- Booking for a past class is refused.
- Student personal data is kept to what a booking needs.

## 4. Next steps after "start building"

0. **Before building: validate demand.** R-001's cheapest next steps: a second desk round, owner interviews, a fake-door test. Also write the MVP and constraints. Building rests on bookings being a real pain, which is unproven.
1. Answer the stack question. Recommended: `web artifact` once S0 and S4 are answered (cheap, do first). Adding `web` to this existing artifact app is not a plain `pack add`: the first pack named sets `npm run build`, and the artifact CI workflow must be replaced by hand.
2. Resolve the habit tracker question (what happens to the existing app in this repo).
3. `prd-intake` from the MVP and roadmap, once they exist. Neither does yet: write them first, or `prd-intake` from this handoff and the D-007 direction only.
4. Run the spikes in order: S1, S2, S3, S5, then S4 if the artifact path is still wanted.
5. Admin tasks outside the repo (not checked): a Render account and database (`packs/README.md`); an email sending service if confirmation emails are wanted (the README says nothing about email).
6. Before any real build: the owner interviews and fake-door test from R-001 (personas, assumptions table).

## Assumptions

- Students are the public and do not have Claude accounts.
- The owner needs a shared timetable and a booking list.
- Confirmation emails are wanted.
- No payments, no AI.
- Phone-first (an Assumption; not checked with students). Whether students care about choosing a mat is an unproven guess (D-007), so the mat-level uniqueness in S1 rests on it. Risks not covered elsewhere: fake or squatted bookings under no login; one Render instance means no bookings when it is down; personal-data duties in the launch markets (R-001 lists UK and Australia; not checked); the parked cancel link works against the owner's wish to cut no-shows.

## Open questions

1. What happens to the existing habit tracker (App profile) when the yoga product starts?
2. Who exactly books: public students or a known group?
3. What does the owner do in the MVP, and what is the minimum?
4. What is the monthly cost ceiling?
5. Is the booking page the right wedge at all (R-001)?
6. One deployment per studio, or one service for many studios? It drives access, storage and cost per studio, and Maya's budget is very small (personas, E-10).
7. How is a returning student recognised for "your usual" (email lookup, browser storage)? Not decided.
8. Repurposing this repo could overwrite the habit tracker's artifact link; the Release target must not be changed without Ale.

## Independent review

Reviewed 2026-11-26 by a fresh agent on the strongest available model (Opus), high effort. Verdict: **sound with fixes**.

| Grade | Finding | Answer |
| --- | --- | --- |
| Critical | C1 Web sign-in modes do not give public students and a protected owner | Confirmed against the web pack's STACK.md. Added to Conclusions and as spike S0 |
| Important | I1 Mat-level booking rests on an unproven guess | Caveat added under quality needs |
| Important | I2 Next steps contradict the demand risk | Step 0 added: validate demand first |
| Important | I3 Recommendation rests on two unverified premises | Stated in Conclusions; S4 and question 2 to be answered early |
| Important | I4 One studio or many | Open question 6 |
| Important | I5 No teams vs helper | Added to known limits |
| Important | I6 Returning-student recognition | Open question 7 |
| Important | I7 Cost vs Maya's budget | Open question 6; cost still unverified |
| Important | I8 No risks list | Risks added under quality needs |
| Minor | M1-M12 | M1, M2, M5, M6, M7, M8, M9, M11 fixed in the text. Not changed: M3 (App name and Id prefix are left for start building, when the habit tracker question is settled), M4, M10 (proposals stay proposals), M12 (another document's row) |

Not verified by the reviewer: current prices and terms, whether the artifact runtime offers shared storage, data-protection duties, whether students use phones, outside links in R-001. Each is covered by a spike or step 0.

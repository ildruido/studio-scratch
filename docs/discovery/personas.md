# Target users and personas

Product: a booking page for a small yoga studio. Target users: owners of one-room yoga studios (Discovery profile).

**Conclusion:** the primary persona is the **solo owner-teacher**, but it is **speculative**: the study behind it found no evidence yet that bookings are a real pain for these owners. Treat everything below as a hypothesis to test with owner interviews, not as settled.

## Evidence

- Study: R-001 "Do one-room yoga studio owners struggle with bookings" (`docs/research/R-001-do-one-room-yoga-studio-owners-struggle/report.md`). Verdict: needs primary research; every verdict is Low confidence.
- Share of traits backed by evidence: 5 of 18 traits below carry an evidence id, all Low confidence; the rest are `(Assumption)`.
- Audit result: no persona's main pain or current tools rest on medium or high confidence evidence, so **all personas are speculative**. The primary persona is no exception. The foundation document and the starting idea are still empty, so nothing here is checked against the product vision (D-004).
- Not covered by evidence: current owners, owners with staff, owners content with free tools, Canada, and how owners take bookings today.
- Names and details are illustrative.

## Persona 1 (primary, speculative): Maya, the solo owner-teacher

- **Role:** owns a one-room studio, teaches most classes herself, does all admin alone [E-04].
- **Goals:** fill classes without chasing messages; spend her time teaching, not on admin (Assumption).
- **Pains:** administration, managing people and marketing swallow most of her time [E-04]; costs and profitability are a strain [E-05, E-06]. Booking itself is not named by any owner we read [E-04, E-05].
- **Uses today:** unknown. Plausibly messages, a spreadsheet or a free scheduling tool (Assumption).
- **Budget and time:** very little of either; a paid tool that costs "$500 or more a month" is a reported complaint [E-10] (Assumption that she would balk at the same).
- **Would pay if:** setup takes minutes, it costs far less than a full studio suite, and it cuts messages and no-shows (Assumption).
- **Quote (real, E-04, former owner):** "The reality? I spent 90 percent of my time doing administration work, people managing, marketing."

## Persona 2 (speculative): Jordan, the owner with a part-time helper

- **Role:** owner of a one-room studio with a part-time admin or front-desk person (Assumption; suggested by the study as a segment to test).
- **Goals:** fewer mistakes at the desk, a booking list the helper can read (Assumption).
- **Pains:** double bookings and handovers between owner and helper (Assumption).
- **Uses today:** unknown (Assumption).
- **Budget and time:** can pay a little more than Maya, wants less training time (Assumption).
- **Would pay if:** it replaces a clunky tool or saves the helper's hours (Assumption).
- **Quote:** none gathered. Illustrative only: "I just want the list to be right when I walk in."

## Persona 3 (speculative): Sam, the owner happy with free tools

- **Role:** one-room owner who already takes bookings well with a free tool (Assumption).
- **Goals:** keep things as they are (Assumption).
- **Pains:** none with bookings; mixed reviews of paid platforms suggest many are content [E-10].
- **Would pay if:** almost never. Included so the team keeps asking whether the problem exists.

## Anti-personas (from the study's look-alikes)

- **The multi-teacher studio on a full suite** (75 or more teachers, uses Mindbody) [E-12]: has staff, software and budget; needs far more than a booking page.
- **Other Capterra reviewers** (personal trainers, gyms, mixed roles) [E-10]: different job, different tools.

## Primary persona for the MVP

Maya, because she is the only owner type actually seen in the evidence: owner-teachers who do the admin themselves and report overload [E-04]. It is speculative.

## Assumptions and how to test them

| Assumption | Test |
| --- | --- |
| Maya's admin pain includes taking bookings | 8 to 10 short owner interviews: "what went wrong last month?" (R-001 next step 2) |
| Owners use messages, spreadsheets or free tools today | Same interviews |
| Maya would pay a small monthly fee | Fake-door page with a sign-up button (R-001 next step 3) |
| Part-time helper studios exist in numbers and feel desk errors | Interview screening question |
| Many owners are content with free tools (Sam) | Second desk round: owner podcasts, switcher reviews |
| Foundation and vision fit these personas | Write the product foundation, then recheck |

## Open questions

- Is a booking page the right wedge, or is the real pain money and students? (R-001 strongest evidence against)
- Which launch markets? (assumed, flagged for Ale in R-001)
- Not checked: any current owner, anyone outside US, Australia and Canada.

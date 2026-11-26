# Decision log

Product decisions, newest first. Entries are added, numbered, dated and superseded by `node .claude/hooks/decisions.mjs` (`add`, `supersede`, `list`, `show`), never typed by hand. An entry is never rewritten: a changed decision is a new entry that supersedes the old one.

### D-008 Recommend web pack for the booking page, artifact as prototype (2026-11-26)
- Status: Active
- Decision: Recommendation only (stack asked at start building): web pack with artifact kept as a prototype target; shared bookings need more than per-person db
- Why: Students and owner must share one timetable; the artifact db holds documents per person
- Decided by: Claude (assumption)

### D-007 Booking page direction: Pick your mat (2026-11-26)
- Status: Active
- Decision: Direction C (pick your mat on a floor plan), keeping B's 'your usual' shortcut and A's week strip. Parked: owner floor-plan editor, bring-a-friend, mat rental, waitlist, calendar add.
- Why: Only direction that cannot be mistaken for a generic booking tool; rests on an unproven guess that students care about choosing a spot.
- Decided by: Ale

### D-005 Primary persona is the solo owner-teacher (2026-11-26)
- Status: Active
- Decision: MVP primary persona: a one-room studio owner who teaches and runs all admin alone; secondary: owner with a part-time helper
- Why: Only owner accounts opened (E-04) are solo owner-teachers doing their own admin
- Decided by: Claude (assumption)

### D-004 Write personas on a thin reality check, foundation not written (2026-11-26)
- Status: Active
- Decision: Personas are written now, resting on R-001 (all Low confidence) with the primary persona marked speculative; foundation and starting idea are still empty
- Why: App Creator asked to proceed with recommended answers; the gaps are labelled assumptions and listed for testing
- Decided by: Claude (assumption)

### D-003 Removing a habit deletes its history (2026-11-10)
- Status: Active
- Decision: Removing a habit deletes its history.
- Why: Recorded in the PRD on 2026-11-10 without a reason.
- Decided by: Ale

### D-002 Today uses the local date (2026-11-10)
- Status: Active
- Decision: Today uses the device's local date and rolls over at local midnight.
- Why: Recorded in the PRD on 2026-11-10 without a reason.
- Decided by: Ale

### D-001 Artifact prototype first (2026-11-10)
- Status: Active
- Decision: Build the artifact prototype first.
- Why: The db capability stores data per Claude user, the artifact equivalent of 'on my device'.
- Decided by: Ale

# Backlog

## Roadmap

- **Now:** HT-001, HT-002, HT-003
- **Next:** HT-004
- **Later:**

## In progress

_Nothing._

## To test

### HT-001 See and manage my habits
- Why: I need my own list of habits to track.
- Acceptance criteria:
  - [x] Given no habits, when I open the app, then I see an empty state and an input to add a habit.
  - [x] Given fewer than 5 habits, when I type a name and add it, then it appears in the list.
  - [x] Given 5 habits, then the add input is disabled and says the limit is 5.
  - [x] Given a habit, when I remove it, then it disappears.
  - [x] Empty or blank names are not accepted.
- Test script for Ale:
  1. Open the app. Expected: "No habits yet" and an input to add one.
  2. Click Add with nothing (or only spaces) typed. Expected: nothing is added, a hint asks for a name.
  3. Add "Read", then 4 more. Expected: all 5 appear; after the 5th the input and Add button are disabled and the page says the limit is 5.
  4. Remove one habit. Expected: it disappears and you can add again.
  5. Reload. Expected: habits are gone (saving comes in HT-004).
- Notes: declares capability `db` (not used until HT-004). Also remove the seed page's `sample()` call, status line and smoke-test assertions (no AI).


## Ready

### HT-002 Tick off today's habits
- Why: the daily check-in is the core action.
- Acceptance criteria:
  - [ ] Given habits, then each shows a checkbox for today.
  - [ ] When I tick a habit, then it shows as done; when I untick it, it shows as not done.
  - [ ] Ticking the same habit again on the same day never counts a second time.
- Notes: depends on HT-001. Pure date logic in a plain module, unit-tested with fixed dates.

### HT-003 See each habit's streak
- Why: the streak is the motivation.
- Acceptance criteria:
  - [ ] Next to each habit I see its current streak in days.
  - [ ] Given a habit ticked today and the 2 days before, then the streak is 3.
  - [ ] Given a habit not yet ticked today but ticked yesterday and the day before, then the streak is 2.
  - [ ] Given a habit with a missed day (neither yesterday nor today ticked), then the streak is 0.
  - [ ] A day ticked twice counts once.
- Notes: depends on HT-002.

## Backlog

### HT-004 Keep my data between visits
- Why: habits and ticks must survive closing the app.
- Acceptance criteria:
  - [ ] Given habits and ticks, when I reload or reopen the app, then they are all still there.
  - [ ] Given storage is unavailable, then the app still works for the session and shows a note that data won't be saved.
- Notes: `db` capability; fake it in e2e.

## Later

## Done

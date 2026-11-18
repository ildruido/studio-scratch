# Backlog

## Roadmap

- **Now:** HT-001, HT-002, HT-003, HT-005, HT-006, HT-007, HT-008, HT-009, HT-010, HT-013
- **Next:** HT-004
- **Later:**

## In progress

_Nothing._

## To test

### HT-013 Page heading in bold
- Why: the big "Scratch" heading should be bold; the small label above it stays as is.
- Acceptance criteria:
  - [x] Given the app is open, then the big "Scratch" heading is bold.
  - [x] The small "Habit Tracker" label above it is unchanged (not bold).
- Test script for Ale:
  1. Open the app. Expected: the big "Scratch" heading is bold.
  2. Look at the small "Habit Tracker" label above it. Expected: normal weight, unchanged.

### HT-010 Page title is "Scratch"
- Why: the app's name on the tab and at the top of the page should be "Scratch".
- Acceptance criteria:
  - [x] Given the app is open, then the browser tab title is "Scratch".
  - [x] Given the app is open, then the main page heading reads "Scratch".
  - [x] The bottom line still starts with "About: Habit Tracker" (unchanged).
- Test script for Ale:
  1. Open the app. Expected: the browser tab says "Scratch" and the big heading at the top says "Scratch".
  2. Scroll to the bottom. Expected: the grey line still starts with "About: Habit Tracker".

### HT-009 About line with the app name
- Why: a small line at the bottom of the page says what the app is.
- Acceptance criteria:
  - [x] Given the app is open, then a quiet footer line at the bottom reads "About: Habit Tracker".
- Test script for Ale:
  1. Open the app. Expected: at the bottom of the page, a small grey line reads "About: Habit Tracker".

### HT-008 Empty-state invites the first habit
- Why: a new user should be invited to start, not instructed.
- Acceptance criteria:
  - [x] Given no habits, then the page says "No habits yet. Add your first habit above to get started."
- Test script for Ale:
  1. Open the app with no habits. Expected: the message reads "No habits yet. Add your first habit above to get started."
  2. Add a habit. Expected: the message disappears.

### HT-006 Friendlier habit limit message
- Why: the limit message reads like a system error; make it warmer.
- Acceptance criteria:
  - [x] Given 5 habits, then the page says "You've reached the limit of 5 habits."
- Test script for Ale:
  1. Add 5 habits. Expected: the page says "You've reached the limit of 5 habits."

### HT-007 Friendlier empty-state message
- Why: the first screen should tell a new user exactly what to do.
- Acceptance criteria:
  - [x] Given no habits, then the page says "No habits yet. Type a name above and press Add to start."
- Test script for Ale:
  1. Open the app with no habits. Expected: the message reads "No habits yet. Type a name above and press Add to start."
  2. Add a habit. Expected: the message disappears.

### HT-005 Friendlier hint for a blank habit name
- Why: the blank-name hint reads like an error; make it friendlier.
- Acceptance criteria:
  - [x] Given I click Add with a blank name, then the hint reads "Give your habit a name first."
- Test script for Ale:
  1. Open the app and click Add with nothing typed. Expected: the hint says "Give your habit a name first."

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

### HT-002 Tick off today's habits
- Why: the daily check-in is the core action.
- Acceptance criteria:
  - [x] Given habits, then each shows a checkbox for today.
  - [x] When I tick a habit, then it shows as done; when I untick it, it shows as not done.
  - [x] Ticking the same habit again on the same day never counts a second time.
- Notes: depends on HT-001. Pure date logic in a plain module, unit-tested with fixed dates.
- Test script for Ale:
  1. Add a habit "Read". Expected: it shows an unchecked box.
  2. Tick it. Expected: it shows as done (struck through).
  3. Untick it. Expected: back to not done.
  4. Tick, remove the habit, add it again. Expected: it starts unticked.
  5. Reload. Expected: everything is gone (saving comes in HT-004).

## Ready

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

### HT-012 Footer text in dark blue
- Why: the footer line should be dark blue instead of grey.
- Acceptance criteria:
  - [x] Given the app is open in light mode, then the footer line is dark blue and readable.
  - [x] Given dark mode, then the footer is a lighter blue so it stays readable on the dark background.
- Test script for Ale:
  1. Open the app and scroll to the bottom. Expected: the "About: Habit Tracker · 2026" line is dark blue, not grey.
  2. If your device is in dark mode, expected: the line is a lighter blue, still readable.
- Confirmed done by Ale, 2026-11-18.

### HT-011 Year in the footer
- Why: the footer line should show the current year.
- Acceptance criteria:
  - [x] Given the app is open, then the footer reads "About: Habit Tracker · <current year>", worked out automatically.
- Test script for Ale:
  1. Open the app. Expected: the grey line at the bottom reads "About: Habit Tracker · 2026" (this year).
- Confirmed done by Ale, 2026-11-18.

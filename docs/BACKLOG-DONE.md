# Backlog: done

### HT-015 App version in the footer
- Done in: v0.3.0
- Why: see at a glance which version of the app is open.
- Acceptance criteria:
  - [x] Given the app is open, then the footer reads "About: Habit Tracker · <year> · v<version>", with the version taken from the app's own version number.
  - [x] The version no longer appears at the top, next to the "Habit Tracker" label.
- Test script for Ale:
  1. Open the app and scroll to the bottom. Expected: the footer reads "About: Habit Tracker · 2026 · v0.2.0" (the version of this build).
  2. Look at the small "Habit Tracker" label above the heading. Expected: just "Habit Tracker", no version.
- Confirmed done by Ale, 2026-11-22. Bug HT-016 ("wrong version in footer") was only a test and was closed as not a bug.

### HT-014 "Built with the studio harness" line
- Done in: v0.3.0
- Why: credit the studio harness quietly under the footer.
- Acceptance criteria:
  - [x] Given the app is open, then a line under the footer reads "Built with the studio harness".
  - [x] The line uses the same small size and blue as the footer: dark blue in light mode, lighter blue in dark mode.
- Test script for Ale:
  1. Open the app and scroll to the bottom. Expected: under "About: Habit Tracker · 2026" a second small line reads "Built with the studio harness", same blue.
  2. In dark mode, expected: both lines are the lighter blue and readable.

### HT-009 About line with the app name
- Done in: v0.3.0
- Why: a small line at the bottom of the page says what the app is.
- Acceptance criteria:
  - [x] Given the app is open, then a quiet footer line at the bottom reads "About: Habit Tracker".
- Test script for Ale:
  1. Open the app. Expected: at the bottom of the page, a small grey line reads "About: Habit Tracker".

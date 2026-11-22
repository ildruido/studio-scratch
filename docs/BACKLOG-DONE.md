# Backlog: done

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

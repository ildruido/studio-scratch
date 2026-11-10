# Habit Tracker — PRD

## Goal
A tiny habit tracker for Ale: add up to 5 daily habits, tick off the ones done each day, see each habit's streak.

## Users
Ale, on a private Claude artifact. No sign-in, no AI.

## Requirements
1. **Habits.** Up to 5. A habit is just a name. Ale can add and remove habits.
2. **Today screen (main).** Lists today's habits, each with a checkbox and, next to it, the current streak in days.
3. **Ticking.** Ale ticks a habit done for today and can untick it (same day only). A habit counts at most once per day.
4. **Streak rule.** Streak = consecutive days ticked, ending today (or yesterday while today is not yet ticked). A missed day resets it to 0. A day is never counted twice.
5. **Storage.** Saved on the device/account via the `db` capability. If storage is missing, the page still renders and says data won't be saved.

## Non-goals
Sign-in, AI, reminders, history charts, editing past days, multiple users.

## Decisions
- 2026-11-10: Artifact prototype first (Ale). The `db` capability stores data per Claude user — it is the artifact equivalent of "on my device".
- 2026-11-10: "Today" uses the device's local date and rolls over at local midnight.
- 2026-11-10: Removing a habit deletes its history.

## Change log
- 2026-11-10: Initial PRD from Ale's description.

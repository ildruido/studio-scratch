import "./style.css";
import { startPlatform } from "./platform";
import { MAX_HABITS, addHabit, removeHabit, type Habit } from "./habits";
import { clearTicks, dayKey, isTicked, setTick, type Ticks } from "./ticks";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

// Picks the platform for this build (the artifact runtime or the web server).
await startPlatform();
$("version").textContent = `v${__APP_VERSION__}`;

let habits: Habit[] = [];
let ticks: Ticks = {};
const today = () => dayKey(new Date());
const form = $<HTMLFormElement>("add-form");
const input = $<HTMLInputElement>("habit-name");
const addButton = $<HTMLButtonElement>("add-button");
const hint = $("add-hint");
const list = $("habit-list");
const empty = $("empty");

function render() {
  const full = habits.length >= MAX_HABITS;
  empty.hidden = habits.length > 0;
  input.disabled = full;
  addButton.disabled = full;
  hint.textContent = full ? `Limit reached: you can track at most ${MAX_HABITS} habits.` : "";
  list.replaceChildren(
    ...habits.map((h) => {
      const li = document.createElement("li");
      const label = document.createElement("label");
      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = isTicked(ticks, h.id, today());
      box.setAttribute("aria-label", `${h.name} done today`);
      box.addEventListener("change", () => {
        ticks = setTick(ticks, h.id, today(), box.checked);
        render();
      });
      const name = document.createElement("span");
      name.textContent = h.name;
      label.append(box, name);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Remove";
      remove.setAttribute("aria-label", `Remove ${h.name}`);
      remove.addEventListener("click", () => {
        habits = removeHabit(habits, h.id);
        ticks = clearTicks(ticks, h.id);
        render();
      });
      li.classList.toggle("done", box.checked);
      li.append(label, remove);
      return li;
    }),
  );
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const result = addHabit(habits, input.value, crypto.randomUUID());
  if (!result.ok) {
    if (result.reason === "blank") hint.textContent = "Give your habit a name first.";
    return;
  }
  habits = result.habits;
  input.value = "";
  render();
  if (!input.disabled) input.focus();
});

render();

// Re-draw when the day changes while the page stays open.
let shownDay = today();
setInterval(() => {
  if (today() !== shownDay) {
    shownDay = today();
    render();
  }
}, 60_000);

import "./style.css";
import { startPlatform } from "./platform";
import { MAX_HABITS, addHabit, removeHabit, type Habit } from "./habits";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

// Picks the platform for this build (the artifact runtime or the web server).
await startPlatform();
$("version").textContent = `v${__APP_VERSION__}`;

let habits: Habit[] = [];
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
      const name = document.createElement("span");
      name.textContent = h.name;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Remove";
      remove.setAttribute("aria-label", `Remove ${h.name}`);
      remove.addEventListener("click", () => {
        habits = removeHabit(habits, h.id);
        render();
      });
      li.append(name, remove);
      return li;
    }),
  );
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const result = addHabit(habits, input.value, crypto.randomUUID());
  if (!result.ok) {
    if (result.reason === "blank") hint.textContent = "Type a name for the habit first.";
    return;
  }
  habits = result.habits;
  input.value = "";
  render();
  if (!input.disabled) input.focus();
});

render();

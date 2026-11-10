import "./style.css";
import { getPlatform, startPlatform } from "./platform";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

// Picks the platform for this build (the artifact runtime or the web server) and, on the web,
// shows the sign-in screen first. Everything the app needs from its host goes through getPlatform().
await startPlatform();
$("version").textContent = `v${__APP_VERSION__}`;
const sample = await getPlatform().sample();
$("status").textContent = sample ? "The AI is ready." : "The AI is not available here.";

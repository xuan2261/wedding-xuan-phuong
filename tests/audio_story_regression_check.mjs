import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const config = fs.readFileSync(path.join(root, "config.js"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(app.includes("const clampVolume"), "Thiếu clampVolume");
assert(app.includes("Math.min(1, Math.max(0"), "Volume chưa clamp [0,1]");
assert(app.includes("const elapsed = Math.max(0"), "rAF elapsed chưa clamp âm");
assert(app.includes("volumeFadeGeneration"), "Thiếu generation guard chống fade race");
assert(app.includes("setAudioVolume(nextVolume)"), "Fade chưa dùng setter an toàn");
assert(app.includes("wedding:story-autostarted"), "Thiếu tín hiệu autostart");
assert(app.includes('dataset.storyAutostart = started ? "started" : "retrying"'), "Thiếu trạng thái retry autostart");
assert(/requestAnimationFrame\(\(\) => \{\s*requestAnimationFrame/.test(app), "Autostart chưa đợi layout ổn định");
assert(config.includes("storyStartDelayMs: 2600"), "Delay autostory chưa tối ưu");

console.log("PASS: audio fade and story autostart regression contract");

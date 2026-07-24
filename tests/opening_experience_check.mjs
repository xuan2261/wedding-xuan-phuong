import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const index = read("index.html");
const app = read("app.js");
const config = read("config.js");
const styles = read("styles.css");
const motion = read("assets/css/wedding-motion.css");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(index.includes('id="invitationCover"'), "Thiếu invitation cover");
assert(index.includes('id="coverOpenButton"'), "Thiếu cover open button");
assert(index.includes('id="coverAutoStory"'), "Thiếu auto-story preference");
assert(index.includes('id="storyPlayer"'), "Thiếu story player");
assert(index.includes('id="storyButton"'), "Thiếu story toggle");
assert(index.includes('id="storyPreviousButton"'), "Thiếu chapter previous");
assert(index.includes('id="storyNextButton"'), "Thiếu chapter next");
assert(index.includes('id="coverSimpleButton"'), "Thiếu simple mode");
assert((index.match(/data-story-title=/g) || []).length >= 8, "Thiếu chapter titles");
assert((index.match(/data-story-stop=/g) || []).length >= 6, "Thiếu story stops");
assert(app.includes("function setupOpeningExperience"), "Thiếu setupOpeningExperience");
assert(app.includes("function setupGuidedStory"), "Thiếu setupGuidedStory");
assert(app.includes('window.__WEDDING_SKIP_COVER__'), "Thiếu test/debug escape hatch");
assert(app.includes('wedding:cover-opened'), "Thiếu cover-opened event");
assert(config.includes("openingExperience:"), "Thiếu openingExperience config");
assert(config.includes("autoStoryDefault: true"), "Auto story mặc định chưa bật");
assert(styles.includes(".invitation-cover__panel--left"), "Thiếu panel trái");
assert(styles.includes(".story-player"), "Thiếu story player CSS");
assert(styles.includes(".invitation-cover__simple"), "Thiếu simple mode CSS");
assert(motion.includes("@keyframes invitation-panel-left"), "Thiếu animation mở trái");
assert(motion.includes("@keyframes invitation-panel-right"), "Thiếu animation mở phải");
assert(!motion.includes("invitation-seal-breathe 2.8s ease-in-out infinite"), "Con dấu không được pulse vô hạn");
assert(motion.includes("@media (prefers-reduced-motion: reduce)"), "Thiếu reduced motion");

console.log("PASS: cinematic opening and guided story contract");

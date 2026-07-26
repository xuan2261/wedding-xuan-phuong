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
assert(!index.includes('id="coverSimpleButton"'), "Nút Xem thiệp đơn giản phải được loại bỏ");
assert(app.includes("openInvitation({ simpleMode: true })"), "Thiếu simple-mode fallback khi đóng cover bằng phím Esc");
assert(app.includes("function setupOpeningExperience"), "Thiếu setupOpeningExperience");
assert(app.includes("function setupAutoScroll"), "Thiếu setupAutoScroll");
assert(app.includes('window.__WEDDING_SKIP_COVER__'), "Thiếu test/debug escape hatch");
assert(app.includes('wedding:cover-opened'), "Thiếu cover-opened event");
assert(app.includes('wedding:story-autostarted'), "Thiếu story autostart event");
assert(config.includes("openingExperience:"), "Thiếu openingExperience config");
assert(config.includes("autoStoryDefault: true"), "Auto story mặc định chưa bật");
assert(config.includes("simpleModeEnabled: true"), "Simple fallback phải còn bật trong cấu hình");
assert(styles.includes(".invitation-cover__panel--left"), "Thiếu panel trái");
assert(styles.includes("html.is-auto-scrolling"), "Thiếu CSS tắt smooth scroll khi tự cuộn");
assert(styles.includes(".invitation-cover__simple"), "Thiếu CSS tương thích simple mode");
assert(motion.includes("@keyframes invitation-panel-left"), "Thiếu animation mở trái");
assert(motion.includes("@keyframes invitation-panel-right"), "Thiếu animation mở phải");
assert(!motion.includes("invitation-seal-breathe 2.8s ease-in-out infinite"), "Con dấu không được pulse vô hạn");
assert(motion.includes("@media (prefers-reduced-motion: reduce)"), "Thiếu reduced motion");

// Thanh điều khiển theo chương đã bị bỏ; thiệp tự trôi liên tục thay thế.
assert(!index.includes("story-player"), "Thanh điều khiển theo chương quay lại DOM");
assert(!styles.includes(".story-player"), "CSS thanh điều khiển quay lại");

console.log("PASS: cinematic opening and auto-scroll contract");

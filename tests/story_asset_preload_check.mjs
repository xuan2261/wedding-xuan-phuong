import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const config = fs.readFileSync(path.join(root, "config.js"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(app.includes("const prepareStoryAssets = async"), "Thiếu prepareStoryAssets");
assert(app.includes('image.loading = "eager"'), "Ảnh chương kế chưa được promote eager");
assert(app.includes('image.fetchPriority = adaptiveDataState.constrained ? "auto" : "high"'), "Ảnh chương kế chưa dùng priority thích ứng");
assert(app.includes('image.dataset.storyPreloaded = "true"'), "Thiếu dấu vết preload ảnh story");
assert(app.includes('typeof image.decode === "function"'), "Thiếu image.decode trước khi chuyển chương");
assert(app.includes("Promise.race"), "Preload không có timeout bảo vệ");
assert(app.includes("await prepareStoryAssets(currentIndex)"), "Chuyển chương chưa đợi asset");
assert(app.includes("void prepareStoryAssets(currentIndex + 1)"), "Thiếu preload chương tiếp theo");
assert(config.includes("preloadNextScene: true"), "Preload story chưa bật");
assert(config.includes("preloadImageLimit: 4"), "Giới hạn preload không đúng");
assert(config.includes("preloadWaitMs: 700"), "Timeout preload không đúng");

console.log("PASS: guided story asset preload contract");

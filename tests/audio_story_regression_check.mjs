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
assert(app.includes("let startedAt = null"), "Fade chưa dùng timestamp rAF làm mốc");
assert(app.includes("const elapsed = Math.max(0"), "rAF elapsed chưa clamp âm");
assert(app.includes("pausedByVisibility"), "Nhạc chưa pause khi tab ẩn");
assert(app.includes("volumeFadeGeneration"), "Thiếu generation guard chống fade race");
assert(app.includes("setAudioVolume(nextVolume)"), "Fade chưa dùng setter an toàn");
assert(app.includes("wedding:story-autostarted"), "Thiếu tín hiệu autostart");
assert(app.includes('dataset.storyAutostart = started ? "started" : "retrying"'), "Thiếu trạng thái retry autostart");
assert(/requestAnimationFrame\(\(\) => \{\s*requestAnimationFrame/.test(app), "Autostart chưa đợi layout ổn định");
// Chương một là ảnh hero đang hiển thị sẵn nên cú cuộn đầu tiên vô hình. Cộng
// thêm thời gian mở hai cánh, delay quá dài làm khách tin là thiệp không tự chạy.
const storyStartDelay = Number(
  (config.match(/storyStartDelayMs:\s*(\d+)/) || [])[1]
);
assert(
  Number.isFinite(storyStartDelay) && storyStartDelay > 0 && storyStartDelay <= 1600,
  `Delay autostory phải nằm trong (0, 1600]ms: ${storyStartDelay}`
);

// Chạm hoặc click không phải ý định dừng tự xem; chỉ cuộn thật mới là.
assert(
  !/addEventListener\("(?:pointerdown|touchstart)", pauseForInteraction/.test(app),
  "Chạm/click không được dừng tự xem"
);
assert(
  app.includes('addEventListener("touchmove", pauseForInteraction'),
  "Cuộn bằng cảm ứng vẫn phải dừng được tự xem"
);
assert(app.includes("interactionGraceUntil"), "Thiếu khoảng lặng sau khi mở thiệp");

// Tiết giảm chuyển động chỉ bỏ hiệu ứng, không được bỏ luôn tự xem và thanh
// điều khiển — nếu không, khách bật chế độ này mất hẳn cách đi qua từng phần.
assert(
  !app.includes("player.hidden = reduceMotion"),
  "Reduce motion không được ẩn thanh điều khiển thiệp"
);
assert(
  !app.includes("autoStory.disabled = reduceMotion"),
  "Reduce motion không được khoá lựa chọn tự xem"
);

// Tải lại trang phải mở từ đầu thiệp, không rơi vào giữa nội dung sau màn bìa.
assert(
  app.includes('window.history.scrollRestoration = "manual"'),
  "Thiếu tự quản lý khôi phục vị trí cuộn"
);
assert(app.includes("resetScrollForFreshLoad"), "Thiếu reset cuộn khi tải trang");

console.log("PASS: audio fade and story autostart regression contract");

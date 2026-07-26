import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const config = fs.readFileSync(path.join(root, "config.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

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

// Thiệp phải TRÔI xuống chứ không nhảy. scrollIntoView({behavior:"smooth"})
// từng được dùng cho việc này nhưng trình duyệt hoàn tất quãng đường trong chưa
// tới một khung hình, nên khách chỉ thấy giật cục.
// Chỉ soi trong thân hàm tự cuộn: scrollIntoView vẫn hợp lệ cho anchor do khách
// tự bấm (skip-link, nút "Xem lời mời").
const autoScrollBody = app.slice(
  app.indexOf("function setupAutoScroll"),
  app.indexOf("function setupOpeningExperience")
);
assert(autoScrollBody.length > 500, "Không tìm thấy thân hàm setupAutoScroll");
assert(
  !autoScrollBody.includes("scrollIntoView"),
  "Tự cuộn không được quay lại kiểu nhảy tới từng phần bằng scrollIntoView"
);
assert(app.includes("function setupAutoScroll"), "Thiếu bộ tự cuộn liên tục");
assert(
  app.includes("window.scrollTo(0, position)") && app.includes("requestAnimationFrame(step)"),
  "Tự cuộn phải chạy theo từng khung hình"
);
assert(
  app.includes("(speed * elapsed) / 1000"),
  "Tốc độ cuộn phải tính theo thời gian thực, không theo số khung hình"
);

// CSS đặt scroll-behavior: smooth cho cả trang; không tắt trong lúc tự cuộn thì
// mỗi bước nhỏ thành một hoạt cảnh riêng và thiệp đứng ì.
assert(
  app.includes('classList.add("is-auto-scrolling")'),
  "Thiếu cờ tắt scroll-behavior khi tự cuộn"
);
assert(
  /html\.is-auto-scrolling\s*\{[^}]*scroll-behavior:\s*auto/.test(styles),
  "Thiếu CSS tắt smooth scroll khi tự cuộn"
);

const scrollSpeed = Number(
  (config.match(/autoScrollSpeedPxPerSecond:\s*(\d+)/) || [])[1]
);
assert(
  Number.isFinite(scrollSpeed) && scrollSpeed >= 20 && scrollSpeed <= 80,
  `Tốc độ tự cuộn phải nằm trong [20, 80] px/s: ${scrollSpeed}`
);

const storyStartDelay = Number(
  (config.match(/storyStartDelayMs:\s*(\d+)/) || [])[1]
);
assert(
  Number.isFinite(storyStartDelay) && storyStartDelay > 0 && storyStartDelay <= 1600,
  `Delay trước khi tự cuộn phải nằm trong (0, 1600]ms: ${storyStartDelay}`
);

// Chạm hoặc click không phải ý định dừng; chỉ cuộn thật mới là.
assert(
  !/addEventListener\("(?:pointerdown|touchstart)", stopForInteraction/.test(app),
  "Chạm/click không được dừng tự cuộn"
);
assert(
  app.includes('addEventListener("touchmove", stopForInteraction'),
  "Cuộn bằng cảm ứng vẫn phải dừng được tự cuộn"
);
assert(app.includes("graceUntil"), "Thiếu khoảng lặng sau khi mở thiệp");

// Cuộn bằng thanh cuộn hoặc phím không phát ra wheel/touchmove, nên cần lưới an
// toàn so vị trí thật với vị trí ta vừa đặt.
assert(
  app.includes("Math.abs(window.scrollY - expectedScrollY) > 2"),
  "Thiếu lưới an toàn phát hiện khách tự cuộn"
);

// Tải lại trang phải mở từ đầu thiệp, không rơi vào giữa nội dung sau màn bìa.
assert(
  app.includes('window.history.scrollRestoration = "manual"'),
  "Thiếu tự quản lý khôi phục vị trí cuộn"
);
assert(app.includes("resetScrollForFreshLoad"), "Thiếu reset cuộn khi tải trang");

console.log("PASS: audio fade and story autostart regression contract");

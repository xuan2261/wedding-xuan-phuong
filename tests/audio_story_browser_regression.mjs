import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg"
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  const relative = pathname === "/" ? "index.html" : pathname.slice(1);
  const resolved = path.resolve(root, relative);

  if (!resolved.startsWith(root) || !fs.existsSync(resolved)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  const file = fs.statSync(resolved).isDirectory()
    ? path.join(resolved, "index.html")
    : resolved;
  response.writeHead(200, {
    "Content-Type": contentTypes[path.extname(file).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  fs.createReadStream(file).pipe(response);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const browser = await chromium.launch();

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.addInitScript(() => {
    const nativeRaf = window.requestAnimationFrame.bind(window);
    let skewUntil = 0;
    window.__enableNegativeRafSkew = () => {
      skewUntil = performance.now() + 1500;
    };
    window.requestAnimationFrame = (callback) => nativeRaf((timestamp) => {
      const suppliedTimestamp = performance.now() < skewUntil
        ? performance.now() - 50
        : timestamp;
      callback(suppliedTimestamp);
    });

    Object.defineProperty(HTMLMediaElement.prototype, "paused", {
      configurable: true,
      get() {
        return this.__weddingPaused !== false;
      }
    });
    HTMLMediaElement.prototype.play = function play() {
      this.__weddingPaused = false;
      queueMicrotask(() => this.dispatchEvent(new Event("play")));
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function pause() {
      this.__weddingPaused = true;
      this.dispatchEvent(new Event("pause"));
    };
  });

  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
  await page.route(/https:\/\/statics\.pancake\.vn\/.*/, (route) => route.abort());
  await page.route(/https:\/\/script\.google\.com\/.*/, (route) => route.abort());

  await page.goto(
    `http://127.0.0.1:${port}/#to=Gia%20%C4%91%C3%ACnh%20c%C3%B4%20Lan&event=groom`,
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForSelector("#invitationCover[open]");
  assert(await page.locator("#coverAutoStory").isChecked(), "Auto story phải được chọn mặc định");

  await page.evaluate(() => window.__enableNegativeRafSkew());
  await page.locator("#coverOpenButton").click();
  await page.waitForFunction(() => document.body.classList.contains("invitation-opened"));
  await page.waitForFunction(() => document.body.dataset.storyAutostart === "started");
  await page.waitForFunction(() => Number(document.body.dataset.storyChapter || 0) >= 2);
  await page.waitForTimeout(1200);

  const result = await page.evaluate(() => ({
    build: document.querySelector('meta[name="wedding-build"]')?.content,
    volume: document.querySelector("#weddingMusic")?.volume,
    storyState: document.body.dataset.storyState,
    storyAutostart: document.body.dataset.storyAutostart,
    storyChapter: Number(document.body.dataset.storyChapter || 0),
    scrollY: window.scrollY
  }));

  assert(result.build === "v19.2.1-20260724", `Sai build: ${result.build}`);
  assert(result.volume >= 0 && result.volume <= 1, `Volume ngoài [0,1]: ${result.volume}`);
  assert(result.storyState === "running", `Story không running: ${result.storyState}`);
  assert(result.storyAutostart === "started", `Autostart lỗi: ${result.storyAutostart}`);
  assert(result.storyChapter >= 2, `Story chưa chuyển chương: ${result.storyChapter}`);
  assert(result.scrollY > 0, `Story chưa cuộn trang: ${result.scrollY}`);
  assert(pageErrors.length === 0, `Page errors: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join(" | ")}`);

  console.log(JSON.stringify({ verdict: "PASS", result }, null, 2));
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".png": "image/png",
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
    response.writeHead(404); response.end("Not found"); return;
  }
  const stat = fs.statSync(resolved);
  const file = stat.isDirectory() ? path.join(resolved, "index.html") : resolved;
  response.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(file).pipe(response);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const baseUrl = `http://127.0.0.1:${port}/`;
const browser = await chromium.launch();

try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const page = await browser.newPage({ viewport });
    let youtubeRequests = 0;
    let youtubeReferer = "";
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(String(error)));

    await page.route(/https:\/\/fonts\.googleapis\.com\/.*/, (route) => route.fulfill({ status: 200, contentType: "text/css", body: "" }));
    await page.route(/https:\/\/fonts\.gstatic\.com\/.*/, (route) => route.fulfill({ status: 204, body: "" }));
    await page.route(/https:\/\/www\.youtube-nocookie\.com\/.*/, async (route) => {
      youtubeRequests += 1;
      youtubeReferer = route.request().headers()["referer"] || "";
      await route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: "<!doctype html><html><body>YouTube embed test</body></html>" });
    });

    await page.addInitScript(() => {
      window.__WEDDING_TEST_MODE__ = true;
      window.__WEDDING_SKIP_COVER__ = true;
      window.__WEDDING_TEST_NOW__ = "2026-07-23T12:00:00+07:00";
    });
    await page.goto(`${baseUrl}#event=groom`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#weddingFilmOpenButton:not([hidden])");

    assert(youtubeRequests === 0, `YouTube bị tải trước khi click: ${youtubeRequests}`);
    assert(await page.locator("#weddingFilmDialog iframe").count() === 0, "Initial DOM không được có YouTube iframe");

    await page.locator("#weddingFilmOpenButton").click();
    await page.waitForSelector("#weddingFilmDialog[open] iframe");
    await page.waitForTimeout(80);

    const opened = await page.evaluate(() => {
      const dialog = document.querySelector("#weddingFilmDialog");
      const frame = dialog?.querySelector("iframe");
      const rect = dialog?.getBoundingClientRect();
      return {
        open: dialog?.open === true,
        src: frame?.src || "",
        referrerPolicy: frame?.referrerPolicy || "",
        width: rect?.width || 0,
        viewport: document.documentElement.clientWidth,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    });

    assert(opened.open, "Wedding Film dialog chưa mở");
    assert(opened.src.includes("youtube-nocookie.com/embed/9kv5T3W9fxo"), `Sai embed URL: ${opened.src}`);
    assert(opened.referrerPolicy === "strict-origin-when-cross-origin", `Sai referrer policy: ${opened.referrerPolicy}`);
    assert(opened.width <= opened.viewport + 1, "Video dialog tràn viewport");
    assert(opened.overflow <= 1, "Wedding Film gây horizontal overflow");
    assert(youtubeRequests === 1, `Click phải tạo đúng một YouTube request, thực tế: ${youtubeRequests}`);
    assert(youtubeReferer.startsWith(`http://127.0.0.1:${port}/`), `Thiếu Referer cho YouTube embed: ${youtubeReferer}`);

    await page.locator("[data-close-wedding-film]").last().click();
    await page.waitForFunction(() => !document.querySelector("#weddingFilmDialog")?.open);
    assert(await page.locator("#weddingFilmDialog iframe").count() === 0, "Đóng dialog phải unload iframe");
    assert(pageErrors.length === 0, `Page errors: ${pageErrors.join(" | ")}`);

    await page.close();
  }
  console.log("PASS: YouTube Wedding Film browser lazy-load / dialog / referrer regression");
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

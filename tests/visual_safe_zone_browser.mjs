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
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".ics": "text/calendar; charset=utf-8"
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createServer() {
  return http.createServer((request, response) => {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://127.0.0.1").pathname
    );
    const relative = pathname === "/" ? "index.html" : pathname.slice(1);
    const resolved = path.resolve(root, relative);

    if (!resolved.startsWith(root) || !fs.existsSync(resolved)) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const stat = fs.statSync(resolved);
    const file = stat.isDirectory() ? path.join(resolved, "index.html") : resolved;
    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    fs.createReadStream(file).pipe(response);
  });
}

fs.mkdirSync(path.join(root, "reports"), { recursive: true });

const viewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 1440, height: 900 },
  { width: 568, height: 320 }
];

const server = createServer();
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const evidence = [];

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    await page.addInitScript(() => {
      window.__WEDDING_TEST_MODE__ = true;
    });

    await page.route(/https:\/\/fonts\.googleapis\.com\/.*/, (route) =>
      route.fulfill({ status: 200, contentType: "text/css", body: "" })
    );
    await page.route(/https:\/\/fonts\.gstatic\.com\/.*/, (route) =>
      route.fulfill({ status: 204, body: "" })
    );

    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(String(error)));

    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#invitationCover[open]");

    const cover = await page.evaluate(() => {
      const dialog = document.querySelector("#invitationCover");
      const content = document
        .querySelector(".invitation-cover__content")
        .getBoundingClientRect();
      const seal = document.querySelector("#coverOpenButton").getBoundingClientRect();
      return {
        simpleButton: Boolean(document.querySelector("#coverSimpleButton")),
        seam: Boolean(document.querySelector(".invitation-cover__seam")),
        contentTop: content.top,
        contentBottom: content.bottom,
        sealWidth: seal.width,
        sealHeight: seal.height,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        dialogOpen: dialog.open
      };
    });

    assert(cover.dialogOpen, `Cover chưa mở ${viewport.width}x${viewport.height}`);
    assert(!cover.simpleButton, "Nút Xem thiệp đơn giản xuất hiện lại");
    assert(!cover.seam, "Đường seam xuất hiện lại");
    assert(
      cover.contentTop >= -1 && cover.contentBottom <= viewport.height + 1,
      `Nội dung cover bị cắt: ${JSON.stringify({ viewport, cover })}`
    );
    assert(
      cover.sealWidth >= 44 && cover.sealHeight >= 44,
      "Con dấu nhỏ hơn vùng chạm an toàn"
    );
    assert(
      cover.scrollWidth <= cover.clientWidth + 1,
      "Cover có horizontal overflow"
    );

    await page.locator("#coverOpenButton").click();
    await page.waitForFunction(() =>
      document.body.classList.contains("invitation-opened")
    );

    const hero = await page.evaluate(() => {
      const section = document.querySelector(".hero").getBoundingClientRect();
      const names = document.querySelector(".hero-names").getBoundingClientRect();
      const date = document.querySelector(".hero__date").getBoundingClientRect();
      const open = document
        .querySelector("#openInvitationButton")
        .getBoundingClientRect();
      return {
        sectionTop: section.top,
        sectionHeight: section.height,
        namesTop: names.top,
        namesBottom: names.bottom,
        dateTop: date.top,
        dateBottom: date.bottom,
        openTop: open.top,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      };
    });

    assert(hero.namesTop >= hero.sectionTop - 1, "Tên hero vượt khỏi section");
    assert(
      hero.namesBottom <= hero.sectionTop + hero.sectionHeight * 0.43,
      `Tên hero rơi khỏi vùng ảnh an toàn: ${JSON.stringify({ viewport, hero })}`
    );
    assert(hero.namesBottom < hero.dateTop, "Tên hero đè lên ngày");
    assert(hero.dateBottom < hero.openTop, "Ngày hero đè lên nút lời mời");
    assert(
      hero.scrollWidth <= hero.clientWidth + 1,
      "Trang có horizontal overflow sau mở thiệp"
    );

    await page.locator(".closing").scrollIntoViewIfNeeded();
    const closing = await page.evaluate(() => {
      const section = document.querySelector(".closing").getBoundingClientRect();
      const content = document
        .querySelector(".closing__content")
        .getBoundingClientRect();
      return {
        sectionTop: section.top,
        sectionHeight: section.height,
        contentTop: content.top,
        contentBottom: content.bottom
      };
    });

    assert(closing.contentTop >= closing.sectionTop - 1, "Closing content vượt khỏi ảnh");
    assert(
      closing.contentBottom <= closing.sectionTop + closing.sectionHeight * 0.38,
      `Thank-you rơi vào vùng mặt trung tâm: ${JSON.stringify({ viewport, closing })}`
    );

    const screenshotPath = path.join(
      root,
      "reports",
      `visual-safe-zone-${viewport.width}x${viewport.height}.png`
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });

    assert(pageErrors.length === 0, `Page errors: ${pageErrors.join(" | ")}`);
    evidence.push({
      viewport,
      cover,
      hero,
      closing,
      screenshotPath: path.relative(root, screenshotPath)
    });
    await page.close();
  }

  console.log(JSON.stringify({ verdict: "PASS", evidence }, null, 2));
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

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

function createServer() {
  return http.createServer((request, response) => {
    const requestPath = decodeURIComponent(
      new URL(request.url, "http://127.0.0.1").pathname
    );
    const relative = requestPath === "/" ? "index.html" : requestPath.slice(1);
    const resolved = path.resolve(root, relative);

    if (!resolved.startsWith(root) || !fs.existsSync(resolved)) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const stat = fs.statSync(resolved);
    const file = stat.isDirectory()
      ? path.join(resolved, "index.html")
      : resolved;

    response.writeHead(200, {
      "Content-Type":
        contentTypes[path.extname(file).toLowerCase()] ||
        "application/octet-stream",
      "Cache-Control": "no-store"
    });
    fs.createReadStream(file).pipe(response);
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const viewports = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
  { width: 568, height: 320 }
];

const server = createServer();
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const baseUrl = `http://127.0.0.1:${port}/`;

const browser = await chromium.launch();
const report = [];

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    await page.addInitScript(() => {
      window.__WEDDING_TEST_MODE__ = true;
      window.__WEDDING_SKIP_COVER__ = true;
      window.__WEDDING_TEST_NOW__ = "2026-07-23T12:00:00+07:00";
    });
    let wishRequests = 0;
    let formRequests = 0;
    let mapRequests = 0;
    let qrRequests = 0;
    const pageErrors = [];
    const consoleErrors = [];

    page.on("pageerror", (error) => pageErrors.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());

    await page.route(/\/assets\/qr\/qr-nha-(trai|gai)\.png/, async (route) => {
      qrRequests += 1;
      await route.continue();
    });

    await page.route(/https:\/\/docs\.google\.com\/forms\/.*/, async (route) => {
      formRequests += 1;
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: "<!doctype html><html><body><h1>RSVP test form</h1></body></html>"
      });
    });

    await page.route(/https:\/\/www\.google\.com\/maps.*/, async (route) => {
      mapRequests += 1;
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: "<!doctype html><html><body><h1>Map test</h1></body></html>"
      });
    });

    await page.route(/https:\/\/script\.google\.com\/.*/, async (route) => {
      wishRequests += 1;
      const url = new URL(route.request().url());
      const callback = url.searchParams.get("callback");

      if (!callback) {
        await route.abort();
        return;
      }

      const payload = {
        ok: true,
        wishes: [{
          id: "smoke-1",
          displayName: "Gia đình cô Lan",
          relationship: "Người thân",
          message: "Chúc đôi uyên ương luôn hạnh phúc.",
          featured: true
        }]
      };

      await route.fulfill({
        status: 200,
        contentType: "application/javascript; charset=utf-8",
        body: `${callback}(${JSON.stringify(payload)});`
      });
    });

    await page.goto(
      `${baseUrl}#to=Gia%20%C4%91%C3%ACnh%20c%C3%B4%20Lan&event=groom`,
      { waitUntil: "domcontentloaded" }
    );

    await page.waitForFunction(() => document.querySelector(".hero__image")?.complete);

    const initial = await page.evaluate(() => ({
      build: document.querySelector('meta[name="wedding-build"]')?.content,
      guestName: document.querySelector("[data-guest-name]")?.textContent?.trim(),
      familiesHidden: document.querySelector("#families")?.hidden,
      ceremony: document.querySelector("[data-ceremony-time]")?.textContent?.trim(),
      reception: document.querySelector("[data-guest-time]")?.textContent?.trim(),
      deadline: document.querySelector("[data-rsvp-deadline]")?.textContent?.trim(),
      audioPaused: document.querySelector("#weddingMusic")?.paused,
      audioSources: document.querySelectorAll("#weddingMusic source").length,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      albumCount: document.querySelectorAll(".album-item").length,
      eventId: document.body.dataset.eventId,
      personalizedCopyHidden:
        document.querySelector("#copyPersonalizedLinkButton")?.hidden
    }));

    assert(initial.build === "v19.2.1-20260724", `Sai build: ${initial.build}`);
    assert(initial.guestName === "Gia đình cô Lan", `Sai guest name: ${initial.guestName}`);
    assert(initial.familiesHidden === true, "Family section phải tự ẩn");
    assert(initial.ceremony === "08h30", `Sai ceremony: ${initial.ceremony}`);
    assert(initial.reception === "10h00", `Sai reception: ${initial.reception}`);
    assert(initial.deadline === "", `Deadline phải để trống tới khi chốt: ${initial.deadline}`);
    assert(initial.audioPaused === true, "Audio không được phát khi initial load");
    assert(initial.audioSources === 2, `Music phải có 2 sources: ${initial.audioSources}`);
    assert(initial.scrollWidth <= initial.clientWidth + 1, "Có horizontal overflow");
    assert(initial.albumCount === 9, `Album phải có 9 ảnh: ${initial.albumCount}`);
    assert(initial.eventId === "groom", `Sai active event: ${initial.eventId}`);
    assert(initial.personalizedCopyHidden === false, "Nút copy link có tên phải hiện");

    const centered = await page.evaluate(() => {
      const centerError = (selector) => {
        const rect = document.querySelector(selector).getBoundingClientRect();
        return Math.abs((rect.left + rect.width / 2) - document.documentElement.clientWidth / 2);
      };
      return {
        eyebrow: centerError(".hero .eyebrow"),
        date: centerError(".hero__date"),
        open: centerError("#openInvitationButton")
      };
    });
    assert(centered.eyebrow < 3, `Eyebrow lệch tâm: ${centered.eyebrow}`);
    assert(centered.date < 3, `Ngày lệch tâm: ${centered.date}`);
    assert(centered.open < 3, `Nút mở thiệp lệch tâm: ${centered.open}`);

    if (viewport.height <= 520) {
      const heroLayout = await page.evaluate(() => {
        const hero = document.querySelector(".hero").getBoundingClientRect();
        const names = document.querySelector(".hero-names").getBoundingClientRect();
        const date = document.querySelector(".hero__date").getBoundingClientRect();
        const open = document.querySelector("#openInvitationButton").getBoundingClientRect();
        return { heroHeight: hero.height, namesBottom: names.bottom, dateTop: date.top, dateBottom: date.bottom, openTop: open.top };
      });
      assert(heroLayout.heroHeight >= 498, `Hero landscape quá thấp: ${heroLayout.heroHeight}`);
      assert(heroLayout.namesBottom < heroLayout.dateTop, "Tên chồng lên ngày ở landscape");
      assert(heroLayout.dateBottom < heroLayout.openTop, "Ngày chồng lên nút Mở thiệp");
    }

    assert(formRequests === 0, `Không được tải Form ban đầu: ${formRequests}`);
    assert(mapRequests === 0, `Không được tải Map ban đầu: ${mapRequests}`);
    assert(wishRequests === 0, `Không được tải lời chúc ban đầu: ${wishRequests}`);
    assert(qrRequests === 0, `Không được tải QR ban đầu: ${qrRequests}`);

    const rsvpDisabled = await page.evaluate(() => ({
      ariaDisabled: document.querySelector("#rsvpButton")?.getAttribute("aria-disabled"),
      text: document.querySelector("#rsvpButton")?.textContent?.trim(),
      note: document.querySelector("#rsvpNote")?.textContent?.trim()
    }));
    assert(rsvpDisabled.ariaDisabled === "true", "RSVP phải disabled an toàn");
    assert(rsvpDisabled.text === "RSVP sẽ cập nhật", `Sai RSVP label: ${rsvpDisabled.text}`);
    assert(formRequests === 0, `Không được tải Form khi chưa cấu hình: ${formRequests}`);

    await page.locator("#mapButton").click();
    await page.waitForSelector("#mapDialog[open]");
    await page.waitForFunction(() => {
      const frame = document.querySelector("#mapFrame");
      return frame && !frame.hidden && getComputedStyle(frame).display !== "none";
    });
    assert(await page.locator("#mapFrame").isVisible(), "Map iframe phải visible");
    assert(mapRequests === 1, `Map phải tải đúng một lần: ${mapRequests}`);
    const mapFooterInside = await page.evaluate(() => {
      const rect = document.querySelector("#mapDialog .embed-dialog__footer").getBoundingClientRect();
      return rect.top >= -1 && rect.bottom <= window.innerHeight + 1;
    });
    assert(mapFooterInside, "Footer Map bị cắt khỏi viewport");
    await page.locator("[data-close-map-dialog]").first().click();

    await page.locator("#rsvpButton").click();
    await page.waitForTimeout(120);
    const rsvpDialogOpen = await page.locator("#rsvpDialog").evaluate(
      (dialog) => dialog.open
    );
    assert(rsvpDialogOpen === false, "RSVP disabled không được mở dialog");
    assert(formRequests === 0, `RSVP disabled không được tải Form: ${formRequests}`);

    await page.locator("#giftButton").click();
    await page.waitForSelector("#giftDialog[open]");
    await page.waitForFunction(() => document.querySelectorAll("#giftGrid img").length === 2);
    assert(qrRequests === 2, `Gift QR phải tải sau lần mở đầu tiên: ${qrRequests}`);
    await page.locator("[data-close-dialog]").click();

    await page.locator('[data-lightbox="couple-hands"]').click();
    await page.waitForSelector("#lightboxDialog[open]");
    await page.locator("[data-lightbox-next]").click();
    const counter = (await page.locator("#lightboxCounter").textContent()).trim();
    assert(counter === "2 / 9", `Sai lightbox counter: ${counter}`);
    await page.locator("[data-close-lightbox]").click();

    await page.locator("#wishes").scrollIntoViewIfNeeded();
    await page.waitForFunction(
      () => document.querySelectorAll(".wish-card").length === 1
    );
    assert(wishRequests === 1, `Phải có đúng một request lời chúc: ${wishRequests}`);

    assert(pageErrors.length === 0, `Page errors: ${pageErrors.join(" | ")}`);
    assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join(" | ")}`);

    report.push({
      viewport,
      initial,
      formRequests,
      mapRequests,
      wishRequests,
      lightboxCounter: counter,
      qrRequests
    });

    await page.close();
  }

  console.log(JSON.stringify({ verdict: "PASS", report }, null, 2));
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

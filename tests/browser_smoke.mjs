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
    const file = stat.isDirectory() ? path.join(resolved, "index.html") : resolved;
    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(file).toLowerCase()] || "application/octet-stream",
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

    // Keep font rendering deterministic without deliberately creating network
    // errors in the console. Empty CSS exercises the production fallback stack.
    await page.route(/https:\/\/fonts\.googleapis\.com\/.*/, async (route) => {
      await route.fulfill({ status: 200, contentType: "text/css; charset=utf-8", body: "" });
    });
    await page.route(/https:\/\/fonts\.gstatic\.com\/.*/, async (route) => {
      await route.fulfill({ status: 204, body: "" });
    });
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
      const callback = new URL(route.request().url()).searchParams.get("callback");
      if (!callback) {
        await route.abort();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/javascript; charset=utf-8",
        body: `${callback}(${JSON.stringify({
          ok: true,
          wishes: [{
            id: "smoke-1",
            displayName: "Gia đình cô Lan",
            relationship: "Người thân",
            message: "Chúc đôi uyên ương luôn hạnh phúc.",
            featured: true
          }]
        })});`
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
      timelineTimes: Array.from(
        document.querySelectorAll("#eventTimeline time"),
        (item) => item.textContent?.trim()
      ),
      timelineLabels: Array.from(
        document.querySelectorAll("#eventTimeline h3"),
        (item) => item.textContent?.trim()
      ),
      deadline: document.querySelector("[data-rsvp-deadline]")?.textContent?.trim(),
      audioPaused: document.querySelector("#weddingMusic")?.paused,
      audioSources: document.querySelectorAll("#weddingMusic source").length,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      albumCount: document.querySelectorAll(".album-item").length,
      eventId: document.body.dataset.eventId,
      personalizedCopyHidden: document.querySelector("#copyPersonalizedLinkButton")?.hidden,
      expectedGiftCount: window.WEDDING_CONFIG?.gifts?.length ?? 0,
      rsvpEnabled: Boolean(window.WEDDING_CONFIG?.rsvp?.enabled)
    }));

    assert(initial.build === "v20.1-20260726", `Sai build: ${initial.build}`);
    assert(initial.guestName === "Gia đình cô Lan", `Sai guest name: ${initial.guestName}`);
    assert(initial.familiesHidden === true, "Family section phải tự ẩn");
    assert(
      JSON.stringify(initial.timelineTimes) === JSON.stringify(["08h30", "10h00"]),
      `Sai timeline times: ${JSON.stringify(initial.timelineTimes)}`
    );
    assert(
      JSON.stringify(initial.timelineLabels) === JSON.stringify(["Lễ Thành Hôn", "Đón khách và dùng tiệc"]),
      `Sai timeline labels: ${JSON.stringify(initial.timelineLabels)}`
    );
    assert(initial.deadline === "", `Deadline phải để trống tới khi chốt: ${initial.deadline}`);
    assert(initial.audioPaused === true, "Audio không được phát khi initial load");
    assert(initial.audioSources === 2, `Music phải có 2 sources: ${initial.audioSources}`);
    assert(initial.scrollWidth <= initial.clientWidth + 1, "Có horizontal overflow");
    assert(initial.albumCount === 9, `Album phải có 9 ảnh: ${initial.albumCount}`);
    assert(initial.eventId === "groom", `Sai active event: ${initial.eventId}`);
    assert(initial.personalizedCopyHidden === false, "Nút copy link có tên phải hiện");
    assert(initial.rsvpEnabled === false, "Fixture groom hiện phải dùng fallback liên hệ RSVP");
    assert(
      Number.isInteger(initial.expectedGiftCount) && initial.expectedGiftCount > 0,
      `Số QR theo sự kiện không hợp lệ: ${initial.expectedGiftCount}`
    );

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
      // getBoundingClientRect() tính cả transform đang chạy dở. Hiệu ứng vào
      // trang dịch phần tử 28px (--motion-transform), đúng bằng mức làm phép so
      // sánh dưới đây lúc đỏ lúc xanh. Chờ hiệu ứng hero kết thúc rồi mới đo.
      await page.waitForFunction(() =>
        [...document.querySelectorAll(".hero .motion-load")].every((element) =>
          element.classList.contains("is-visible")
        )
      );
      await page.evaluate(() =>
        Promise.all(
          document
            .querySelector(".hero")
            .getAnimations({ subtree: true })
            .map((animation) => animation.finished.catch(() => {}))
        )
      );

      const heroLayout = await page.evaluate(() => {
        const hero = document.querySelector(".hero").getBoundingClientRect();
        const names = document.querySelector(".hero-names").getBoundingClientRect();
        const date = document.querySelector(".hero__date").getBoundingClientRect();
        const open = document.querySelector("#openInvitationButton").getBoundingClientRect();
        return {
          heroHeight: hero.height,
          namesBottom: names.bottom,
          dateTop: date.top,
          dateBottom: date.bottom,
          openTop: open.top
        };
      });
      assert(heroLayout.heroHeight >= 498, `Hero landscape quá thấp: ${heroLayout.heroHeight}`);
      assert(heroLayout.namesBottom < heroLayout.dateTop, "Tên chồng lên ngày ở landscape");
      assert(heroLayout.dateBottom < heroLayout.openTop, "Ngày chồng lên nút Mở thiệp");
    }

    assert(formRequests === 0, `Không được tải Form ban đầu: ${formRequests}`);
    assert(mapRequests === 0, `Không được tải Map ban đầu: ${mapRequests}`);
    assert(wishRequests === 0, `Không được tải lời chúc ban đầu: ${wishRequests}`);
    assert(qrRequests === 0, `Không được tải QR ban đầu: ${qrRequests}`);

    const rsvpFallback = await page.evaluate(() => ({
      text: document.querySelector("#rsvpButton")?.textContent?.trim(),
      href: document.querySelector("#rsvpButton")?.getAttribute("href") || ""
    }));
    assert(rsvpFallback.text === "Liên hệ xác nhận", `Sai RSVP fallback label: ${rsvpFallback.text}`);
    assert(rsvpFallback.href.startsWith("tel:"), `RSVP fallback phải có tel href: ${rsvpFallback.href}`);

    await page.locator("#rsvpButton").click();
    await page.waitForSelector("#attendanceContactDialog[open]");
    const contactFallback = await page.evaluate(() => ({
      callLinks: document.querySelectorAll("#attendanceContactDialog [data-attendance-call]:not([hidden])").length,
      recommendation: document.querySelector("#attendanceContactRecommendation")?.textContent?.trim(),
      rsvpDialogOpen: document.querySelector("#rsvpDialog")?.open
    }));
    assert(contactFallback.callLinks === 2, `Phải có hai lựa chọn liên hệ: ${contactFallback.callLinks}`);
    assert(
      contactFallback.recommendation?.includes("chú rể"),
      `Sai gợi ý liên hệ theo sự kiện: ${contactFallback.recommendation}`
    );
    assert(contactFallback.rsvpDialogOpen === false, "Không được mở iframe RSVP khi Form chưa cấu hình");
    assert(formRequests === 0, `Fallback liên hệ không được tải Form: ${formRequests}`);
    await page.locator("[data-close-attendance-contact]").first().click();

    await page.locator("#mapButton").click();
    await page.waitForSelector("#mapDialog[open]");
    await page.waitForFunction(() => {
      const frame = document.querySelector("#mapFrame");
      const loading = document.querySelector("#mapLoading");
      return frame && !frame.hidden && loading?.hidden === true;
    });
    assert(await page.locator("#mapFrame").isVisible(), "Map iframe phải visible");
    assert(mapRequests === 1, `Map phải tải đúng một lần: ${mapRequests}`);
    const mapFooterInside = await page.evaluate(() => {
      const rect = document.querySelector("#mapDialog .embed-dialog__footer").getBoundingClientRect();
      return rect.top >= -1 && rect.bottom <= window.innerHeight + 1;
    });
    assert(mapFooterInside, "Footer Map bị cắt khỏi viewport");
    await page.locator("[data-close-map-dialog]").first().click();

    await page.locator("#giftButton").click();
    await page.waitForSelector("#giftDialog[open]");
    await page.waitForFunction(
      (expected) => {
        const images = Array.from(document.querySelectorAll("#giftGrid img"));
        return images.length === expected && images.every((image) => image.complete);
      },
      initial.expectedGiftCount
    );
    assert(
      qrRequests === initial.expectedGiftCount,
      `Gift QR phải khớp chính sách sự kiện: expected=${initial.expectedGiftCount}, actual=${qrRequests}`
    );
    await page.locator("[data-close-dialog]").click();

    await page.locator('[data-lightbox="couple-hands"]').click();
    await page.waitForSelector("#lightboxDialog[open]");
    await page.locator("[data-lightbox-next]").click();
    const counter = (await page.locator("#lightboxCounter").textContent()).trim();
    assert(counter === "2 / 9", `Sai lightbox counter: ${counter}`);
    await page.locator("[data-close-lightbox]").click();

    await page.locator("#wishes").scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelectorAll(".wish-card").length === 1);
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

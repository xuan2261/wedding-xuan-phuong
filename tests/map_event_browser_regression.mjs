import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const types = { ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".mp3": "audio/mpeg", ".ics": "text/calendar; charset=utf-8" };
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  const resolved = path.resolve(root, pathname === "/" ? "index.html" : pathname.slice(1));
  if (!resolved.startsWith(root) || !fs.existsSync(resolved)) { response.writeHead(404); response.end("Not found"); return; }
  const stat = fs.statSync(resolved); const file = stat.isDirectory() ? path.join(resolved, "index.html") : resolved;
  response.writeHead(200, { "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(file).pipe(response);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch(); const report = [];
try {
  for (const eventId of ["bride", "groom", "nhatrang", "saigon"]) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.addInitScript(() => { window.__WEDDING_TEST_MODE__ = true; window.__WEDDING_SKIP_COVER__ = true; window.__WEDDING_TEST_NOW__ = "2026-07-23T12:00:00+07:00"; });
    await page.route(/https:\/\/fonts\.googleapis\.com\/.*/, (route) => route.fulfill({ status: 200, contentType: "text/css; charset=utf-8", body: "" }));
    await page.route(/https:\/\/fonts\.gstatic\.com\/.*/, (route) => route.fulfill({ status: 204, body: "" }));
    await page.route(/https:\/\/www\.google\.com\/maps.*/, (route) => route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: "<!doctype html><title>Map fixture</title>" }));
    await page.goto(`${baseUrl}#event=${eventId}`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction((id) => document.body.dataset.eventId === id, eventId);
    const state = await page.evaluate(() => { const event = window.WEDDING_CONFIG.event; return { eventId: event.id, venueName: event.venueName, fullAddress: [event.addressLine1, event.addressLine2].filter(Boolean).join(", "), embedUrl: event.mapEmbedUrl, mapsUrl: event.mapsUrl, dialogVenue: document.querySelector("#map-dialog-title")?.textContent?.trim(), dialogAddress: document.querySelector("#map-dialog-intro")?.textContent?.trim(), frameTitle: document.querySelector("#mapFrame")?.title, mainAddress: Array.from(document.querySelectorAll("#venueAddress span"), (node) => node.textContent?.trim()).join(", "), externalMapHref: document.querySelector("#mapDialog [data-maps-link]")?.href }; });
    assert(state.eventId === eventId, `${eventId}: sai event active`);
    assert(state.dialogVenue === state.venueName, `${eventId}: sai tiêu đề dialog`);
    assert(state.dialogAddress === state.fullAddress, `${eventId}: sai địa chỉ dialog: ${state.dialogAddress}`);
    assert(state.frameTitle === `Bản đồ đến ${state.venueName}`, `${eventId}: sai iframe title`);
    assert(state.mainAddress === state.fullAddress, `${eventId}: sai địa chỉ phần sự kiện`);
    assert(state.externalMapHref === state.mapsUrl, `${eventId}: sai Google Maps href`);
    if (eventId !== "groom") assert(!state.dialogAddress.includes("346 Nguyễn Huệ"), `${eventId}: rò địa chỉ nhà trai`);
    await page.locator("#mapButton").click(); await page.waitForSelector("#mapDialog[open]");
    await page.waitForFunction(() => Boolean(document.querySelector("#mapFrame")?.getAttribute("src")));
    const frameSrc = await page.locator("#mapFrame").getAttribute("src");
    assert(frameSrc === state.embedUrl, `${eventId}: sai iframe src: ${frameSrc}`);
    report.push(state); await page.close();
  }
  console.log(JSON.stringify({ verdict: "PASS", report }, null, 2));
} finally { await browser.close(); await new Promise((resolve) => server.close(resolve)); }

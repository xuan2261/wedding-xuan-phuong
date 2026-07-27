#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]


def replace_once(path: str, old: str, new: str) -> None:
    file = ROOT / path
    text = file.read_text(encoding="utf-8")
    if old not in text:
        raise SystemExit(f"FAIL: pattern not found in {path}: {old[:120]!r}")
    file.write_text(text.replace(old, new, 1), encoding="utf-8")


# Root cause: applyConfig updated only the main venue fields. Bind the map-dialog
# address and iframe accessibility title to the active event as well.
replace_once(
    "app.js",
    '    setText("[data-address-line1]", event.addressLine1);\n'
    '    setText("[data-address-line2]", event.addressLine2);\n',
    '    setText("[data-address-line1]", event.addressLine1);\n'
    '    setText("[data-address-line2]", event.addressLine2);\n\n'
    '    const fullEventAddress = [event.addressLine1, event.addressLine2]\n'
    '      .filter(Boolean)\n'
    '      .join(", ");\n'
    '    const mapDialogIntro = $("#map-dialog-intro");\n'
    '    const mapFrame = $("#mapFrame");\n'
    '    if (mapDialogIntro) {\n'
    '      mapDialogIntro.textContent = fullEventAddress || "Địa chỉ đang được cập nhật.";\n'
    '    }\n'
    '    if (mapFrame) {\n'
    '      mapFrame.title = event.venueName\n'
    '        ? `Bản đồ đến ${event.venueName}`\n'
    '        : "Bản đồ địa điểm sự kiện";\n'
    '    }\n',
)

# Avoid flashing the groom fallback before JavaScript binds the selected event.
replace_once(
    "index.html",
    '    <p class="dialog-intro" id="map-dialog-intro">\n'
    '      346 Nguyễn Huệ, Xã Bình Dương, Tỉnh Gia Lai\n'
    '    </p>',
    '    <p class="dialog-intro" id="map-dialog-intro">\n'
    '      Địa chỉ sự kiện đang được cập nhật…\n'
    '    </p>',
)
replace_once(
    "index.html",
    '        title="Bản đồ đến tư gia nhà trai"',
    '        title="Bản đồ địa điểm sự kiện"',
)

# Runtime config and authoritative data.
config_path = ROOT / "config.js"
config = config_path.read_text(encoding="utf-8")
config = config.replace(" * CẤU HÌNH THIỆP CƯỚI ĐA SỰ KIỆN — v20.2", " * CẤU HÌNH THIỆP CƯỚI ĐA SỰ KIỆN — v20.3")
config = config.replace('buildId: "v20.2-20260726"', 'buildId: "v20.3-20260727"')
config = config.replace('release: "v20.2"', 'release: "v20.3"')
config = config.replace('status: "ak-debug-full-audit-and-deploy-hardening"', 'status: "event-map-binding-and-location-consistency"')
config = config.replace('          draftMapsUrl: "https://maps.app.goo.gl/6E3JzWf4MQboumNH7",\n', "")
config = config.replace('          addressLine1: "16 Einstein",', '          addressLine1: "14 Einstein",')
config = config.replace('          addressLine2: "Thủ Đức, Hồ Chí Minh",', '          addressLine2: "Phường Thủ Đức, Thành phố Hồ Chí Minh",')
if "draftMapsUrl" in config:
    raise SystemExit("FAIL: config.js still contains draftMapsUrl")
config_path.write_text(config, encoding="utf-8")

data_path = ROOT / "tools/wedding-data.json"
data = json.loads(data_path.read_text(encoding="utf-8"))
data["build"].update({
    "buildId": "v20.3-20260727",
    "release": "v20.3",
    "status": "event-map-binding-and-location-consistency",
})
for event in data["events"].values():
    event.pop("draftMapsUrl", None)
    event["giftIds"] = ["groom", "bride"]
    event["address"] = ", ".join(
        value for value in [event.get("addressLine1"), event.get("addressLine2")] if value
    )
saigon = data["events"]["saigon"]
saigon["addressLine1"] = "14 Einstein"
saigon["addressLine2"] = "Phường Thủ Đức, Thành phố Hồ Chí Minh"
saigon["address"] = "14 Einstein, Phường Thủ Đức, Thành phố Hồ Chí Minh"
data_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

build_path = ROOT / "BUILD.json"
build = json.loads(build_path.read_text(encoding="utf-8"))
build.update({
    "buildId": "v20.3-20260727",
    "release": "v20.3",
    "generatedAtUtc": "2026-07-27T12:00:00+00:00",
    "status": "event-map-binding-and-location-consistency",
})
build["knownBlockers"] = [
    item for item in build.get("knownBlockers", [])
    if item not in {
        "Nha Trang and Sài Gòn addresses/maps are incomplete.",
        "Bride map pin is not verified.",
    }
]
build_path.write_text(json.dumps(build, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

index_path = ROOT / "index.html"
index = index_path.read_text(encoding="utf-8")
index = index.replace('content="v20.2-20260726"', 'content="v20.3-20260727"')
index = index.replace("?v=5.7", "?v=5.8")
index_path.write_text(index, encoding="utf-8")

package_path = ROOT / "package.json"
package = json.loads(package_path.read_text(encoding="utf-8"))
package["version"] = "20.3.0"
if "event_location_consistency_check.py" not in package["scripts"]["test:static"]:
    package["scripts"]["test:static"] = package["scripts"]["test:static"].replace(
        "python tests/consistency_check.py &&",
        "python tests/consistency_check.py && python tests/event_location_consistency_check.py &&",
        1,
    )
if "test:map-events" not in package["scripts"]["test:browser-all"]:
    package["scripts"]["test:browser-all"] = package["scripts"]["test:browser-all"].replace(
        "npm run test:browser &&",
        "npm run test:browser && npm run test:map-events &&",
        1,
    )
package["scripts"]["test:map-events"] = "node tests/map_event_browser_regression.mjs"
package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

lock_path = ROOT / "package-lock.json"
lock = json.loads(lock_path.read_text(encoding="utf-8"))
lock["version"] = "20.3.0"
if "" in lock.get("packages", {}):
    lock["packages"][""]["version"] = "20.3.0"
lock_path.write_text(json.dumps(lock, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

consistency_path = ROOT / "tests/consistency_check.py"
consistency = consistency_path.read_text(encoding="utf-8").replace(
    'EXPECTED_BUILD = "v20.2-20260726"',
    'EXPECTED_BUILD = "v20.3-20260727"',
)
consistency_path.write_text(consistency, encoding="utf-8")

generator_path = ROOT / "tools/generate-multi-event-calendars.py"
generator = generator_path.read_text(encoding="utf-8")
generator = generator.replace(
    '"PRODID:-//Xuân Phượng//Multi-Event Wedding v19//VI",',
    '"PRODID:-//Xuân Phượng//Multi-Event Wedding v20.3//VI",',
)
generator = generator.replace(
    '        f"LOCATION:{escape(event[\'address\'])}",',
    '        f"LOCATION:{escape(event[\'venueName\'] + ", " + event[\'address\'])}",',
)
generator_path.write_text(generator, encoding="utf-8")

static_test = r'''#!/usr/bin/env python3
from pathlib import Path
import json
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "tools/wedding-data.json").read_text(encoding="utf-8"))
CONFIG = (ROOT / "config.js").read_text(encoding="utf-8")
APP = (ROOT / "app.js").read_text(encoding="utf-8")
errors = []

def require(condition, message):
    if not condition:
        errors.append(message)

require("draftMapsUrl" not in CONFIG, "config.js còn draftMapsUrl nhiễm chéo")
require(all("draftMapsUrl" not in event for event in DATA["events"].values()), "wedding-data còn draftMapsUrl")
maps_urls, embed_urls = [], []
for event_id, event in DATA["events"].items():
    address = ", ".join(value for value in [event.get("addressLine1"), event.get("addressLine2")] if value)
    require(event.get("address") == address, f"{event_id}: address lệch addressLine1/2")
    require(event.get("mapsVerified") is True, f"{event_id}: mapsVerified chưa true")
    require(event.get("giftIds") == ["groom", "bride"], f"{event_id}: giftIds lệch config runtime")
    maps_urls.append(event.get("mapsUrl")); embed_urls.append(event.get("mapEmbedUrl"))
    calendar = ROOT / event["calendar"]["file"]
    require(calendar.exists(), f"{event_id}: thiếu ICS")
    if calendar.exists():
        ics = calendar.read_text(encoding="utf-8").replace("\r\n ", "").replace("\n ", "")
        require("Multi-Event Wedding v20.3" in ics, f"{event_id}: PRODID ICS cũ")
        require(address in ics.replace("\\,", ","), f"{event_id}: ICS thiếu địa chỉ đầy đủ")
require(len(set(maps_urls)) == len(maps_urls), "Có mapsUrl dùng chung sai giữa các event")
require(len(set(embed_urls)) == len(embed_urls), "Có mapEmbedUrl dùng chung sai giữa các event")
require('addressLine1: "14 Einstein"' in CONFIG, "Sesan chưa sửa thành 14 Einstein")
require('addressLine2: "Phường Thủ Đức, Thành phố Hồ Chí Minh"' in CONFIG, "Sesan chưa cập nhật phường/thành phố")
require('const mapDialogIntro = $("#map-dialog-intro")' in APP, "app.js thiếu binding địa chỉ map dialog")
require('const mapFrame = $("#mapFrame")' in APP, "app.js thiếu binding iframe title")
if errors:
    print("FAIL")
    for error in errors: print("-", error)
    sys.exit(1)
print("PASS: event map/address/calendar consistency")
'''
(ROOT / "tests/event_location_consistency_check.py").write_text(static_test, encoding="utf-8")

browser_test = r'''import http from "node:http";
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
'''
(ROOT / "tests/map_event_browser_regression.mjs").write_text(browser_test, encoding="utf-8")

changelog_path = ROOT / "CHANGELOG.md"
changelog = changelog_path.read_text(encoding="utf-8")
entry = """## v20.3 — 2026-07-27\n\n- Sửa triệt để địa chỉ và nhãn trợ năng trong hộp thoại bản đồ theo đúng từng sự kiện.\n- Sửa địa chỉ Nhà hàng Sesan thành 14 Einstein, Phường Thủ Đức, Thành phố Hồ Chí Minh.\n- Xóa `draftMapsUrl` nhiễm chéo, đồng bộ chính sách quà mừng và dữ liệu lịch ICS.\n- Thêm regression test render đủ nhà gái, nhà trai, Nha Trang và Sài Gòn.\n\n"""
if not changelog.startswith("## v20.3"):
    changelog_path.write_text(entry + changelog, encoding="utf-8")

print("PASS: applied v20.3 event map fixes")

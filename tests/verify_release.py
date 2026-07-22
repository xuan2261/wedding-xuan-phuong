from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []


def require(condition, message):
    if not condition:
        errors.append(message)


config = (ROOT / "config.js").read_text(encoding="utf-8")
guest_utils = (ROOT / "guest-utils.js").read_text(encoding="utf-8")
app = (ROOT / "app.js").read_text(encoding="utf-8")
index = (ROOT / "index.html").read_text(encoding="utf-8")
styles = (ROOT / "styles.css").read_text(encoding="utf-8")
setup = (ROOT / "WISHES-SETUP.md").read_text(encoding="utf-8")
backend = (ROOT / "tools" / "wedding-wishes-webapp.gs").read_text(
    encoding="utf-8"
)

require('guestTime: "10h00"' in config, "guestTime phải là 10h00")
require('ceremonyTime: "08h30"' in config, "ceremonyTime phải là 08h30")
require('ceremonyLabel: "Lễ Thành Hôn"' in config, "Thiếu ceremonyLabel")
require('receptionLabel: "Đón khách và dùng tiệc"' in config, "Thiếu receptionLabel")
require('personalization: {' in config, "Thiếu personalization config")
require('guestNameEntry: ""' in config, "Thiếu RSVP guestNameEntry an toàn")
require('mode: "dialog"' in config, "RSVP chưa dùng dialog")
require('mapEmbedUrl:' in config, "Thiếu mapEmbedUrl")
require('sources: [' in config, "Music chưa dùng source list")
require('statics.pancake.vn' in config, "Thiếu nguồn nhạc remote fallback")
require('calendar: {' in config, "Thiếu calendar config")
require('sharing: {' in config, "Thiếu sharing config")
require('families: {' in config, "Thiếu family config")

require('id="guest-invitation"' in index, "Thiếu lời mời cá nhân hóa")
require('data-guest-name>Quý vị<' in index, "Thiếu fallback Quý vị")
require('id="families"' in index and 'id="families"' in index, "Thiếu family section")
require('class="event-timeline"' in index, "Thiếu timeline")
require('id="calendarButton"' in index, "Thiếu nút calendar")
require('id="rsvpDialog"' in index, "Thiếu RSVP dialog")
require('id="rsvpFrame"' in index, "Thiếu RSVP iframe")
require('id="mapDialog"' in index, "Thiếu map dialog")
require('id="mapFrame"' in index, "Thiếu map iframe")
require('id="copyPersonalizedLinkButton"' in index, "Thiếu nút copy link cá nhân")
require('id="shareButton"' in index, "Thiếu nút share")
require('data-lightbox-prev' in index, "Thiếu lightbox prev")
require('data-lightbox-next' in index, "Thiếu lightbox next")
require('id="lightboxCounter"' in index, "Thiếu lightbox counter")
require('id="lightboxImage" src=""' not in index, "Lightbox còn src rỗng")
require(
    'sizes="(max-width: 760px) 92vw, 720px"'
    in re.search(
        r'<button class="album-item album-item--wide reveal"[^>]*data-lightbox="hero".*?</button>',
        index,
        flags=re.S,
    ).group(0),
    "Ảnh hero wide khai báo sizes sai",
)

require(
    app.count('void playMusic({ silent: true });') == 1,
    "Nhạc chỉ được gọi một lần từ thao tác Mở thiệp",
)
require(
    "Thử autoplay trên các trình duyệt" not in app,
    "Còn block autoplay khi initial load",
)
require('navigator.share' in app, "Thiếu Web Share")
require('navigator.clipboard.writeText' in app, "Thiếu clipboard fallback")
require('guestState.isPersonalized' in app, "Thiếu guest state")
require('URLSearchParams' in guest_utils, "Guest utils không dùng URLSearchParams")
require('innerHTML' not in guest_utils, "Guest utils không được dùng innerHTML")
require('innerHTML' not in app, "app.js không được dùng innerHTML")

require('payload.ok && payload.stored === true' in app, "Frontend chưa yêu cầu stored === true")
require('stored: true' in backend, "Backend chưa trả stored: true")
require('version: "1.5.0"' in backend, "Sai backend version")
require('duplicateWindowSeconds: 21600' in backend, "Cache TTL chưa về 21600")
require('event: "wish-cache-write-failed"' in backend, "Cache chưa best-effort")
require('tools/wedding-wishes-webapp.gs' in setup, "WISHES-SETUP trỏ sai backend")
require('name="wedding-build" content="v18-20260722"' in index, "Sai build marker")
require('https://*.script.googleusercontent.com' in index, "CSP thiếu dynamic googleusercontent")
require('https://docs.google.com' in index, "CSP thiếu Google Forms frame")
require('https://www.google.com' in index, "CSP thiếu Google Maps frame")
require('https://statics.pancake.vn' in index, "CSP thiếu nhạc remote")
require('preloadRootMargin: "1200px 0px"' in config, "Thiếu lazy-load config")
require(not (ROOT / "guests.json").exists(), "Không được có guest list công khai")
require((ROOT / "guest-utils.js").exists(), "Thiếu guest-utils.js")
require((ROOT / "tools" / "create-guest-links.html").exists(), "Thiếu tool tạo link")
require(
    (ROOT / "assets" / "calendar" / "thanh-xuan-thi-phuong.ics").exists(),
    "Thiếu ICS",
)

ics = (ROOT / "assets" / "calendar" / "thanh-xuan-thi-phuong.ics").read_text(
    encoding="utf-8"
)
require(ics.startswith("BEGIN:VCALENDAR"), "ICS thiếu header")
require(ics.strip().endswith("END:VCALENDAR"), "ICS thiếu footer")
require(ics.count("BEGIN:VEVENT") == 2, "ICS phải có hai sự kiện")
require("20260730T083000" in ics, "ICS thiếu 08h30")
require("20260730T100000" in ics, "ICS thiếu 10h00")

for name in ["qr-nha-trai.svg", "qr-nha-gai.svg"]:
    svg = (ROOT / "assets" / "qr" / name).read_text(encoding="utf-8")
    require("THAY ẢNH QR TẠI ĐÂY" not in svg, f"{name} còn placeholder")
    require("data:image/png;base64," in svg, f"{name} chưa nhúng QR PNG")

for key in [
    "couple-intimate",
    "couple-seated",
    "couple-garden",
]:
    for width in [720, 1280]:
        require(
            (ROOT / "assets" / "images" / f"{key}-{width}.webp").exists(),
            f"Thiếu ảnh: {key}-{width}.webp",
        )

require('data-lightbox="couple-seated"' in index, "Album thiếu couple-seated")
require('assets/images/${key}-1280.webp?v=16' in app, "Lightbox sai ảnh 1280")
require(".guest-invitation" in styles, "Thiếu CSS guest invitation")
require(".event-timeline" in styles, "Thiếu CSS timeline")
require(".lightbox__nav" in styles, "Thiếu CSS lightbox nav")
require(".embed-dialog" in styles, "Thiếu CSS embed dialog")
require((ROOT / "assets" / "css" / "wedding-motion.css").exists(), "Thiếu motion CSS")
require((ROOT / "tools" / "wedding-data.json").exists(), "Thiếu wedding-data.json")

ids = re.findall(r'\bid="([^"]+)"', index)
require(len(ids) == len(set(ids)), "HTML có ID trùng")
require(len(re.findall(r"<h1\b", index, flags=re.I)) == 1, "HTML phải có đúng một H1")

refs = set(re.findall(r'(?:src|href)="([^"]+)"', index))
for srcset in re.findall(r'srcset="([^"]+)"', index):
    for entry in srcset.split(","):
        refs.add(entry.strip().split()[0])

for ref in refs:
    clean = ref.split("?", 1)[0].split("#", 1)[0]
    if (
        not clean
        or ref.startswith("#")
        or clean.startswith(
            ("http://", "https://", "mailto:", "tel:", "data:")
        )
    ):
        continue
    require((ROOT / clean).exists(), f"Thiếu local asset: {clean}")

if errors:
    print("FAIL")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("PASS: release source checks")

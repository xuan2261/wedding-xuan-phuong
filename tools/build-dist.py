#!/usr/bin/env python3
from __future__ import annotations

from html import escape
import json
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
DATA = json.loads((ROOT / "tools" / "wedding-data.json").read_text(encoding="utf-8"))
BUILD = json.loads((ROOT / "BUILD.json").read_text(encoding="utf-8"))
SITE_ROOT = "https://xuan2261.github.io/wedding-xuan-phuong/"
META_IMAGE = f"{SITE_ROOT}assets/images/meta-v3.jpg"

if DIST.exists():
    shutil.rmtree(DIST)
DIST.mkdir()

RUNTIME_FILES = [
    "index.html",
    "styles.css",
    "config.js",
    "guest-utils.js",
    "event-entry.js",
    "app.js",
    "robots.txt",
    ".nojekyll",
]
for name in RUNTIME_FILES:
    shutil.copy2(ROOT / name, DIST / name)


def ignore_runtime_noise(directory: str, names: list[str]) -> set[str]:
    ignored: set[str] = set()
    for name in names:
        lower = name.lower()
        if lower.startswith("readme"):
            ignored.add(name)
        elif lower.endswith(".svg") and Path(directory).name == "qr":
            ignored.add(name)
        elif lower.startswith("google-forms-header"):
            ignored.add(name)
    return ignored


shutil.copytree(ROOT / "assets", DIST / "assets", ignore=ignore_runtime_noise)


def render_event_entry(event_id: str, event: dict) -> str:
    title = str(event.get("sharingTitle") or event.get("title") or "Thiệp cưới")
    description = str(event.get("sharingText") or "Trân trọng kính mời Quý vị đến chung vui.")
    event_url = f"{SITE_ROOT}events/{event_id}/"
    date_display = str(event.get("dateDisplay") or "")
    venue = str(event.get("venueName") or "")
    visible_detail = " · ".join(item for item in [date_display, venue] if item)
    return f'''<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow, noimageindex">
  <meta name="referrer" content="no-referrer">
  <meta name="wedding-build" content="{escape(BUILD['buildId'])}">
  <title>{escape(title)}</title>
  <meta name="description" content="{escape(description, quote=True)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{escape(event_url, quote=True)}">
  <meta property="og:title" content="{escape(title, quote=True)}">
  <meta property="og:description" content="{escape(description, quote=True)}">
  <meta property="og:image" content="{escape(META_IMAGE, quote=True)}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="vi_VN">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{escape(title, quote=True)}">
  <meta name="twitter:description" content="{escape(description, quote=True)}">
  <meta name="twitter:image" content="{escape(META_IMAGE, quote=True)}">
  <link rel="canonical" href="{escape(event_url, quote=True)}">
  <link rel="icon" href="../../assets/images/favicon.png" type="image/png">
  <style>
    :root {{ color-scheme: light; font-family: Georgia, 'Times New Roman', serif; }}
    body {{ min-height: 100vh; margin: 0; display: grid; place-items: center; background: #f8f3e8; color: #173b2d; text-align: center; padding: 24px; box-sizing: border-box; }}
    main {{ max-width: 620px; }}
    h1 {{ font-size: clamp(2rem, 8vw, 4rem); margin: 0 0 12px; }}
    p {{ line-height: 1.7; }}
    a {{ color: inherit; font-weight: 700; }}
  </style>
  <script src="../../event-entry.js" defer></script>
</head>
<body data-event-id="{escape(event_id, quote=True)}">
  <main>
    <p>Thiệp mời</p>
    <h1>{escape(title)}</h1>
    <p>{escape(visible_detail)}</p>
    <p>Đang mở đúng lời mời dành cho Quý vị…</p>
    <p><a href="../../#event={escape(event_id, quote=True)}" data-event-entry-link>Mở thiệp</a></p>
  </main>
</body>
</html>
'''


events_dir = DIST / "events"
events_dir.mkdir()
for event_id, event in DATA["events"].items():
    target = events_dir / event_id
    target.mkdir()
    (target / "index.html").write_text(
        render_event_entry(event_id, event),
        encoding="utf-8",
    )

release_manifest = {
    "buildId": BUILD["buildId"],
    "release": BUILD["release"],
    "generatedAtUtc": BUILD["generatedAtUtc"],
    "status": BUILD["status"],
    "defaultEventId": DATA["defaultEventId"],
    "eventIds": list(DATA["events"].keys()),
    "shareEntryPages": {
        event_id: f"events/{event_id}/" for event_id in DATA["events"]
    },
}
(DIST / "release.json").write_text(
    json.dumps(release_manifest, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
print(f"PASS: rebuilt optimized clean dist {BUILD['buildId']} with {len(DATA['events'])} event entry pages")

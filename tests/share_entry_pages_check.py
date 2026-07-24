from pathlib import Path
import json
from html import escape
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
DATA = json.loads((ROOT / "tools" / "wedding-data.json").read_text(encoding="utf-8"))
BUILD = json.loads((ROOT / "BUILD.json").read_text(encoding="utf-8"))
errors = []

release_path = DIST / "release.json"
if not release_path.exists():
    errors.append("thiếu dist/release.json")
else:
    release = json.loads(release_path.read_text(encoding="utf-8"))
    if release.get("buildId") != BUILD["buildId"]:
        errors.append("release.json sai build")
    if set(release.get("eventIds", [])) != set(DATA["events"]):
        errors.append("release.json thiếu event")

for event_id, event in DATA["events"].items():
    page = DIST / "events" / event_id / "index.html"
    if not page.exists():
        errors.append(f"thiếu share page {event_id}")
        continue
    html = page.read_text(encoding="utf-8")
    expected_title = event.get("sharingTitle") or event.get("title")
    expected_text = event.get("sharingText")
    checks = {
        "build marker": BUILD["buildId"] in html,
        "event id": f'data-event-id="{event_id}"' in html,
        "OG title": escape(expected_title, quote=True) in html,
        "OG description": escape(expected_text, quote=True) in html,
        "OG URL": f"events/{event_id}/" in html,
        "OG image": "assets/images/meta-v3.jpg" in html,
        "redirect script": "../../event-entry.js" in html,
        "noindex": "noindex, nofollow, noimageindex" in html,
    }
    for label, ok in checks.items():
        if not ok:
            errors.append(f"{event_id}: thiếu {label}")
    if len(re.findall(r'<meta property="og:title"', html)) != 1:
        errors.append(f"{event_id}: OG title không duy nhất")

if not (DIST / "event-entry.js").exists():
    errors.append("thiếu dist/event-entry.js")

if errors:
    print("FAIL")
    for error in errors:
        print("-", error)
    sys.exit(1)
print("PASS: four static event share entry pages")

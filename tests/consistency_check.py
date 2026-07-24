from pathlib import Path
import json, re, sys
ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "tools/wedding-data.json").read_text(encoding="utf-8"))
CONFIG = (ROOT / "config.js").read_text(encoding="utf-8")
INDEX = (ROOT / "index.html").read_text(encoding="utf-8")
BUILD = json.loads((ROOT / "BUILD.json").read_text(encoding="utf-8"))
errors = []
def require(value, message):
    if not value: errors.append(message)

require(DATA["build"]["buildId"] == "v19.2.1-20260724", "wedding-data sai build")
require(BUILD["buildId"] == DATA["build"]["buildId"], "BUILD lệch wedding-data")
require('content="v19.2.1-20260724"' in INDEX, "HTML lệch build")
require(DATA["defaultEventId"] == "groom", "Default event phải là groom")
require(set(DATA["events"]) == {"bride","groom","nhatrang","saigon"}, "Thiếu event")
for event_id, event in DATA["events"].items():
    require(f'{event_id}: {{' in CONFIG, f"config thiếu {event_id}")
    require(event["dateDisplay"] in CONFIG, f"config lệch ngày {event_id}")
    require(event["venueName"] in CONFIG, f"config lệch địa điểm {event_id}")
    require(event["calendar"]["file"] in CONFIG, f"config thiếu calendar {event_id}")
    require((ROOT / event["calendar"]["file"]).exists(), f"thiếu ICS {event_id}")
require(DATA["events"]["nhatrang"]["mapsUrl"] == "", "Nha Trang map phải tắt tới khi xác minh")
require(DATA["events"]["saigon"]["mapsUrl"] == "", "Sài Gòn map phải tắt tới khi xác minh")
require(all(not event["rsvp"]["enabled"] for event in DATA["events"].values()), "RSVP phải tắt an toàn trước khi tạo Form mới")
require('id="eventSwitcher"' in INDEX, "thiếu event switcher")
require('data-invitation-event-name' in INDEX, "thiếu event invitation hook")
require('id="eventTimeline"' in INDEX, "thiếu dynamic timeline")
require((ROOT / "tools/create-google-forms-rsvp-multi-event.gs").exists(), "thiếu multi-event Form script")
if errors:
    print("FAIL")
    for error in errors: print("-", error)
    sys.exit(1)
print("PASS: multi-event wedding data consistency")

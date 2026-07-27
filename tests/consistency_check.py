from pathlib import Path
import json, re, sys

# Thông báo lỗi có tiếng Việt; console Windows mặc định cp1252 sẽ ném
# UnicodeEncodeError và giấu mất lỗi thật.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "tools/wedding-data.json").read_text(encoding="utf-8"))
CONFIG = (ROOT / "config.js").read_text(encoding="utf-8")
INDEX = (ROOT / "index.html").read_text(encoding="utf-8")
BUILD = json.loads((ROOT / "BUILD.json").read_text(encoding="utf-8"))
errors = []
def require(value, message):
    if not value: errors.append(message)

EXPECTED_BUILD = "v20.3-20260727"
require(DATA["build"]["buildId"] == EXPECTED_BUILD, "wedding-data sai build")
require(BUILD["buildId"] == DATA["build"]["buildId"], "BUILD lệch wedding-data")
require(f'content="{EXPECTED_BUILD}"' in INDEX, "HTML lệch build")
require(f'buildId: "{EXPECTED_BUILD}"' in CONFIG, "config lệch build")
require(DATA["defaultEventId"] == "groom", "Default event phải là groom")
require(set(DATA["events"]) == {"bride","groom","nhatrang","saigon"}, "Thiếu event")
for event_id, event in DATA["events"].items():
    require(f'{event_id}: {{' in CONFIG, f"config thiếu {event_id}")
    require(event["dateDisplay"] in CONFIG, f"config lệch ngày {event_id}")
    require(event["venueName"] in CONFIG, f"config lệch địa điểm {event_id}")
    require(event["calendar"]["file"] in CONFIG, f"config thiếu calendar {event_id}")
    require(event["sharingTitle"] in CONFIG, f"config thiếu sharing title {event_id}")
    require(event["sharingText"] in CONFIG, f"config thiếu sharing text {event_id}")
    require((ROOT / event["calendar"]["file"]).exists(), f"thiếu ICS {event_id}")
# Không bao giờ chỉ khách tới một điểm ghim chưa ai mở ra kiểm. Trước đây điều
# này được viết cứng cho Nha Trang và Sài Gòn; nay là bất biến cho mọi sự kiện.
for event_id, event in DATA["events"].items():
    if event["mapsUrl"] or event["mapEmbedUrl"]:
        require(event["mapsVerified"], f"{event_id}: có bản đồ nhưng chưa xác minh điểm ghim")
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

#!/usr/bin/env python3
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

EXPECTED_GIFT_IDS = {
    "bride": ["groom", "bride"],
    "groom": ["groom", "bride"],
    "nhatrang": ["groom"],
    "saigon": ["bride"],
}

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
    require(
        event.get("giftIds") == EXPECTED_GIFT_IDS[event_id],
        f"{event_id}: giftIds lệch chính sách hiển thị quà theo sự kiện",
    )
    maps_urls.append(event.get("mapsUrl")); embed_urls.append(event.get("mapEmbedUrl"))
    calendar = ROOT / event["calendar"]["file"]
    require(calendar.exists(), f"{event_id}: thiếu ICS")
    if calendar.exists():
        ics = calendar.read_text(encoding="utf-8").replace("\r\n ", "").replace("\n ", "")
        require("Multi-Event Wedding v20.3" in ics, f"{event_id}: PRODID ICS cũ")
        require(address in ics.replace("\\,", ","), f"{event_id}: ICS thiếu địa chỉ đầy đủ")
require(len(set(maps_urls)) == len(maps_urls), "Có mapsUrl dùng chung sai giữa các event")
require(len(set(embed_urls)) == len(embed_urls), "Có mapEmbedUrl dùng chung sai giữa các event")
require('venueName: "Sảnh Lorien, Sesan Restaurant"' in CONFIG, "Tên Sesan chưa đồng bộ")
require('addressLine1: "14-15-16 Einstein"' in CONFIG, "Địa chỉ Sesan chưa sửa thành 14-15-16 Einstein")
require('addressLine2: "Phường Thủ Đức, Thành phố Hồ Chí Minh"' in CONFIG, "Sesan chưa cập nhật phường/thành phố")
require('giftIds: ["groom"]' in CONFIG, "config.js thiếu cấu hình Nha Trang chỉ hiện quà chú rể")
require('giftIds: ["bride"]' in CONFIG, "config.js thiếu cấu hình Sài Gòn chỉ hiện quà cô dâu")
require('const mapDialogIntro = $("#map-dialog-intro")' in APP, "app.js thiếu binding địa chỉ map dialog")
require('const mapFrame = $("#mapFrame")' in APP, "app.js thiếu binding iframe title")
if errors:
    print("FAIL")
    for error in errors: print("-", error)
    sys.exit(1)
print("PASS: event map/address/calendar/gift consistency")

#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "tools/wedding-data.json").read_text(encoding="utf-8"))
OUT = ROOT / "assets/calendar"
OUT.mkdir(parents=True, exist_ok=True)

FILES = {
    "bride": "tiec-cuoi-nha-gai-2026-07-29.ics",
    "groom": "le-thanh-hon-nha-trai-2026-07-30.ics",
    "nhatrang": "bao-hy-nha-trang-2026-08-15.ics",
    "saigon": "bao-hy-sai-gon-2026-08-22.ics",
}

def escape(value):
    return str(value).replace("\\", "\\\\").replace(",", "\\,").replace(";", "\\;").replace("\n", "\\n")

def compact_datetime(value):
    return value[:10].replace("-", "") + "T" + value[11:19].replace(":", "")

for event_id, filename in FILES.items():
    event = DATA["events"][event_id]
    timeline = event["timeline"]
    first = timeline[0]
    description = " · ".join(f'{item["time"]} {item["label"]}' for item in timeline)
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "PRODID:-//Xuân Phượng//Multi-Event Wedding v19//VI",
        "BEGIN:VEVENT",
        f"UID:{event_id}-{event['dateIso']}@xuan-phuong",
        "DTSTAMP:20260723T000000Z",
        f"DTSTART;TZID=Asia/Ho_Chi_Minh:{compact_datetime(first['datetime'])}",
        f"SUMMARY:{escape(event['title'])}",
        f"LOCATION:{escape(event['address'])}",
        f"DESCRIPTION:{escape(description)}",
        "BEGIN:VALARM",
        "TRIGGER:-P1D",
        "ACTION:DISPLAY",
        f"DESCRIPTION:{escape(event['title'])}",
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR",
    ]
    (OUT / filename).write_text("\r\n".join(lines) + "\r\n", encoding="utf-8")
    print("WROTE", filename)

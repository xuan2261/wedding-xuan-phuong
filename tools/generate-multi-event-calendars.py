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


def fold(line):
    """Gấp dòng theo RFC 5545 §3.1: tối đa 75 octet, dòng nối mở đầu bằng space.

    Phải đếm theo octet UTF-8 chứ không theo ký tự, và không được cắt giữa một
    ký tự nhiều byte — địa chỉ tiếng Việt sẽ vỡ nếu cắt sai.
    """
    if len(line.encode("utf-8")) <= 75:
        return [line]
    out, current, limit = [], "", 75
    for char in line:
        if len((current + char).encode("utf-8")) > limit:
            out.append(current)
            current, limit = " " + char, 74   # space của dòng nối chiếm 1 octet
        else:
            current += char
    if current:
        out.append(current)
    return out


# DTSTART/DTEND dùng TZID nên bắt buộc kèm VTIMEZONE, nếu không nhiều client sẽ
# hiểu là giờ địa phương của máy và hiện sai giờ. Asia/Ho_Chi_Minh cố định
# UTC+7, không có DST kể từ 1975.
VTIMEZONE = [
    "BEGIN:VTIMEZONE",
    "TZID:Asia/Ho_Chi_Minh",
    "BEGIN:STANDARD",
    "DTSTART:19750613T000000",
    "TZOFFSETFROM:+0800",
    "TZOFFSETTO:+0700",
    "TZNAME:+07",
    "END:STANDARD",
    "END:VTIMEZONE",
]

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
        *VTIMEZONE,
        "BEGIN:VEVENT",
        f"UID:{event_id}-{event['dateIso']}@xuan-phuong",
        "DTSTAMP:20260723T000000Z",
        f"DTSTART;TZID=Asia/Ho_Chi_Minh:{compact_datetime(first['datetime'])}",
        # Thiếu DTEND thì lịch coi sự kiện dài 0 phút; giờ kết thúc hiện là giá
        # trị tạm trong wedding-data.json (calendarEndIsProvisional).
        f"DTEND;TZID=Asia/Ho_Chi_Minh:{compact_datetime(event['calendarEndsAt'])}",
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
    folded = [part for line in lines for part in fold(line)]
    # newline="" để Python không dịch lại "\r\n" khi chạy trên Windows.
    (OUT / filename).write_text(
        "\r\n".join(folded) + "\r\n", encoding="utf-8", newline=""
    )
    print("WROTE", filename)

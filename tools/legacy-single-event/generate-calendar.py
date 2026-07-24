#!/usr/bin/env python3
"""Tạo lại file ICS từ tools/wedding-data.json mà không tự đoán giờ kết thúc."""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "tools" / "wedding-data.json"
OUTPUT = ROOT / "assets" / "calendar" / "thanh-xuan-thi-phuong.ics"
DATA = json.loads(DATA_PATH.read_text(encoding="utf-8"))


def escape(value: str) -> str:
    return (
        str(value)
        .replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\r\n", "\\n")
        .replace("\n", "\\n")
    )


def fold_line(line: str, limit: int = 73) -> list[str]:
    """Fold UTF-8 safely to conservative RFC5545-sized physical lines."""
    if len(line.encode("utf-8")) <= limit:
        return [line]

    lines: list[str] = []
    current = ""
    for char in line:
        prefix = " " if lines else ""
        candidate = current + char
        if len((prefix + candidate).encode("utf-8")) > limit and current:
            lines.append((" " if lines else "") + current)
            current = char
        else:
            current = candidate
    if current:
        lines.append((" " if lines else "") + current)
    return lines


def compact_time(value: str, label: str) -> str:
    value = str(value or "").strip()
    try:
        parsed = datetime.strptime(value, "%H:%M")
    except ValueError as error:
        raise SystemExit(f"{label} phải có định dạng HH:MM, ví dụ 10:30.") from error
    return parsed.strftime("%H%M%S")


def add(lines: list[str], value: str) -> None:
    lines.extend(fold_line(value))


event = DATA["event"]
calendar = DATA.get("calendar", {})
ceremony_end = calendar.get("ceremonyEndTime")
reception_end = calendar.get("receptionEndTime")

if not ceremony_end or not reception_end:
    raise SystemExit(
        "Chưa tạo ICS mới: cần điền calendar.ceremonyEndTime và "
        "calendar.receptionEndTime trong tools/wedding-data.json."
    )

date_compact = event["dateIso"].replace("-", "")
ceremony_start = compact_time(event["ceremonyTime"].replace("h", ":"), "ceremonyTime")
reception_start = compact_time(event["guestTime"].replace("h", ":"), "guestTime")
ceremony_end_compact = compact_time(ceremony_end, "calendar.ceremonyEndTime")
reception_end_compact = compact_time(reception_end, "calendar.receptionEndTime")

if ceremony_end_compact <= ceremony_start:
    raise SystemExit("Giờ kết thúc Lễ Thành Hôn phải sau 08h30.")
if reception_end_compact <= reception_start:
    raise SystemExit("Giờ kết thúc tiệc phải sau 10h00.")

stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
location = f'{event["venueName"]}, {event["address"]}'
contact = DATA["contact"]
lines: list[str] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Thanh Xuan & Thi Phuong//Wedding Invitation v18.2//VI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
]
add(lines, "X-WR-CALNAME:Lễ Thành Hôn · Thanh Xuân & Thị Phượng")
lines += [
    "BEGIN:VTIMEZONE",
    "TZID:Asia/Ho_Chi_Minh",
    "X-LIC-LOCATION:Asia/Ho_Chi_Minh",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0700",
    "TZOFFSETTO:+0700",
    "TZNAME:+07",
    "DTSTART:19700101T000000",
    "END:STANDARD",
    "END:VTIMEZONE",
]


def add_event(uid: str, start: str, end: str, summary: str, description: str) -> None:
    lines.append("BEGIN:VEVENT")
    lines.append(f"UID:{uid}")
    lines.append(f"DTSTAMP:{stamp}")
    lines.append(f"DTSTART;TZID=Asia/Ho_Chi_Minh:{date_compact}T{start}")
    lines.append(f"DTEND;TZID=Asia/Ho_Chi_Minh:{date_compact}T{end}")
    add(lines, f"SUMMARY:{escape(summary)}")
    add(lines, f"DESCRIPTION:{escape(description)}")
    add(lines, f"LOCATION:{escape(location)}")
    add(lines, f'URL:{event["mapsUrl"]}')
    lines += [
        "STATUS:CONFIRMED",
        "TRANSP:OPAQUE",
        "BEGIN:VALARM",
        "TRIGGER:-P1D",
        "ACTION:DISPLAY",
    ]
    add(lines, "DESCRIPTION:Nhắc lịch cưới Thanh Xuân & Thị Phượng")
    lines += ["END:VALARM", "END:VEVENT"]


add_event(
    "20260730-ceremony-xuan-phuong@xuan2261.github.io",
    ceremony_start,
    ceremony_end_compact,
    "Lễ Thành Hôn · Thanh Xuân & Thị Phượng",
    (
        f'Lễ Thành Hôn lúc {event["ceremonyTime"]}. '
        f'Đón khách và dùng tiệc lúc {event["guestTime"]}. '
        f'Liên hệ chú rể: {contact["groomPhone"]}; cô dâu: {contact["bridePhone"]}.'
    ),
)
add_event(
    "20260730-reception-xuan-phuong@xuan2261.github.io",
    reception_start,
    reception_end_compact,
    "Đón khách và dùng tiệc · Thanh Xuân & Thị Phượng",
    (
        "Hân hạnh đón Quý vị đến chung vui cùng hai gia đình. "
        f'Lễ Thành Hôn được cử hành lúc {event["ceremonyTime"]}.'
    ),
)
lines.append("END:VCALENDAR")
OUTPUT.write_text("\r\n".join(lines) + "\r\n", encoding="utf-8")
print(f"PASS: đã tạo {OUTPUT.relative_to(ROOT)}")

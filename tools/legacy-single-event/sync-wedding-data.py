#!/usr/bin/env python3
"""
Đồng bộ các giá trị cốt lõi từ tools/wedding-data.json.

Script này cố ý chỉ thay các literal có hợp đồng rõ ràng. Sau khi chạy,
hãy chạy: python tests/consistency_check.py
"""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "tools" / "wedding-data.json").read_text(encoding="utf-8"))

event = DATA["event"]
rsvp = DATA["rsvp"]
build = DATA["build"]

def replace(path, pattern, replacement):
    text = path.read_text(encoding="utf-8")
    updated, count = re.subn(pattern, replacement, text, count=1)
    if count != 1:
        raise RuntimeError(f"Không thay được {pattern!r} trong {path}")
    path.write_text(updated, encoding="utf-8")

config = ROOT / "config.js"
replace(config, r'guestTime: "[^"]+"', f'guestTime: "{event["guestTime"]}"')
replace(config, r'ceremonyTime: "[^"]+"', f'ceremonyTime: "{event["ceremonyTime"]}"')
replace(config, r'deadline: "\d{2}\.\d{2}\.\d{4}"', f'deadline: "{rsvp["deadlineDisplay"]}"')

index = ROOT / "index.html"
replace(
    index,
    r'<strong data-rsvp-deadline>[^<]+</strong>',
    f'<strong data-rsvp-deadline>{rsvp["deadlineDisplay"]}</strong>',
)
replace(
    index,
    r'<meta name="wedding-build" content="[^"]+">',
    f'<meta name="wedding-build" content="{build["buildId"]}">',
)

for filename in [
    "create-google-forms-rsvp.gs",
    "update-google-forms-rsvp-contact.gs",
]:
    path = ROOT / "tools" / filename
    replace(path, r'guestTime: "[^"]+"', f'guestTime: "{event["guestTime"]}"')
    replace(path, r'ceremonyTime: "[^"]+"', f'ceremonyTime: "{event["ceremonyTime"]}"')
    replace(path, r'address: "[^"]+"', f'address: "{event["address"]}"')
    replace(path, r'rsvpDeadline: "[^"]+"', f'rsvpDeadline: "{rsvp["deadlineSlash"]}"')

print("PASS: Đã đồng bộ dữ liệu cưới từ wedding-data.json")

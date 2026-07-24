#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import urllib.request

parser = argparse.ArgumentParser(description="Verify the deployed wedding build and event pages")
parser.add_argument("--url", default="https://xuan2261.github.io/wedding-xuan-phuong/")
parser.add_argument("--expected", default="v19.4-20260724")
args = parser.parse_args()
base = args.url.rstrip("/") + "/"
headers = {"Cache-Control": "no-cache", "Pragma": "no-cache"}

def read_text(url: str) -> str:
    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8", "replace")

root = read_text(base + "?build=" + args.expected)
match = re.search(r'<meta\s+name=["\']wedding-build["\']\s+content=["\']([^"\']+)', root, re.I)
if not match:
    raise SystemExit("FAIL: missing wedding-build marker")
if match.group(1) != args.expected:
    raise SystemExit(f"FAIL: expected {args.expected}, got {match.group(1)}")
release = json.loads(read_text(base + "release.json?build=" + args.expected))
if release.get("buildId") != args.expected:
    raise SystemExit("FAIL: release.json build mismatch")
for event_id in ["bride", "groom", "nhatrang", "saigon"]:
    page = read_text(base + f"events/{event_id}/?build=" + args.expected)
    if args.expected not in page or f'data-event-id="{event_id}"' not in page:
        raise SystemExit(f"FAIL: event entry page mismatch: {event_id}")
print(f"PASS: live site is {args.expected} with four event entry pages")

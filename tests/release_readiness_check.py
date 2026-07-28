#!/usr/bin/env python3
"""Contract test for automated/manual release-readiness separation."""

from __future__ import annotations

import copy
import importlib.util
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "tools" / "release_readiness.py"
DATA_PATH = ROOT / "tools" / "wedding-data.json"
MANUAL_PATH = ROOT / "tools" / "guest-release-manual.json"

module_name = "wedding_release_readiness"
spec = importlib.util.spec_from_file_location(module_name, MODULE_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError("Không tải được tools/release_readiness.py")
module = importlib.util.module_from_spec(spec)
sys.modules[module_name] = module
spec.loader.exec_module(module)

source = json.loads(DATA_PATH.read_text(encoding="utf-8"))
pending_manual = json.loads(MANUAL_PATH.read_text(encoding="utf-8"))
report = module.build_report(source, pending_manual)

assert set(report["events"]) == {"bride", "groom", "nhatrang", "saigon"}
assert report["summary"]["events"] == 4
assert report["automatedReady"] is True
assert report["manualReady"] is False
assert report["guestReady"] is False
assert report["summary"]["manualChecks"] == len(module.MANUAL_CHECK_LABELS)
assert all(item["severity"] in {"blocker", "warning"} for item in report["findings"])

markdown = module.render_markdown(report)
assert "`bride`" in markdown
assert "`saigon`" in markdown
assert "**Automated:** `PASS`" in markdown
assert "**Manual:** `PENDING`" in markdown
assert "`NOT GUEST READY`" in markdown

approved_manual = {
    "schemaVersion": 1,
    "approved": True,
    "approvedBy": "release-owner",
    "approvedAt": "2026-07-27T21:00:00+07:00",
    "checks": {key: True for key in module.MANUAL_CHECK_LABELS},
    "notes": "Test fixture",
}
approved_report = module.build_report(source, approved_manual)
assert approved_report["automatedReady"] is True
assert approved_report["manualReady"] is True
assert approved_report["guestReady"] is True
assert "`GUEST READY`" in module.render_markdown(approved_report)

# Dữ liệu cố tình hỏng phải chặn automated readiness ngay cả khi bằng chứng thủ
# công được đánh dấu hoàn tất.
broken = copy.deepcopy(source)
broken_event = broken["events"]["saigon"]
broken_event["status"] = "draft"
broken_event["mapsVerified"] = False
broken_event["addressLine2"] = "Địa chỉ cụ thể sẽ cập nhật"
broken["rsvpForm"] = {"enabled": False, "apiUrl": ""}
for event in broken["events"].values():
    event["rsvp"] = {**event.get("rsvp", {}), "enabled": False, "url": ""}

broken_report = module.build_report(broken, approved_manual)
assert broken_report["automatedReady"] is False
assert broken_report["manualReady"] is True
assert broken_report["guestReady"] is False
codes = {item["code"] for item in broken_report["findings"]}
assert "rsvp-not-configured" in codes
assert "event-still-draft" in codes
assert "map-unverified" in codes
assert "placeholder-addressLine2" in codes

# Biểu mẫu trên thiệp là một cách xác nhận hợp lệ, dù Google Form đa sự kiện tắt.
inline_only = copy.deepcopy(broken)
inline_only["rsvpForm"] = {
    "enabled": True,
    "apiUrl": "https://script.google.com/macros/s/X/exec",
}
assert "rsvp-not-configured" not in {
    item["code"] for item in module.build_report(inline_only, approved_manual)["findings"]
}

with tempfile.TemporaryDirectory() as temp_dir:
    temp = Path(temp_dir)
    json_path = temp / "readiness.json"
    markdown_path = temp / "readiness.md"

    normal = subprocess.run(
        [
            sys.executable,
            str(MODULE_PATH),
            "--data",
            str(DATA_PATH),
            "--manual-evidence",
            str(MANUAL_PATH),
            "--json",
            str(json_path),
            "--markdown",
            str(markdown_path),
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=False,
    )
    assert normal.returncode == 0, normal.stderr or normal.stdout
    cli_report = json.loads(json_path.read_text(encoding="utf-8"))
    assert cli_report["automatedReady"] is True
    assert cli_report["manualReady"] is False
    assert cli_report["guestReady"] is False

    broken_path = temp / "broken.json"
    broken_path.write_text(json.dumps(broken, ensure_ascii=False), encoding="utf-8")
    approved_path = temp / "approved-manual.json"
    approved_path.write_text(
        json.dumps(approved_manual, ensure_ascii=False), encoding="utf-8"
    )

    strict_broken = subprocess.run(
        [
            sys.executable,
            str(MODULE_PATH),
            "--data",
            str(broken_path),
            "--manual-evidence",
            str(approved_path),
            "--strict",
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=False,
    )
    assert strict_broken.returncode == 1, strict_broken.stderr or strict_broken.stdout

    # Source tự động xanh nhưng manual evidence mặc định chưa duyệt: strict phải
    # fail closed, không được tự tuyên bố guest-ready.
    strict_pending = subprocess.run(
        [
            sys.executable,
            str(MODULE_PATH),
            "--data",
            str(DATA_PATH),
            "--manual-evidence",
            str(MANUAL_PATH),
            "--strict",
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=False,
    )
    assert strict_pending.returncode == 1, strict_pending.stderr or strict_pending.stdout

    strict_approved = subprocess.run(
        [
            sys.executable,
            str(MODULE_PATH),
            "--data",
            str(DATA_PATH),
            "--manual-evidence",
            str(approved_path),
            "--strict",
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=False,
    )
    assert strict_approved.returncode == 0, strict_approved.stderr or strict_approved.stdout

print(
    "PASS: release readiness separates automated evidence, manual approval and "
    "the final guest-ready verdict"
)

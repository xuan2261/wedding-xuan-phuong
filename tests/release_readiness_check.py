#!/usr/bin/env python3
"""Contract test for the release-readiness auditor."""

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

# ``release_readiness.py`` defines a dataclass.  The dataclasses module resolves
# postponed annotations through ``sys.modules[cls.__module__]`` while the class
# decorator runs.  Register the dynamically loaded module before exec_module;
# otherwise Python 3.12+ raises AttributeError during @dataclass processing.
module_name = "wedding_release_readiness"
spec = importlib.util.spec_from_file_location(module_name, MODULE_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError("Không tải được tools/release_readiness.py")
module = importlib.util.module_from_spec(spec)
sys.modules[module_name] = module
spec.loader.exec_module(module)

source = json.loads(DATA_PATH.read_text(encoding="utf-8"))
report = module.build_report(source)

assert set(report["events"]) == {"bride", "groom", "nhatrang", "saigon"}
assert report["summary"]["events"] == 4
assert isinstance(report["guestReady"], bool)
assert all(item["severity"] in {"blocker", "warning"} for item in report["findings"])

markdown = module.render_markdown(report)
assert "`bride`" in markdown
assert "`saigon`" in markdown

# Trước đây phần này khẳng định dữ liệu thật CHƯA sẵn sàng, nên khi gia đình bổ
# sung xong địa điểm thì test đổ — nó khoá trạng thái dở dang chứ không kiểm
# công cụ. Nay dùng một bản dữ liệu cố tình hỏng để chứng minh công cụ vẫn phát
# hiện đúng và vẫn báo chặn, độc lập với việc dự án đã sẵn sàng hay chưa.
broken = copy.deepcopy(source)
broken_event = broken["events"]["saigon"]
broken_event["status"] = "draft"
broken_event["mapsVerified"] = False
broken_event["addressLine2"] = "Địa chỉ cụ thể sẽ cập nhật"
broken["rsvpForm"] = {"enabled": False, "apiUrl": ""}
for event in broken["events"].values():
    event["rsvp"] = {**event.get("rsvp", {}), "enabled": False, "url": ""}

broken_report = module.build_report(broken)
assert broken_report["guestReady"] is False
codes = {item["code"] for item in broken_report["findings"]}
assert "rsvp-not-configured" in codes
assert "event-still-draft" in codes
assert "map-unverified" in codes
assert "placeholder-addressLine2" in codes
assert "NOT GUEST READY" in module.render_markdown(broken_report)

# Biểu mẫu trên thiệp phải được tính là một cách xác nhận hợp lệ, dù Google Form
# đa sự kiện vẫn tắt.
inline_only = copy.deepcopy(broken)
inline_only["rsvpForm"] = {"enabled": True, "apiUrl": "https://script.google.com/macros/s/X/exec"}
assert "rsvp-not-configured" not in {
    item["code"] for item in module.build_report(inline_only)["findings"]
}

# Exercise the real CLI as well as the imported API.  Non-strict mode must
# produce both evidence files and exit successfully; strict mode must fail
# closed while known guest-release blockers remain.
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
    assert json_path.is_file()
    assert markdown_path.is_file()
    cli_report = json.loads(json_path.read_text(encoding="utf-8"))
    assert cli_report["summary"] == report["summary"]

    # Chế độ strict phải báo chặn khi còn blocker. Chạy trên bản dữ liệu cố tình
    # hỏng để tính chất "fail closed" được chứng minh kể cả khi dữ liệu thật đã
    # sẵn sàng.
    broken_path = temp / "broken.json"
    broken_path.write_text(json.dumps(broken, ensure_ascii=False), encoding="utf-8")
    strict = subprocess.run(
        [sys.executable, str(MODULE_PATH), "--data", str(broken_path), "--strict"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=False,
    )
    assert strict.returncode == 1, strict.stderr or strict.stdout

    # Và phải cho qua khi dữ liệu thật không còn blocker.
    strict_real = subprocess.run(
        [sys.executable, str(MODULE_PATH), "--data", str(DATA_PATH), "--strict"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=False,
    )
    assert strict_real.returncode == (0 if report["guestReady"] else 1)

print(
    "PASS: release readiness auditor detects four events, imports safely, and "
    "fails closed in strict mode "
    f"({report['summary']['blockers']} blockers, {report['summary']['warnings']} warnings)"
)

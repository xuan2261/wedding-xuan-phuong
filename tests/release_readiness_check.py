#!/usr/bin/env python3
"""Contract test for the release-readiness auditor."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "tools" / "release_readiness.py"
DATA_PATH = ROOT / "tools" / "wedding-data.json"

spec = importlib.util.spec_from_file_location("release_readiness", MODULE_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError("Không tải được tools/release_readiness.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

source = json.loads(DATA_PATH.read_text(encoding="utf-8"))
report = module.build_report(source)

assert set(report["events"]) == {"bride", "groom", "nhatrang", "saigon"}
assert report["summary"]["events"] == 4
assert isinstance(report["guestReady"], bool)
assert all(item["severity"] in {"blocker", "warning"} for item in report["findings"])

# The current source intentionally has known external-data blockers. This gate
# prevents a future tool regression from incorrectly declaring it guest-ready.
assert report["guestReady"] is False
assert any(item["code"] == "rsvp-not-configured" for item in report["findings"])
assert any(item["code"] == "event-still-draft" for item in report["findings"])
assert any(item["code"] == "map-unverified" for item in report["findings"])

markdown = module.render_markdown(report)
assert "NOT GUEST READY" in markdown
assert "`bride`" in markdown
assert "`saigon`" in markdown

print(
    "PASS: release readiness auditor detects four events and current external blockers "
    f"({report['summary']['blockers']} blockers, {report['summary']['warnings']} warnings)"
)

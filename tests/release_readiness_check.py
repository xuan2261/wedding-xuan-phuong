#!/usr/bin/env python3
"""Contract test for the release-readiness auditor."""

from __future__ import annotations

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

    strict = subprocess.run(
        [sys.executable, str(MODULE_PATH), "--data", str(DATA_PATH), "--strict"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=False,
    )
    assert strict.returncode == 1, strict.stderr or strict.stdout

print(
    "PASS: release readiness auditor detects four events, imports safely, and "
    "fails closed in strict mode "
    f"({report['summary']['blockers']} blockers, {report['summary']['warnings']} warnings)"
)

#!/usr/bin/env python3
"""Regression checks for the v20.3.1 CI reliability fixes."""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
cleanup = (ROOT / ".github/workflows/cleanup-merged-branches.yml").read_text(
    encoding="utf-8"
)
verify = (ROOT / ".github/workflows/verify-pages.yml").read_text(encoding="utf-8")
package = (ROOT / "package.json").read_text(encoding="utf-8")
errors: list[str] = []


def require(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


require(
    "Delete merged head branch if it still exists" in cleanup,
    "cleanup PR chưa biểu đạt hành vi idempotent",
)
require(
    cleanup.count("delete_branch_if_present") >= 4,
    "cleanup chưa dùng helper idempotent cho cả PR và historical branches",
)
require(
    "Reference does not exist" in cleanup and "HTTP 422" in cleanup,
    "cleanup chưa xử lý race/already-deleted ref",
)
require(
    'npm run test:browser-all 2>&1 | tee reports/browser-all-ci.log' in verify,
    "workflow PR chưa chạy browser suite canonical",
)
require(
    "npm run test:map-events" not in verify,
    "workflow không nên tự liệt kê map test ngoài package.json",
)
require(
    "python tests/ci_reliability_check.py" in package,
    "package.json chưa đưa reliability regression vào test:static",
)

if errors:
    print("FAIL")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("PASS: branch cleanup is idempotent and PR CI runs the canonical browser suite")

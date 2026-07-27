#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Build identifiers are release contracts in several independent tests. Keep all
# executable test expectations synchronized while leaving historical reports and
# changelog entries untouched.
for path in (ROOT / "tests").rglob("*"):
    if not path.is_file() or path.suffix.lower() not in {".py", ".js", ".mjs"}:
        continue
    text = path.read_text(encoding="utf-8")
    updated = (
        text
        .replace("v20.2-20260726", "v20.3-20260727")
        .replace('EXPECTED_RELEASE = "v20.2"', 'EXPECTED_RELEASE = "v20.3"')
        .replace('EXPECTED_PACKAGE = "20.2.0"', 'EXPECTED_PACKAGE = "20.3.0"')
        .replace("PASS: v20.2 build metadata", "PASS: v20.3 build metadata")
    )
    if updated != text:
        path.write_text(updated, encoding="utf-8")

readme_path = ROOT / "README.md"
readme = readme_path.read_text(encoding="utf-8")
readme = readme.replace("v20.2-20260726", "v20.3-20260727")
readme = readme.replace("Build hiện tại: `v20.2`", "Build hiện tại: `v20.3`")
readme_path.write_text(readme, encoding="utf-8")

print("PASS: synchronized all v20.3 executable metadata contracts")

#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

metadata_path = ROOT / "tests/build_metadata_check.py"
metadata = metadata_path.read_text(encoding="utf-8")
metadata = metadata.replace('EXPECTED_BUILD = "v20.2-20260726"', 'EXPECTED_BUILD = "v20.3-20260727"')
metadata = metadata.replace('EXPECTED_RELEASE = "v20.2"', 'EXPECTED_RELEASE = "v20.3"')
metadata = metadata.replace('EXPECTED_PACKAGE = "20.2.0"', 'EXPECTED_PACKAGE = "20.3.0"')
metadata = metadata.replace('print("PASS: v20.2 build metadata, deploy contract and wording consistency")', 'print("PASS: v20.3 build metadata, deploy contract and wording consistency")')
metadata_path.write_text(metadata, encoding="utf-8")

readme_path = ROOT / "README.md"
readme = readme_path.read_text(encoding="utf-8")
readme = readme.replace("v20.2-20260726", "v20.3-20260727")
readme = readme.replace("v20.2", "v20.3")
readme_path.write_text(readme, encoding="utf-8")

print("PASS: synchronized v20.3 metadata expectations")

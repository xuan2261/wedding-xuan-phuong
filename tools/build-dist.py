#!/usr/bin/env python3
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
if DIST.exists():
    shutil.rmtree(DIST)
DIST.mkdir()

for name in ["index.html", "styles.css", "config.js", "guest-utils.js", "app.js", "robots.txt", ".nojekyll"]:
    shutil.copy2(ROOT / name, DIST / name)

def ignore_runtime_noise(directory, names):
    ignored = set()
    for name in names:
        lower = name.lower()
        if lower.startswith("readme"):
            ignored.add(name)
        elif lower.endswith(".svg") and Path(directory).name == "qr":
            ignored.add(name)
        elif lower.startswith("google-forms-header"):
            ignored.add(name)
    return ignored

shutil.copytree(ROOT / "assets", DIST / "assets", ignore=ignore_runtime_noise)
print("PASS: rebuilt optimized clean dist")

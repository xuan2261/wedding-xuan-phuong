from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_BUILD = "v20.2-20260726"
EXPECTED_RELEASE = "v20.2"
EXPECTED_PACKAGE = "20.2.0"
errors = []


def require(value, message):
    if not value:
        errors.append(message)


build = json.loads((ROOT / "BUILD.json").read_text(encoding="utf-8"))
data = json.loads((ROOT / "tools/wedding-data.json").read_text(encoding="utf-8"))
package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
lock = json.loads((ROOT / "package-lock.json").read_text(encoding="utf-8"))
index = (ROOT / "index.html").read_text(encoding="utf-8")
config = (ROOT / "config.js").read_text(encoding="utf-8")
app = (ROOT / "app.js").read_text(encoding="utf-8")
backend = (ROOT / "tools/wedding-wishes-webapp.gs").read_text(encoding="utf-8")
readme = (ROOT / "README.md").read_text(encoding="utf-8")
verify_pages = (ROOT / ".github/workflows/verify-pages.yml").read_text(encoding="utf-8")

require(build["buildId"] == EXPECTED_BUILD, "BUILD.json sai build")
require(build["release"] == EXPECTED_RELEASE, "BUILD.json sai release")
require(data["build"]["buildId"] == EXPECTED_BUILD, "wedding-data sai build")
require(package["version"] == EXPECTED_PACKAGE, "package.json sai version")
require(lock["version"] == EXPECTED_PACKAGE, "package-lock root sai version")
require(lock["packages"][""]["version"] == EXPECTED_PACKAGE, "package-lock package sai version")
require(EXPECTED_BUILD in index and EXPECTED_BUILD in config, "runtime thiếu build marker")
require(EXPECTED_BUILD in readme, "README sai build")
require("v19.4-20260724" not in verify_pages, "workflow deploy còn hard-code v19.4")
require('json.load(open("BUILD.json"' in verify_pages, "workflow deploy chưa đọc build động")
require("Quý vị" not in backend, "backend còn wording Quý vị")
require("wedding-cover-opened-v20-2" in app, "session key cover chưa version hóa")
require('id="rsvpButton"' in index, "thiếu nút RSVP")
rsvp_at = index.index('id="rsvpButton"')
rsvp_fragment = index[max(0, rsvp_at - 180):rsvp_at + 240]
require('target="_blank"' not in rsvp_fragment, "tel RSVP không được mở tab trắng")
require('id="coverSimpleButton"' not in index, "nút simple mode quay lại DOM")
require('class="invitation-cover__seam"' not in index, "đường seam quay lại DOM")

if errors:
    print("FAIL")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("PASS: v20.2 build metadata, deploy contract and wording consistency")

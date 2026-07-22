from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "tools" / "wedding-data.json").read_text(encoding="utf-8"))
errors = []

def require(condition, message):
    if not condition:
        errors.append(message)

config = (ROOT / "config.js").read_text(encoding="utf-8")
index = (ROOT / "index.html").read_text(encoding="utf-8")
create_form = (ROOT / "tools" / "create-google-forms-rsvp.gs").read_text(encoding="utf-8")
update_form = (ROOT / "tools" / "update-google-forms-rsvp-contact.gs").read_text(encoding="utf-8")
build = json.loads((ROOT / "BUILD.json").read_text(encoding="utf-8"))

event = DATA["event"]
rsvp = DATA["rsvp"]
release = DATA["build"]

for text, label in [(config, "config.js"), (create_form, "create form"), (update_form, "update form")]:
    require(event["guestTime"] in text, f"{label} lệch guestTime")
    require(event["ceremonyTime"] in text, f"{label} lệch ceremonyTime")

for text, label in [(create_form, "create form"), (update_form, "update form")]:
    require(event["address"] in text, f"{label} lệch address")
    require(rsvp["deadlineSlash"] in text, f"{label} lệch RSVP deadline")

require(rsvp["deadlineDisplay"] in config, "config lệch deadline display")
require(
    f'data-rsvp-deadline>{rsvp["deadlineDisplay"]}</strong>' in index,
    "HTML fallback lệch deadline",
)
require(release["buildId"] in index, "HTML lệch build ID")
require(build.get("buildId") == release["buildId"], "BUILD.json lệch build ID")
require(build.get("backendVersion") == release["backendVersion"], "BUILD.json lệch backend version")
require("appsScriptBackendVersion" not in build, "BUILD.json còn version backend trùng")

if errors:
    print("FAIL")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("PASS: wedding data consistency")

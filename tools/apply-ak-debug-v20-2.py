#!/usr/bin/env python3
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
BUILD_ID = "v20.2-20260726"
RELEASE = "v20.2"
PACKAGE_VERSION = "20.2.0"
STATUS = "ak-debug-full-audit-and-deploy-hardening"


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, text: str) -> None:
    (ROOT / path).write_text(text, encoding="utf-8", newline="\n")


def replace(path: str, old: str, new: str, *, required: bool = True) -> None:
    text = read(path)
    if required and old not in text:
        raise SystemExit(f"missing expected text in {path}: {old!r}")
    write(path, text.replace(old, new))


build_path = ROOT / "BUILD.json"
build = json.loads(build_path.read_text(encoding="utf-8"))
build.update(
    {
        "buildId": BUILD_ID,
        "release": RELEASE,
        "generatedAtUtc": "2026-07-26T09:20:00+00:00",
        "status": STATUS,
    }
)
build["knownBlockers"] = [
    item.replace("v20.1", RELEASE).replace("v19.4", RELEASE)
    for item in build.get("knownBlockers", [])
]
build_path.write_text(
    json.dumps(build, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)

data_path = ROOT / "tools/wedding-data.json"
data = json.loads(data_path.read_text(encoding="utf-8"))
data["build"].update(
    {
        "buildId": BUILD_ID,
        "release": RELEASE,
        "status": STATUS,
    }
)
data_path.write_text(
    json.dumps(data, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)

package_path = ROOT / "package.json"
package = json.loads(package_path.read_text(encoding="utf-8"))
package["version"] = PACKAGE_VERSION
test_cmd = package["scripts"]["test"]
if "tests/build_metadata_check.py" not in test_cmd:
    test_cmd = test_cmd.replace(
        "python tests/consistency_check.py &&",
        "python tests/consistency_check.py && python tests/build_metadata_check.py &&",
    )
if "tests/visual_safe_zone_browser.mjs" not in test_cmd:
    test_cmd += " && node tests/visual_safe_zone_browser.mjs"
package["scripts"]["test"] = test_cmd
package["scripts"]["test:metadata"] = "python tests/build_metadata_check.py"
package["scripts"]["test:visual-safe-zones"] = (
    "node tests/visual_safe_zone_browser.mjs"
)
package_path.write_text(
    json.dumps(package, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)

lock_path = ROOT / "package-lock.json"
lock = json.loads(lock_path.read_text(encoding="utf-8"))
lock["version"] = PACKAGE_VERSION
lock["packages"][""]["version"] = PACKAGE_VERSION
lock_path.write_text(
    json.dumps(lock, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)

for path in [
    "index.html",
    "config.js",
    "tests/consistency_check.py",
    "tests/verify_release.py",
    "tests/verify_dist.py",
    "tests/browser_smoke.mjs",
    "tests/share_entry_pages_check.py",
]:
    write(path, read(path).replace("v20.1-20260726", BUILD_ID))

config = read("config.js")
config = config.replace(
    "CẤU HÌNH THIỆP CƯỚI ĐA SỰ KIỆN — v19",
    f"CẤU HÌNH THIỆP CƯỚI ĐA SỰ KIỆN — {RELEASE}",
)
config = config.replace('release: "v20.1"', f'release: "{RELEASE}"')
config = config.replace(
    'status: "visual-safe-zones-and-cover-refinement"',
    f'status: "{STATUS}"',
)
write("config.js", config)

index = read("index.html")
index = index.replace("styles.css?v=5.6", "styles.css?v=5.7")
index = index.replace("config.js?v=5.6", "config.js?v=5.7")
index = index.replace("app.js?v=5.6", "app.js?v=5.7")
index = index.replace(
    '          target="_blank"\n          rel="noopener noreferrer"\n',
    "",
)
index = index.replace(
    '\n<div class="invitation-cover__content">',
    '\n      <div class="invitation-cover__content">',
)
index = index.replace(
    '          </button>\n</div>\n\n        <label class="invitation-cover__autoplay">',
    '          </button>\n        </div>\n\n        <label class="invitation-cover__autoplay">',
)
write("index.html", index)

write(
    "app.js",
    read("app.js").replace(
        "wedding-cover-opened-v19",
        "wedding-cover-opened-v20-2",
    ),
)

backend = read("tools/wedding-wishes-webapp.gs")
backend = backend.replace("Quý vị", "Quý khách")
backend = backend.replace("(release v17)", f"(release {RELEASE})")
write("tools/wedding-wishes-webapp.gs", backend)

workflow_path = ROOT / ".github/workflows/verify-pages.yml"
workflow = workflow_path.read_text(encoding="utf-8")
workflow = workflow.replace(
    "reports/RELEASE-READINESS-V19.4.json",
    "reports/RELEASE-READINESS.json",
)
workflow = workflow.replace(
    "reports/RELEASE-READINESS-V19.4.md",
    "reports/RELEASE-READINESS.md",
)
workflow = workflow.replace("          EXPECTED_BUILD: v19.4-20260724\n", "")
workflow = workflow.replace(
    "          python tools/verify_live_pages.py \\\n",
    "          EXPECTED_BUILD=\"$(python -c 'import json; print(json.load(open(\"BUILD.json\", encoding=\"utf-8\"))[\"buildId\"])')\"\n"
    "          python tools/verify_live_pages.py \\\n",
)
workflow = workflow.replace(
    "          npm run test:browser 2>&1 | tee reports/browser-smoke-ci.log\n",
    "          npm run test:browser 2>&1 | tee reports/browser-smoke-ci.log\n"
    "          npm run test:visual-safe-zones\n",
)
visual_upload = """      - name: Upload visual safe-zone evidence
        if: always() && github.event_name == 'pull_request'
        uses: actions/upload-artifact@v7
        with:
          name: wedding-visual-safe-zones
          path: reports/visual-safe-zone-*.png
          if-no-files-found: error
          retention-days: 7
"""
marker = "      - name: Audio/story browser regression\n"
if visual_upload not in workflow:
    workflow = workflow.replace(marker, visual_upload + marker)
if "python tests/build_metadata_check.py" not in workflow:
    workflow = workflow.replace(
        "          python tests/consistency_check.py\n",
        "          python tests/consistency_check.py\n"
        "          python tests/build_metadata_check.py\n",
    )
workflow_path.write_text(workflow, encoding="utf-8", newline="\n")

guest_workflow_path = ROOT / ".github/workflows/guest-release.yml"
guest_workflow = guest_workflow_path.read_text(encoding="utf-8")
if "python tests/build_metadata_check.py" not in guest_workflow:
    guest_workflow = guest_workflow.replace(
        "          python tests/consistency_check.py\n",
        "          python tests/consistency_check.py\n"
        "          python tests/build_metadata_check.py\n",
    )
if "npm run test:visual-safe-zones" not in guest_workflow:
    guest_workflow = guest_workflow.replace(
        "          npm run test:browser\n",
        "          npm run test:browser\n"
        "          npm run test:visual-safe-zones\n",
    )
guest_workflow_path.write_text(
    guest_workflow,
    encoding="utf-8",
    newline="\n",
)

hardening = read("tests/release_hardening_check.mjs")
hardening = hardening.replace(
    "FAIL: v19.4 release hardening",
    f"FAIL: {RELEASE} release hardening",
)
hardening = hardening.replace(
    "PASS: v19.4 adaptive, contact and focus hardening",
    f"PASS: {RELEASE} adaptive, contact and focus hardening",
)
write("tests/release_hardening_check.mjs", hardening)

readme = read("README.md")
readme = readme.replace(
    "# Wedding Xuân & Phượng — v19 Multi-Event Journey",
    f"# Wedding Xuân & Phượng — {RELEASE} Multi-Event Journey",
)
readme = re.sub(
    r"Build hiện tại: \*\*[^*]+\*\*[^\n]*",
    f"Build hiện tại: **{BUILD_ID}** — AK-DEBUG Full Audit & Deploy Hardening.",
    readme,
    count=1,
)
readme = readme.replace("## Nâng cấp v19.4", f"## Nâng cấp {RELEASE}")
readme = readme.replace("## Trải nghiệm mở thiệp v19.2", "## Trải nghiệm mở thiệp")
readme = readme.replace("## Hardening v19.4", f"## Hardening {RELEASE}")
if "python tests/build_metadata_check.py" not in readme:
    readme = readme.replace(
        "python tests/consistency_check.py\n",
        "python tests/consistency_check.py\n"
        "python tests/build_metadata_check.py\n",
    )
if "npm run test:visual-safe-zones" not in readme:
    readme = readme.replace(
        "npm run test:browser\n",
        "npm run test:browser\n"
        "npm run test:visual-safe-zones\n",
    )
write("README.md", readme)

print(f"PASS: applied deterministic {BUILD_ID} AK-debug hardening")

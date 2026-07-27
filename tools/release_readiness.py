#!/usr/bin/env python3
"""Audit guest-release readiness for the multi-event wedding website.

This tool intentionally separates source correctness from live guest readiness.
It reads tools/wedding-data.json, verifies required event fields and reports
which external information still blocks a final guest release.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA = ROOT / "tools" / "wedding-data.json"
EVENT_IDS = ("bride", "groom", "nhatrang", "saigon")
PLACEHOLDER_PATTERNS = (
    r"\bxxx\b",
    r"sẽ cập nhật",
    r"chờ xác nhận",
    r"địa chỉ cụ thể",
    r"nhà hàng nha trang$",
    r"^sài gòn$",
)


@dataclass
class Finding:
    event_id: str
    severity: str
    code: str
    message: str


def text(value: Any) -> str:
    return str(value or "").strip()


def is_placeholder(value: Any) -> bool:
    candidate = text(value).lower()
    return any(re.search(pattern, candidate, flags=re.I) for pattern in PLACEHOLDER_PATTERNS)


def require(findings: list[Finding], event_id: str, code: str, value: Any, message: str) -> None:
    if not text(value):
        findings.append(Finding(event_id, "blocker", code, message))


def audit_event(event_id: str, event: dict[str, Any], inline_form: dict[str, Any]) -> list[Finding]:
    findings: list[Finding] = []

    require(findings, event_id, "missing-title", event.get("title"), "Thiếu tên sự kiện.")
    require(findings, event_id, "missing-date", event.get("dateDisplay"), "Thiếu ngày hiển thị.")
    require(findings, event_id, "missing-datetime", event.get("isoDateTime"), "Thiếu thời điểm ISO.")
    require(findings, event_id, "missing-venue", event.get("venueName"), "Thiếu tên địa điểm.")
    require(findings, event_id, "missing-address", event.get("address"), "Thiếu địa chỉ đầy đủ.")

    timeline = event.get("timeline")
    if not isinstance(timeline, list) or not timeline:
        findings.append(Finding(event_id, "blocker", "missing-timeline", "Thiếu timeline sự kiện."))

    for field in ("venueName", "addressLine1", "addressLine2", "address"):
        if is_placeholder(event.get(field)):
            findings.append(
                Finding(event_id, "blocker", f"placeholder-{field}", f"{field} vẫn là dữ liệu tạm: {text(event.get(field))}")
            )

    if not event.get("mapsVerified"):
        findings.append(Finding(event_id, "blocker", "map-unverified", "Điểm ghim Google Maps chưa được xác minh."))
    if not text(event.get("mapsUrl")):
        findings.append(Finding(event_id, "blocker", "map-url-missing", "Thiếu link Google Maps."))
    if not text(event.get("mapEmbedUrl")):
        findings.append(Finding(event_id, "warning", "map-embed-missing", "Thiếu URL nhúng bản đồ; popup Maps sẽ không hoạt động."))

    rsvp = event.get("rsvp") if isinstance(event.get("rsvp"), dict) else {}
    # Biểu mẫu trên thiệp gửi thẳng vào Google Sheet là đường chính hiện nay;
    # Google Form đa sự kiện chỉ còn là phương án dự phòng. Chỉ báo thiếu khi cả
    # hai đều chưa có, nếu không công cụ sẽ báo chặn cho thứ đã chạy thật.
    inline_ready = bool(inline_form.get("enabled") and text(inline_form.get("apiUrl")))
    legacy_ready = bool(rsvp.get("enabled") and text(rsvp.get("url")))
    if not (inline_ready or legacy_ready):
        findings.append(Finding(event_id, "blocker", "rsvp-not-configured", "Chưa có cách xác nhận tham dự trực tuyến; đang dùng liên hệ điện thoại."))
    if not text(rsvp.get("deadlineDisplay")):
        findings.append(Finding(event_id, "warning", "rsvp-deadline-missing", "Chưa chốt hạn RSVP."))

    lifecycle = event.get("lifecycle") if isinstance(event.get("lifecycle"), dict) else {}
    if not text(lifecycle.get("rsvpClosesAt")):
        findings.append(Finding(event_id, "warning", "rsvp-close-missing", "Chưa có thời điểm tự đóng RSVP."))

    calendar = event.get("calendar") if isinstance(event.get("calendar"), dict) else {}
    calendar_file = text(calendar.get("file"))
    if calendar.get("enabled") and calendar_file and not (ROOT / calendar_file).is_file():
        findings.append(Finding(event_id, "blocker", "calendar-file-missing", f"Không tìm thấy file lịch: {calendar_file}"))

    status = text(event.get("status"))
    if status == "draft":
        findings.append(Finding(event_id, "blocker", "event-still-draft", "Sự kiện vẫn ở trạng thái draft."))
    elif status and status != "confirmed":
        findings.append(Finding(event_id, "warning", "event-partial", f"Trạng thái hiện tại: {status}."))

    return findings


def build_report(data: dict[str, Any]) -> dict[str, Any]:
    events = data.get("events") if isinstance(data.get("events"), dict) else {}
    # Biểu mẫu xác nhận trên thiệp khai báo một lần ở cấp trên, dùng chung cho
    # cả bốn sự kiện, nên phải đọc ở đây rồi truyền xuống từng sự kiện.
    inline_form = data.get("rsvpForm") if isinstance(data.get("rsvpForm"), dict) else {}
    findings: list[Finding] = []

    for event_id in EVENT_IDS:
        event = events.get(event_id)
        if not isinstance(event, dict):
            findings.append(Finding(event_id, "blocker", "event-missing", "Không tìm thấy cấu hình sự kiện."))
            continue
        findings.extend(audit_event(event_id, event, inline_form))

    blockers = [item for item in findings if item.severity == "blocker"]
    warnings = [item for item in findings if item.severity == "warning"]
    event_summary = {}
    for event_id in EVENT_IDS:
        event_findings = [item for item in findings if item.event_id == event_id]
        event_summary[event_id] = {
            "ready": not any(item.severity == "blocker" for item in event_findings),
            "blockers": sum(item.severity == "blocker" for item in event_findings),
            "warnings": sum(item.severity == "warning" for item in event_findings),
        }

    return {
        "build": data.get("build", {}),
        "guestReady": not blockers,
        "summary": {
            "events": len(EVENT_IDS),
            "blockers": len(blockers),
            "warnings": len(warnings),
        },
        "events": event_summary,
        "findings": [asdict(item) for item in findings],
    }


def render_markdown(report: dict[str, Any]) -> str:
    build_id = text(report.get("build", {}).get("buildId")) or "unknown"
    verdict = "GUEST READY" if report["guestReady"] else "NOT GUEST READY"
    lines = [
        "# Wedding release readiness",
        "",
        f"**Build:** `{build_id}`  ",
        f"**Verdict:** `{verdict}`",
        "",
        "## Event summary",
        "",
        "| Event | Ready | Blockers | Warnings |",
        "|---|---:|---:|---:|",
    ]
    for event_id, summary in report["events"].items():
        lines.append(
            f"| `{event_id}` | {'YES' if summary['ready'] else 'NO'} | {summary['blockers']} | {summary['warnings']} |"
        )

    lines.extend(["", "## Findings", ""])
    if not report["findings"]:
        lines.append("Không còn finding.")
    else:
        for item in report["findings"]:
            lines.append(
                f"- **{item['severity'].upper()} · {item['event_id']} · {item['code']}** — {item['message']}"
            )

    lines.extend(
        [
            "",
            "## Release rule",
            "",
            "Source tests có thể PASS nhưng chỉ được gửi khách khi `guestReady=true`, "
            "Google Form/Maps đã kiểm tra live và hoàn thành kiểm thử thiết bị thật.",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    # Báo cáo chứa tiếng Việt có dấu. Console Windows mặc định là cp1252 nên
    # print() sẽ ném UnicodeEncodeError, trong khi CI Linux chạy UTF-8 vẫn xanh.
    # Ép UTF-8 cho stdout để cùng một lệnh chạy được ở cả hai nơi.
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA)
    parser.add_argument("--json", type=Path)
    parser.add_argument("--markdown", type=Path)
    parser.add_argument("--strict", action="store_true", help="Exit 1 when blockers remain.")
    args = parser.parse_args()

    data = json.loads(args.data.read_text(encoding="utf-8"))
    report = build_report(data)

    if args.json:
        args.json.parent.mkdir(parents=True, exist_ok=True)
        args.json.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if args.markdown:
        args.markdown.parent.mkdir(parents=True, exist_ok=True)
        args.markdown.write_text(render_markdown(report), encoding="utf-8")

    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 1 if args.strict and not report["guestReady"] else 0


if __name__ == "__main__":
    sys.exit(main())

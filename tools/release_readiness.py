#!/usr/bin/env python3
"""Audit automated and manual guest-release readiness for the wedding site.

Automated checks validate repository data and generated assets. Manual evidence
records live-service, physical-device and privacy decisions that source code
cannot prove. A release is guest-ready only when both layers pass.
"""

from __future__ import annotations

import argparse
from dataclasses import asdict, dataclass
import json
from pathlib import Path
import re
import sys
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA = ROOT / "tools" / "wedding-data.json"
DEFAULT_MANUAL_EVIDENCE = ROOT / "tools" / "guest-release-manual.json"
EVENT_IDS = ("bride", "groom", "nhatrang", "saigon")
PLACEHOLDER_PATTERNS = (
    r"\bxxx\b",
    r"sẽ cập nhật",
    r"chờ xác nhận",
    r"địa chỉ cụ thể",
    r"nhà hàng nha trang$",
    r"^sài gòn$",
)
MANUAL_CHECK_LABELS = {
    "livePagesVerified": "GitHub Pages và bốn trang sự kiện đã được xác minh live",
    "androidChrome": "Android Chrome thực tế",
    "iphoneSafari": "iPhone Safari thực tế",
    "zaloInApp": "Trình duyệt trong Zalo",
    "messengerInApp": "Trình duyệt trong Messenger/Facebook",
    "openingMusicAutoStory": "Mở thiệp, nhạc và auto-story/pause-resume",
    "mapsCalendarQr": "Maps, gọi điện, lịch ICS và QR tải theo yêu cầu",
    "rsvpLiveE2E": "RSVP live: gửi, lưu Sheet và sửa phản hồi",
    "wishesLiveE2E": "Lời chúc live: pending, duyệt và hiển thị",
    "privacyAccepted": "Đã chấp nhận quyết định riêng tư về QR/STK công khai",
}


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
                Finding(
                    event_id,
                    "blocker",
                    f"placeholder-{field}",
                    f"{field} vẫn là dữ liệu tạm: {text(event.get(field))}",
                )
            )

    if not event.get("mapsVerified"):
        findings.append(Finding(event_id, "blocker", "map-unverified", "Điểm ghim Google Maps chưa được xác minh."))
    if not text(event.get("mapsUrl")):
        findings.append(Finding(event_id, "blocker", "map-url-missing", "Thiếu link Google Maps."))
    if not text(event.get("mapEmbedUrl")):
        findings.append(Finding(event_id, "warning", "map-embed-missing", "Thiếu URL nhúng bản đồ; popup Maps sẽ không hoạt động."))

    rsvp = event.get("rsvp") if isinstance(event.get("rsvp"), dict) else {}
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


def load_manual_evidence(path: Path) -> dict[str, Any]:
    if not path.is_file():
        return {"_error": f"Không tìm thấy bằng chứng thủ công: {path}"}
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        return {"_error": f"Không đọc được bằng chứng thủ công: {error}"}
    if not isinstance(payload, dict):
        return {"_error": "Bằng chứng thủ công phải là một JSON object."}
    return payload


def normalize_manual_evidence(evidence: dict[str, Any] | None) -> dict[str, Any]:
    source = evidence if isinstance(evidence, dict) else {}
    checks_source = source.get("checks") if isinstance(source.get("checks"), dict) else {}
    checks = {key: checks_source.get(key) is True for key in MANUAL_CHECK_LABELS}
    missing = [key for key, passed in checks.items() if not passed]
    approved = source.get("approved") is True
    approved_by = text(source.get("approvedBy"))
    approved_at = text(source.get("approvedAt"))
    error = text(source.get("_error"))

    if not approved:
        missing.append("approved")
    if not approved_by:
        missing.append("approvedBy")
    if not approved_at:
        missing.append("approvedAt")
    if error:
        missing.append("evidenceError")

    return {
        "ready": not missing,
        "approved": approved,
        "approvedBy": approved_by,
        "approvedAt": approved_at,
        "checks": checks,
        "missing": missing,
        "notes": text(source.get("notes")),
        "error": error,
    }


def build_report(data: dict[str, Any], manual_evidence: dict[str, Any] | None = None) -> dict[str, Any]:
    events = data.get("events") if isinstance(data.get("events"), dict) else {}
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
    automated_ready = not blockers
    manual = normalize_manual_evidence(manual_evidence)
    manual_ready = manual["ready"]

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
        "automatedReady": automated_ready,
        "manualReady": manual_ready,
        "guestReady": automated_ready and manual_ready,
        "summary": {
            "events": len(EVENT_IDS),
            "blockers": len(blockers),
            "warnings": len(warnings),
            "manualChecks": len(MANUAL_CHECK_LABELS),
            "manualMissing": len(manual["missing"]),
        },
        "events": event_summary,
        "manual": manual,
        "findings": [asdict(item) for item in findings],
    }


def render_markdown(report: dict[str, Any]) -> str:
    build_id = text(report.get("build", {}).get("buildId")) or "unknown"
    verdict = "GUEST READY" if report["guestReady"] else "NOT GUEST READY"
    lines = [
        "# Wedding release readiness",
        "",
        f"**Build:** `{build_id}`  ",
        f"**Automated:** `{'PASS' if report['automatedReady'] else 'FAIL'}`  ",
        f"**Manual:** `{'PASS' if report['manualReady'] else 'PENDING'}`  ",
        f"**Verdict:** `{verdict}`",
        "",
        "## Event summary",
        "",
        "| Event | Automated ready | Blockers | Warnings |",
        "|---|---:|---:|---:|",
    ]
    for event_id, summary in report["events"].items():
        lines.append(
            f"| `{event_id}` | {'YES' if summary['ready'] else 'NO'} | "
            f"{summary['blockers']} | {summary['warnings']} |"
        )

    lines.extend(["", "## Manual release evidence", "", "| Check | Status |", "|---|---:|"])
    for key, label in MANUAL_CHECK_LABELS.items():
        passed = report["manual"]["checks"].get(key) is True
        lines.append(f"| {label} | {'PASS' if passed else 'PENDING'} |")

    lines.extend(
        [
            "",
            f"- Approved: `{'YES' if report['manual']['approved'] else 'NO'}`",
            f"- Approved by: `{report['manual']['approvedBy'] or 'chưa điền'}`",
            f"- Approved at: `{report['manual']['approvedAt'] or 'chưa điền'}`",
        ]
    )
    if report["manual"]["error"]:
        lines.append(f"- Evidence error: `{report['manual']['error']}`")
    if report["manual"]["notes"]:
        lines.append(f"- Notes: {report['manual']['notes']}")

    lines.extend(["", "## Automated findings", ""])
    if not report["findings"]:
        lines.append("Không còn automated finding.")
    else:
        for item in report["findings"]:
            lines.append(
                f"- **{item['severity'].upper()} · {item['event_id']} · {item['code']}** — "
                f"{item['message']}"
            )

    lines.extend(
        [
            "",
            "## Release rule",
            "",
            "`automatedReady=true` chỉ chứng minh source/dữ liệu tự động. "
            "Chỉ được gửi khách khi bằng chứng thủ công đã được duyệt, "
            "`manualReady=true` và kết quả cuối là `guestReady=true`.",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA)
    parser.add_argument("--manual-evidence", type=Path, default=DEFAULT_MANUAL_EVIDENCE)
    parser.add_argument("--json", type=Path)
    parser.add_argument("--markdown", type=Path)
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit 1 unless both automated and manual readiness pass.",
    )
    args = parser.parse_args()

    data = json.loads(args.data.read_text(encoding="utf-8"))
    manual_evidence = load_manual_evidence(args.manual_evidence)
    report = build_report(data, manual_evidence)

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

#!/usr/bin/env python3
"""Verify that the public GitHub Pages site serves the expected wedding build."""

from __future__ import annotations

import argparse
import json
import time
import urllib.error
import urllib.request
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import parse_qsl, urlencode, urljoin, urlsplit, urlunsplit

EVENT_IDS = ("bride", "groom", "nhatrang", "saigon")
DEFAULT_BASE_URL = "https://xuan2261.github.io/wedding-xuan-phuong/"


class VerificationError(RuntimeError):
    """Raised when the live deployment does not match the expected release."""


class MarkerParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.build_marker: str | None = None
        self.event_ids: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {name.lower(): value for name, value in attrs}
        if tag.lower() == "meta" and values.get("name") == "wedding-build":
            self.build_marker = values.get("content")
        event_id = values.get("data-event-id")
        if event_id:
            self.event_ids.add(event_id)


@dataclass(frozen=True)
class CheckResult:
    name: str
    url: str
    ok: bool
    detail: str


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def with_cache_bust(url: str, expected_build: str, nonce: str) -> str:
    parts = urlsplit(url)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    query.update({"build": expected_build, "verify": nonce})
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


def fetch_text(url: str, timeout_seconds: float) -> str:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "wedding-pages-verifier/1.0",
            "Cache-Control": "no-cache, no-store, max-age=0",
            "Pragma": "no-cache",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            if response.status != 200:
                raise VerificationError(f"HTTP {response.status}")
            return response.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as exc:
        raise VerificationError(f"HTTP {exc.code}") from exc
    except urllib.error.URLError as exc:
        raise VerificationError(f"network error: {exc.reason}") from exc


def parse_markers(html: str) -> MarkerParser:
    parser = MarkerParser()
    parser.feed(html)
    return parser


def verify_once(
    base_url: str,
    expected_build: str,
    timeout_seconds: float = 20.0,
) -> list[CheckResult]:
    base = base_url.rstrip("/") + "/"
    nonce = str(time.time_ns())
    checks: list[CheckResult] = []

    root_url = with_cache_bust(base, expected_build, nonce)
    root_html = fetch_text(root_url, timeout_seconds)
    root_markers = parse_markers(root_html)
    root_ok = root_markers.build_marker == expected_build
    checks.append(
        CheckResult(
            name="root-build-marker",
            url=root_url,
            ok=root_ok,
            detail=f"observed={root_markers.build_marker!r}, expected={expected_build!r}",
        )
    )

    release_url = with_cache_bust(urljoin(base, "release.json"), expected_build, nonce)
    release_text = fetch_text(release_url, timeout_seconds)
    try:
        release_data: dict[str, Any] = json.loads(release_text)
    except json.JSONDecodeError as exc:
        raise VerificationError(f"release.json is invalid JSON: {exc}") from exc
    observed_release = release_data.get("buildId")
    release_ok = observed_release == expected_build
    checks.append(
        CheckResult(
            name="release-json",
            url=release_url,
            ok=release_ok,
            detail=f"observed={observed_release!r}, expected={expected_build!r}",
        )
    )

    for event_id in EVENT_IDS:
        event_url = with_cache_bust(
            urljoin(base, f"events/{event_id}/"), expected_build, nonce
        )
        event_html = fetch_text(event_url, timeout_seconds)
        event_markers = parse_markers(event_html)
        event_ok = (
            event_markers.build_marker == expected_build
            and event_id in event_markers.event_ids
        )
        checks.append(
            CheckResult(
                name=f"event-{event_id}",
                url=event_url,
                ok=event_ok,
                detail=(
                    f"build={event_markers.build_marker!r}, "
                    f"event_ids={sorted(event_markers.event_ids)!r}"
                ),
            )
        )

    failed = [check for check in checks if not check.ok]
    if failed:
        summary = "; ".join(f"{item.name}: {item.detail}" for item in failed)
        raise VerificationError(summary)
    return checks


def write_report(path: str | None, report: dict[str, Any]) -> None:
    if not path:
        return
    destination = Path(path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--expected-build", required=True)
    parser.add_argument("--attempts", type=int, default=1)
    parser.add_argument("--delay-seconds", type=float, default=0.0)
    parser.add_argument("--timeout-seconds", type=float, default=20.0)
    parser.add_argument("--report")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if args.attempts < 1:
        raise SystemExit("--attempts must be at least 1")
    if args.delay_seconds < 0 or args.timeout_seconds <= 0:
        raise SystemExit("delay must be non-negative and timeout must be positive")

    attempts: list[dict[str, Any]] = []
    started_at = utc_now()
    for attempt_number in range(1, args.attempts + 1):
        try:
            checks = verify_once(
                args.base_url,
                args.expected_build,
                timeout_seconds=args.timeout_seconds,
            )
            report = {
                "status": "pass",
                "expectedBuild": args.expected_build,
                "baseUrl": args.base_url,
                "startedAtUtc": started_at,
                "finishedAtUtc": utc_now(),
                "attempt": attempt_number,
                "checks": [asdict(check) for check in checks],
                "attempts": attempts,
            }
            write_report(args.report, report)
            print(f"PASS: live GitHub Pages đang chạy {args.expected_build}")
            return 0
        except Exception as exc:  # noqa: BLE001 - report all operational failures
            attempts.append(
                {
                    "attempt": attempt_number,
                    "timeUtc": utc_now(),
                    "error": f"{type(exc).__name__}: {exc}",
                }
            )
            print(
                f"WAIT: live Pages chưa đạt yêu cầu "
                f"({attempt_number}/{args.attempts}): {exc}"
            )
            if attempt_number < args.attempts:
                time.sleep(args.delay_seconds)

    report = {
        "status": "fail",
        "expectedBuild": args.expected_build,
        "baseUrl": args.base_url,
        "startedAtUtc": started_at,
        "finishedAtUtc": utc_now(),
        "attempts": attempts,
    }
    write_report(args.report, report)
    print(f"FAIL: live GitHub Pages chưa chạy {args.expected_build}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())

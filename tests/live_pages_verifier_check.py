#!/usr/bin/env python3
"""Deterministic local contract checks for tools/verify_live_pages.py."""

from __future__ import annotations

import importlib.util
import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "tools" / "verify_live_pages.py"
SPEC = importlib.util.spec_from_file_location("verify_live_pages", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("cannot load verify_live_pages module")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

EXPECTED_BUILD = "v-test-20260725"


class FixtureHandler(BaseHTTPRequestHandler):
    bad_release = False

    def log_message(self, format: str, *args: object) -> None:  # noqa: A002
        return

    def do_GET(self) -> None:  # noqa: N802
        path = self.path.split("?", 1)[0]
        if path == "/release.json":
            build_id = "wrong-build" if self.bad_release else EXPECTED_BUILD
            body = json.dumps({"buildId": build_id}).encode("utf-8")
            content_type = "application/json"
        elif path == "/":
            body = (
                f'<meta name="wedding-build" content="{EXPECTED_BUILD}">'
            ).encode("utf-8")
            content_type = "text/html; charset=utf-8"
        elif path.startswith("/events/"):
            event_id = path.strip("/").split("/")[1]
            body = (
                f'<meta name="wedding-build" content="{EXPECTED_BUILD}">'
                f'<main data-event-id="{event_id}"></main>'
            ).encode("utf-8")
            content_type = "text/html; charset=utf-8"
        else:
            self.send_error(404)
            return

        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main() -> int:
    server = ThreadingHTTPServer(("127.0.0.1", 0), FixtureHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base_url = f"http://127.0.0.1:{server.server_port}/"
    try:
        checks = MODULE.verify_once(base_url, EXPECTED_BUILD, timeout_seconds=2)
        assert len(checks) == 6
        assert all(check.ok for check in checks)

        FixtureHandler.bad_release = True
        try:
            MODULE.verify_once(base_url, EXPECTED_BUILD, timeout_seconds=2)
        except MODULE.VerificationError as exc:
            assert "release-json" in str(exc)
        else:
            raise AssertionError("bad release.json must fail verification")
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)

    print("PASS: live Pages verifier contract")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

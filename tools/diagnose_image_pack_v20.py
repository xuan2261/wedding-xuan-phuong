#!/usr/bin/env python3
from __future__ import annotations

import base64
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STAGING = ROOT / ".image-pack-v20"
VALID = re.compile(r"^[A-Za-z0-9+/=]*$")


def git(*args: str, check: bool = True) -> str:
    proc = subprocess.run(
        ["git", *args], cwd=ROOT, text=True, capture_output=True, check=False
    )
    if check and proc.returncode:
        raise RuntimeError(proc.stderr.strip() or proc.stdout.strip())
    return proc.stdout


def inspect_text(name: str, text: str) -> dict[str, object]:
    compact = "".join(text.split())
    invalid = sorted(
        set(ch for ch in compact if ch not in "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=")
    )
    return {
        "file": name,
        "chars": len(compact),
        "validAlphabet": not invalid,
        "invalidChars": invalid[:20],
        "sha256Text": hashlib.sha256(compact.encode("ascii", "replace")).hexdigest(),
        "prefix": compact[:24],
        "suffix": compact[-24:],
        "containsEllipsisMarker": "ELLIPSIZATION" in compact,
        "containsPlaceholder": any(
            token in compact
            for token in ("placeholder", "truncated", "omitted", "REDACTED", "MUST_USE")
        ),
    }


def current_parts() -> dict[str, object]:
    rows = []
    combined = []
    for path in sorted(STAGING.glob("part-*.b64")):
        compact = "".join(path.read_text(encoding="utf-8").split())
        rows.append(inspect_text(path.name, compact))
        combined.append(compact)
    encoded = "".join(combined)
    result: dict[str, object] = {
        "parts": rows,
        "partCount": len(rows),
        "encodedChars": len(encoded),
        "validAlphabet": bool(encoded) and VALID.fullmatch(encoded) is not None,
        "paddingModulo": len(encoded) % 4,
    }
    if result["validAlphabet"] and result["paddingModulo"] == 0:
        try:
            payload = base64.b64decode(encoded, validate=True)
            result.update(
                {
                    "decodedBytes": len(payload),
                    "sha256": hashlib.sha256(payload).hexdigest(),
                    "zipMagic": payload[:4].hex(),
                }
            )
        except Exception as exc:
            result["decodeError"] = repr(exc)
    return result


def historical_versions() -> list[dict[str, object]]:
    commits = [
        line.strip()
        for line in git("rev-list", "--reverse", "main..HEAD").splitlines()
        if line.strip()
    ]
    rows: list[dict[str, object]] = []
    for order, commit in enumerate(commits, 1):
        changed = [
            line.strip()
            for line in git(
                "diff-tree", "--no-commit-id", "--name-only", "-r", commit
            ).splitlines()
            if line.strip().startswith(".image-pack-v20/")
            and line.strip().endswith(".b64")
        ]
        if not changed:
            continue
        message = git("show", "-s", "--format=%s", commit).strip()
        for path in sorted(changed):
            proc = subprocess.run(
                ["git", "show", f"{commit}:{path}"],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=False,
            )
            if proc.returncode:
                continue
            row = inspect_text(path, proc.stdout)
            row.update(
                {
                    "order": order,
                    "commit": commit,
                    "message": message,
                    "path": path,
                }
            )
            rows.append(row)
    return rows


def main() -> int:
    result = {
        "current": current_parts(),
        "history": historical_versions(),
    }
    out = ROOT / "reports" / "image-pack-v20-diagnostic.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

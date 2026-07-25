#!/usr/bin/env python3
from __future__ import annotations

import base64
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STAGING = ROOT / ".image-pack-v20"
VALID = re.compile(r"^[A-Za-z0-9+/=]*$")


def main() -> int:
    rows = []
    combined = []
    for path in sorted(STAGING.glob("part-*.b64")):
        text = path.read_text(encoding="utf-8")
        compact = "".join(text.split())
        invalid = sorted(set(ch for ch in compact if ch not in "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="))
        row = {
            "file": path.name,
            "chars": len(compact),
            "validAlphabet": not invalid,
            "invalidChars": invalid[:20],
            "prefix": compact[:24],
            "suffix": compact[-24:],
            "containsEllipsisMarker": "ELLIPSIZATION" in compact,
            "containsPlaceholder": any(token in compact for token in ("placeholder", "truncated", "omitted", "REDACTED")),
        }
        rows.append(row)
        combined.append(compact)

    encoded = "".join(combined)
    result = {
        "parts": rows,
        "partCount": len(rows),
        "encodedChars": len(encoded),
        "validAlphabet": bool(encoded) and VALID.fullmatch(encoded) is not None,
        "paddingModulo": len(encoded) % 4,
    }
    if result["validAlphabet"] and result["paddingModulo"] == 0:
        try:
            payload = base64.b64decode(encoded, validate=True)
            result.update({
                "decodedBytes": len(payload),
                "sha256": hashlib.sha256(payload).hexdigest(),
                "zipMagic": payload[:4].hex(),
            })
        except Exception as exc:
            result["decodeError"] = repr(exc)

    out = ROOT / "reports" / "image-pack-v20-diagnostic.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

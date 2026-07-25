#!/usr/bin/env python3
"""Recover the v20 Photoshop ZIP from staged Base64 revisions in Git history."""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import subprocess
from dataclasses import asdict, dataclass
from pathlib import Path

EXPECTED_SHA256 = "afca17358afe24cd9f199a68da4332cc2cef42520fede19ccbea294dcb7387c0"
EXPECTED_BYTES = 1_241_783
EXPECTED_ENCODED_CHARS = 1_655_712
ALPHABET = frozenset("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=")


@dataclass
class Candidate:
    order: int
    commit: str
    message: str
    path: str
    chars: int
    sha256_text: str
    prefix: str
    suffix: str
    content: str


def run(repo: Path, *args: str, check: bool = True) -> str:
    proc = subprocess.run(
        ["git", *args], cwd=repo, text=True, capture_output=True, check=False
    )
    if check and proc.returncode:
        raise RuntimeError(proc.stderr.strip() or proc.stdout.strip())
    return proc.stdout


def collect(repo: Path, base_ref: str, head_ref: str) -> list[Candidate]:
    merge_base = run(repo, "merge-base", base_ref, head_ref).strip()
    commits = [
        line.strip()
        for line in run(repo, "rev-list", "--reverse", f"{merge_base}..{head_ref}").splitlines()
        if line.strip()
    ]
    result: list[Candidate] = []
    seen: set[str] = set()
    order = 0
    for commit in commits:
        message = run(repo, "show", "-s", "--format=%s", commit).strip()
        paths = [
            line.strip()
            for line in run(
                repo,
                "diff-tree",
                "--no-commit-id",
                "--name-only",
                "-r",
                commit,
            ).splitlines()
            if line.strip().startswith(".image-pack-v20/")
            and line.strip().endswith(".b64")
        ]
        for path in sorted(paths):
            proc = subprocess.run(
                ["git", "show", f"{commit}:{path}"],
                cwd=repo,
                text=True,
                capture_output=True,
                check=False,
            )
            if proc.returncode:
                continue
            content = "".join(proc.stdout.split())
            if not content or any(ch not in ALPHABET for ch in content):
                continue
            if any(token in content for token in ("MUST_USE", "ELLIPSIZATION", "placeholder", "REDACTED")):
                continue
            digest = hashlib.sha256(content.encode("ascii")).hexdigest()
            if digest in seen:
                continue
            seen.add(digest)
            order += 1
            result.append(
                Candidate(
                    order=order,
                    commit=commit,
                    message=message,
                    path=path,
                    chars=len(content),
                    sha256_text=digest,
                    prefix=content[:24],
                    suffix=content[-24:],
                    content=content,
                )
            )
    return result


def verify(encoded: str) -> bytes | None:
    if len(encoded) != EXPECTED_ENCODED_CHARS:
        return None
    if not encoded.startswith("UEsDB"):
        return None
    try:
        payload = base64.b64decode(encoded, validate=True)
    except Exception:
        return None
    if len(payload) != EXPECTED_BYTES:
        return None
    if hashlib.sha256(payload).hexdigest() != EXPECTED_SHA256:
        return None
    return payload


def contiguous(candidates: list[Candidate]) -> tuple[bytes, list[int]] | None:
    left = 0
    total = 0
    for right, candidate in enumerate(candidates):
        total += candidate.chars
        while left <= right and total > EXPECTED_ENCODED_CHARS:
            total -= candidates[left].chars
            left += 1
        if total == EXPECTED_ENCODED_CHARS:
            chosen = candidates[left : right + 1]
            payload = verify("".join(item.content for item in chosen))
            if payload is not None:
                return payload, [item.order for item in chosen]
    return None


def ordered_subset(candidates: list[Candidate]) -> tuple[bytes, list[int]] | None:
    """Find an ordered subset by encoded length, then validate the strong ZIP hash."""
    starts = [idx for idx, item in enumerate(candidates) if item.content.startswith("UEsDB")]
    for start in starts:
        tail = candidates[start:]
        # sum -> ordered candidate indices; keep a bounded number of alternatives per sum.
        states: dict[int, list[tuple[int, ...]]] = {0: [()]}
        for idx, item in enumerate(tail):
            additions: dict[int, list[tuple[int, ...]]] = {}
            for total, sequences in list(states.items()):
                new_total = total + item.chars
                if new_total > EXPECTED_ENCODED_CHARS:
                    continue
                bucket = additions.setdefault(new_total, [])
                for sequence in sequences[:8]:
                    if len(bucket) >= 16:
                        break
                    bucket.append(sequence + (idx,))
            for total, sequences in additions.items():
                bucket = states.setdefault(total, [])
                for sequence in sequences:
                    if sequence not in bucket and len(bucket) < 16:
                        bucket.append(sequence)
            for sequence in states.get(EXPECTED_ENCODED_CHARS, []):
                if not sequence or sequence[0] != 0:
                    continue
                chosen = [tail[i] for i in sequence]
                payload = verify("".join(item.content for item in chosen))
                if payload is not None:
                    return payload, [item.order for item in chosen]
    return None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default=".")
    parser.add_argument("--base-ref", default="origin/main")
    parser.add_argument("--head-ref", default="origin/images/refresh-photoshop-v20")
    parser.add_argument("--output", required=True)
    parser.add_argument("--report", required=True)
    args = parser.parse_args()

    repo = Path(args.repo).resolve()
    candidates = collect(repo, args.base_ref, args.head_ref)
    recovered = contiguous(candidates) or ordered_subset(candidates)
    report = {
        "expected": {
            "sha256": EXPECTED_SHA256,
            "bytes": EXPECTED_BYTES,
            "encodedChars": EXPECTED_ENCODED_CHARS,
        },
        "candidateCount": len(candidates),
        "candidates": [
            {key: value for key, value in asdict(item).items() if key != "content"}
            for item in candidates
        ],
        "recovered": recovered is not None,
    }
    if recovered is not None:
        payload, orders = recovered
        output = Path(args.output)
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_bytes(payload)
        report["selectedOrders"] = orders
        report["observedSha256"] = hashlib.sha256(payload).hexdigest()
        report["observedBytes"] = len(payload)

    report_path = Path(args.report)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if recovered is not None else 1


if __name__ == "__main__":
    raise SystemExit(main())

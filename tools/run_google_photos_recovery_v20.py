#!/usr/bin/env python3
"""Run v20 Google Photos recovery with globally optimal image assignment."""
from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("recover_google_photos_v20.py")
SPEC = importlib.util.spec_from_file_location("recover_google_photos_v20", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Cannot load {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def optimal_assignment(candidates):
    """Minimize total 256-bit dHash distance with one unique image per target."""
    assets = list(MODULE.TARGETS)
    if len(candidates) < len(assets):
        raise RuntimeError(
            f"Need at least {len(assets)} candidates, found {len(candidates)}"
        )

    cost = [
        [
            MODULE.hamming(str(MODULE.TARGETS[asset]["dhash"]), candidate.dhash)
            for candidate in candidates
        ]
        for asset in assets
    ]

    for row, asset in enumerate(assets):
        nearest = sorted(
            (cost[row][column], column) for column in range(len(candidates))
        )[:5]
        print(
            "NEAREST",
            asset,
            ", ".join(
                f"distance={distance} candidate={column} url={candidates[column].base_url[:96]}"
                for distance, column in nearest
            ),
        )

    # Hungarian algorithm for a rectangular matrix where rows <= columns.
    rows = len(cost)
    columns = len(cost[0])
    u = [0] * (rows + 1)
    v = [0] * (columns + 1)
    p = [0] * (columns + 1)
    way = [0] * (columns + 1)

    for i in range(1, rows + 1):
        p[0] = i
        j0 = 0
        minv = [10**9] * (columns + 1)
        used = [False] * (columns + 1)
        while True:
            used[j0] = True
            i0 = p[j0]
            delta = 10**9
            j1 = 0
            for j in range(1, columns + 1):
                if used[j]:
                    continue
                current = cost[i0 - 1][j - 1] - u[i0] - v[j]
                if current < minv[j]:
                    minv[j] = current
                    way[j] = j0
                if minv[j] < delta:
                    delta = minv[j]
                    j1 = j
            for j in range(columns + 1):
                if used[j]:
                    u[p[j]] += delta
                    v[j] -= delta
                else:
                    minv[j] -= delta
            j0 = j1
            if p[j0] == 0:
                break
        while True:
            j1 = way[j0]
            p[j0] = p[j1]
            j0 = j1
            if j0 == 0:
                break

    selected = [-1] * rows
    for j in range(1, columns + 1):
        if p[j] != 0:
            selected[p[j] - 1] = j - 1

    assigned = {}
    failures = []
    for row, asset in enumerate(assets):
        column = selected[row]
        if column < 0:
            failures.append(f"{asset}=unassigned")
            continue
        distance = cost[row][column]
        print(
            f"ASSIGNED asset={asset} candidate={column} distance={distance} "
            f"url={candidates[column].base_url}"
        )
        if distance > MODULE.MAX_DHASH_DISTANCE:
            failures.append(
                f"{asset}=distance-{distance}-over-{MODULE.MAX_DHASH_DISTANCE}"
            )
        assigned[asset] = candidates[column]

    if failures:
        raise RuntimeError("Unsafe optimal assignment: " + ", ".join(failures))
    return assigned


MODULE.assign_candidates = optimal_assignment
exit_code = MODULE.main()
Path(__file__).unlink(missing_ok=True)
raise SystemExit(exit_code)

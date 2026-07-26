#!/usr/bin/env python3
"""Recover the exact wedding Photoshop sources from a public Google Photos album.

The workflow intentionally transfers only fingerprints and the public album URL.
It downloads candidates inside GitHub Actions, verifies exact SHA-256 when Google
serves the original bytes, otherwise requires a tight 256-bit dHash match before
creating the responsive v20 website assets.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import io
import json
import re
import shutil
import urllib.request
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageEnhance, ImageFilter, ImageOps
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright

ALBUM_URL = "https://photos.app.goo.gl/SwCq2r7wzxa3XSy18"
ASSET_SIZE = (1280, 1920)
RESPONSIVE_SIZE = (720, 1080)
MAX_DHASH_DISTANCE = 24

TARGETS = {
    "bride": {"filename": "DRS06549(3).jpg", "sha256": "12b45bdd0d4736fd85ad442ffc88223ab2e0d70a277ba7224e9e065c57a5d907", "dhash": "464cc15819c5959ce1a17982d9825f225bc25f82cf89e6012c02ac50fcc0f8c0"},
    "couple-formal": {"filename": "DRS06605(3).jpg", "sha256": "fd961c651bbb85be5a77411e711200ff2ae454171b4c8284609d6c1ccb5161ac", "dhash": "88cc6ab961ac7c1058e678626771d460f4b0625060c970c876d034e0b492b481"},
    "hero": {"filename": "DRS06640(3).jpg", "sha256": "66b3b62c2a8be1b0ecb3aba04a3f910aa597ba014ca7891d40e246dbe416bdb4", "dhash": "129699935156ea31d9631960746066d17841713571c0f0c8f5b9b5b0b584b70c"},
    "couple-hands": {"filename": "DRS06659(3).jpg", "sha256": "bcef5a97c5d1f5f75fcf05e9c976230f5890c671ab098270a9e194d9f84e0ef3", "dhash": "67273126d2d4ac628ccaf8eae260d4d0d0b4d870f8c9f888f1b0b5b0f598758e"},
    "couple-playful": {"filename": "DRS06669(3).jpg", "sha256": "e678c3be3bc00c34f938eae6324a7040a3ee615204f3cb786c7f2b7f767c9cac", "dhash": "b632362016315ab1348624d36cd07ac0d98a988339c5dba4bbb23b90d28cd722"},
    "couple-intimate": {"filename": "DRS06828(1).jpg", "sha256": "5b5d4c05992c563708ed372ac57b6b7df0eb379fa7a422c151a539d0c2ceab17", "dhash": "66414f32cb18421c230c8b18c29170d161cf60e3e83ce97ce0dce2f1e3f1e3f1"},
    "groom": {"filename": "DRS07188(3).jpg", "sha256": "293c497a53c19a6b3fcccbc20c997751b22b2c4be6055c4095ef77f61220deb2", "dhash": "6689678b651861b021a9969a9c97249bc45f0c3f083482720366816e1c303270"},
    "couple-seated": {"filename": "DRS07290(1).JPG", "sha256": "f9f36af4e4d9532830340734c61d790c90fc430f7ccef110dc0a18acd2ba0d95", "dhash": "cd26ce788fd2bb88d789f1a4eb34f630d632de98ee0c7a7ad3b0c7d4cdf4cdf4"},
    "couple-aodai": {"filename": "DRS07389(3).jpg", "sha256": "d4722ed378fb2b38f49008bfd78b5dafea84e5a912546a63dd18c2de627a0507", "dhash": "a7a232768a66a548ba99acc3ac63782764b1ccb0fca4744c686176d836d8b6d8"},
    "couple-garden": {"filename": "DRS07446(1).JPG", "sha256": "fe54ee44eb0932f47c1040c70e8831652228caecb2cef723e0faf1f327220ce0", "dhash": "f95a8c4acb66d85a3b16536c936e4cdbdc66dd52bcc938e030e4b0e398e298f2"},
    "couple-studio": {"filename": "DRS07545(3).jpg", "sha256": "d6a4ca22377b0d705f327dd50be851bcf9a18ba8cce9e7cf3a5f3da68ea60ea5", "dhash": "09cf08f7105ab04d40cd478d833603361b96811c933c803c80768936c936c876"},
}

ROLES = {
    "bride": "Chân dung cô dâu",
    "couple-formal": "Cặp đôi trang trọng",
    "hero": "Hero, ảnh mở thiệp và ảnh toàn thân cuối album",
    "couple-hands": "Ảnh nhìn nhau, mở album",
    "couple-playful": "Khoảnh khắc toàn thân vui tươi",
    "couple-intimate": "Ảnh cảm xúc và bản ngang desktop",
    "groom": "Chân dung chú rể",
    "couple-seated": "Ảnh cặp đôi ngồi bên nhau",
    "couple-aodai": "Áo dài và nhẫn cưới",
    "couple-garden": "Ảnh kết Thank you",
    "couple-studio": "Ảnh studio nền trắng và ảnh chia sẻ",
}

@dataclass
class Candidate:
    base_url: str
    thumb_url: str
    width: int
    height: int
    dhash: str

@dataclass
class Match:
    asset: str
    filename: str
    base_url: str
    distance: int
    source_mode: str
    source_sha256: str
    source_bytes: int
    source_size: tuple[int, int]


def request_bytes(url: str, timeout: int = 45) -> bytes:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/134 Safari/537.36",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return response.read()


def strip_size_suffix(url: str) -> str:
    url = html.unescape(url).replace("\\u003d", "=").replace("\\u0026", "&")
    if url.startswith("//"):
        url = "https:" + url
    url = url.split("#", 1)[0]
    return re.sub(r"=(?:w|s)\d+[^/]*$", "", url)


def variant(base: str, suffix: str) -> str:
    return strip_size_suffix(base) + suffix


def dhash(image: Image.Image, size: int = 16) -> str:
    gray = ImageOps.exif_transpose(image).convert("L").resize((size + 1, size), Image.Resampling.LANCZOS)
    pixels = list(gray.getdata())
    value = 0
    for row in range(size):
        offset = row * (size + 1)
        for col in range(size):
            value = (value << 1) | int(pixels[offset + col + 1] > pixels[offset + col])
    return f"{value:0{size * size // 4}x}"


def hamming(left: str, right: str) -> int:
    return (int(left, 16) ^ int(right, 16)).bit_count()


def collect_urls(album_url: str, report_dir: Path) -> list[str]:
    captured: set[str] = set()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 1200}, locale="vi-VN")
        page = context.new_page()

        def capture(url: str) -> None:
            if "googleusercontent.com" in url:
                captured.add(url)

        page.on("request", lambda request: capture(request.url))
        page.on("response", lambda response: capture(response.url))
        try:
            page.goto(album_url, wait_until="domcontentloaded", timeout=120_000)
        except PlaywrightTimeoutError:
            pass
        page.wait_for_timeout(4_000)
        stable_rounds = 0
        previous = 0
        for _ in range(45):
            for src in page.eval_on_selector_all("img", "nodes => nodes.map(n => n.currentSrc || n.src || '')"):
                capture(src)
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.mouse.wheel(0, 5000)
            page.wait_for_timeout(1200)
            if len(captured) == previous:
                stable_rounds += 1
            else:
                stable_rounds = 0
                previous = len(captured)
            if stable_rounds >= 5:
                break
        (report_dir / "GOOGLE-PHOTOS-PAGE.html").write_text(page.content(), encoding="utf-8")
        browser.close()

    normalized = sorted(
        {
            strip_size_suffix(url)
            for url in captured
            if url.startswith(("https://lh3.googleusercontent.com/", "https://lh4.googleusercontent.com/", "https://lh5.googleusercontent.com/", "https://lh6.googleusercontent.com/"))
        }
    )
    return normalized


def build_candidates(urls: Iterable[str]) -> list[Candidate]:
    candidates: list[Candidate] = []
    for index, base in enumerate(urls, start=1):
        thumb_url = variant(base, "=w512-h512-no")
        try:
            payload = request_bytes(thumb_url, timeout=30)
            with Image.open(io.BytesIO(payload)) as image:
                image = ImageOps.exif_transpose(image)
                width, height = image.size
                if width < 220 or height < 220:
                    continue
                ratio = height / max(width, 1)
                if not 1.15 <= ratio <= 1.8:
                    continue
                candidates.append(Candidate(base, thumb_url, width, height, dhash(image)))
        except Exception as exc:
            print(f"SKIP candidate {index}: {type(exc).__name__}: {exc}")
    return candidates


def assign_candidates(candidates: list[Candidate]) -> dict[str, Candidate]:
    pairs: list[tuple[int, str, str, Candidate]] = []
    for asset, target in TARGETS.items():
        for candidate in candidates:
            pairs.append((hamming(str(target["dhash"]), candidate.dhash), asset, candidate.base_url, candidate))
    pairs.sort(key=lambda item: (item[0], item[1], item[2]))
    assigned: dict[str, Candidate] = {}
    used: set[str] = set()
    for distance, asset, base_url, candidate in pairs:
        if asset in assigned or base_url in used:
            continue
        assigned[asset] = candidate
        used.add(base_url)
    missing = sorted(set(TARGETS) - set(assigned))
    if missing:
        raise RuntimeError(f"Could not assign candidates for: {', '.join(missing)}")
    for asset, candidate in assigned.items():
        distance = hamming(str(TARGETS[asset]["dhash"]), candidate.dhash)
        if distance > MAX_DHASH_DISTANCE:
            raise RuntimeError(f"Unsafe visual match for {asset}: dHash distance {distance} > {MAX_DHASH_DISTANCE}")
    return assigned


def fetch_source(asset: str, candidate: Candidate) -> tuple[bytes, str, tuple[int, int]]:
    target = TARGETS[asset]
    attempts = [
        ("original", variant(candidate.base_url, "=d")),
        ("2048-no", variant(candidate.base_url, "=w2048-h2048-no")),
        ("captured", candidate.base_url),
    ]
    fallback: tuple[bytes, str, tuple[int, int], int] | None = None
    for mode, url in attempts:
        try:
            payload = request_bytes(url, timeout=60)
            digest = hashlib.sha256(payload).hexdigest()
            with Image.open(io.BytesIO(payload)) as image:
                image = ImageOps.exif_transpose(image)
                size = image.size
                distance = hamming(str(target["dhash"]), dhash(image))
            if digest == target["sha256"]:
                return payload, "exact-sha256", size
            if min(size) >= 1200 and distance <= MAX_DHASH_DISTANCE:
                if fallback is None or distance < fallback[3] or (distance == fallback[3] and len(payload) > len(fallback[0])):
                    fallback = (payload, mode, size, distance)
        except Exception as exc:
            print(f"WARN {asset} {mode}: {type(exc).__name__}: {exc}")
    if fallback is None:
        raise RuntimeError(f"No safe high-resolution source recovered for {asset}")
    return fallback[0], f"visual-{fallback[1]}", fallback[2]


def save_webp(image: Image.Image, path: Path, quality: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(path, "WEBP", quality=quality, method=6, exact=True)


def save_jpeg(image: Image.Image, path: Path, quality: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(path, "JPEG", quality=quality, optimize=True, progressive=True, subsampling="4:2:0")


def landscape_with_context(source: Image.Image, size: tuple[int, int]) -> Image.Image:
    width, height = size
    background = ImageOps.fit(source, size, method=Image.Resampling.LANCZOS)
    background = background.filter(ImageFilter.GaussianBlur(max(14, width // 44)))
    background = ImageEnhance.Brightness(background).enhance(0.48)
    foreground = ImageOps.contain(source, size, method=Image.Resampling.LANCZOS)
    canvas = background.copy()
    canvas.paste(foreground, ((width - foreground.width) // 2, (height - foreground.height) // 2))
    return canvas


def output_record(path: Path) -> dict[str, object]:
    with Image.open(path) as image:
        return {"size": list(image.size), "bytes": path.stat().st_size, "format": image.format, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}


def update_index(root: Path) -> None:
    path = root / "index.html"
    text = path.read_text(encoding="utf-8")
    text = text.replace("?v=18.2", "?v=20").replace("?v=16", "?v=20")
    text = text.replace("assets/images/meta-v3.jpg", "assets/images/meta-v4.jpg")
    path.write_text(text, encoding="utf-8")


def write_mapping(root: Path) -> None:
    rows = [f"| `{TARGETS[a]['filename']}` | `{a}` | {ROLES[a]} |" for a in TARGETS]
    content = """# Ánh xạ ảnh Wedding Xuân & Phượng — v20

## Nguồn ảnh Photoshop mới

| File nguồn | Key website | Vai trò |
|---|---|---|
""" + "\n".join(rows) + """

## Quy tắc xử lý

- Nguồn được khôi phục từ album Google Photos công khai bằng SHA-256 hoặc dHash 256-bit có ngưỡng chặt.
- Chỉ đổi định dạng, kích thước và tỷ lệ hiển thị; không thay đổi người, khuôn mặt hay bối cảnh.
- Ảnh dọc được chuẩn hóa 2:3 ở 720 × 1080 và 1280 × 1920.
- Ảnh ngang giữ trọn khung người ở giữa, dùng chính ảnh làm nền mở rộng mờ để tránh crop vào mặt.
- Các JPG nguồn không được đưa vào GitHub Pages.
"""
    (root / "IMAGE-MAP-V20.md").write_text(content, encoding="utf-8")


def cleanup_temporary(root: Path) -> None:
    shutil.rmtree(root / ".image-pack-v20", ignore_errors=True)
    for path in [
        root / "tools" / "materialize_image_pack_v20.py",
        root / "tools" / "diagnose_image_pack_v20.py",
        root / "tools" / "recover_google_photos_v20.py",
        root / "reports" / "materialize-image-pack-v20.log",
        root / "reports" / "image-pack-v20-diagnostic.json",
        root / "reports" / "old-image-pack-diagnosis.json",
        root / "reports" / "IMAGE-PACK-V20-HISTORY-RECOVERY.json",
        root / "noop",
        root / "temp-test-path.txt",
        root / "TEMP-BASE-TREE-TEST.txt",
        root / "TEMP-BASE-TREE-TEST-2.txt",
        root / "TEMP-BASE-TREE-TEST-3.txt",
        root / "TEMP-BASE-TREE-TEST-4.txt",
        root / "TEMP-BASE-TREE-TEST-5.txt",
    ]:
        path.unlink(missing_ok=True)
    for name in [
        "materialize-image-pack-v20.yml",
        "diagnose-image-pack-v20.yml",
        "diagnose-old-image-pack.yml",
        "recover-google-photos-v20.yml",
    ]:
        (root / ".github" / "workflows" / name).unlink(missing_ok=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--album-url", default=ALBUM_URL)
    args = parser.parse_args()
    root = args.root.resolve()
    reports = root / "reports"
    reports.mkdir(parents=True, exist_ok=True)
    assets = root / "assets" / "images"

    urls = collect_urls(args.album_url, reports)
    if len(urls) < len(TARGETS):
        raise RuntimeError(f"Only {len(urls)} Google image URLs discovered")
    candidates = build_candidates(urls)
    if len(candidates) < len(TARGETS):
        raise RuntimeError(f"Only {len(candidates)} portrait candidates decoded")
    assigned = assign_candidates(candidates)

    matches: list[Match] = []
    optimization: list[dict[str, object]] = []
    for asset in TARGETS:
        candidate = assigned[asset]
        distance = hamming(str(TARGETS[asset]["dhash"]), candidate.dhash)
        payload, source_mode, source_size = fetch_source(asset, candidate)
        source_sha = hashlib.sha256(payload).hexdigest()
        with Image.open(io.BytesIO(payload)) as image:
            image = ImageOps.exif_transpose(image).convert("RGB")
            master = ImageOps.fit(image, ASSET_SIZE, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
            master_path = assets / f"{asset}-1280.webp"
            responsive_path = assets / f"{asset}-720.webp"
            save_webp(master, master_path, 81)
            save_webp(master.resize(RESPONSIVE_SIZE, Image.Resampling.LANCZOS), responsive_path, 78)
        matches.append(Match(asset, str(TARGETS[asset]["filename"]), candidate.base_url, distance, source_mode, source_sha, len(payload), source_size))
        optimization.append({
            "asset": asset,
            "source": TARGETS[asset]["filename"],
            "source_mode": source_mode,
            "source_sha256": source_sha,
            "dhash_distance": distance,
            "outputs": {"720": output_record(responsive_path), "1280": output_record(master_path)},
        })

    with Image.open(assets / "couple-intimate-1280.webp") as intimate:
        intimate = intimate.convert("RGB")
        save_webp(landscape_with_context(intimate, (1280, 720)), assets / "couple-intimate-landscape-1280.webp", 80)
        save_webp(landscape_with_context(intimate, (720, 405)), assets / "couple-intimate-landscape-720.webp", 77)
    with Image.open(assets / "couple-studio-1280.webp") as studio:
        save_jpeg(ImageOps.fit(studio.convert("RGB"), (1200, 630), method=Image.Resampling.LANCZOS, centering=(0.5, 0.23)), assets / "meta-v4.jpg", 89)
    with Image.open(assets / "couple-formal-1280.webp") as formal:
        save_jpeg(ImageOps.fit(formal.convert("RGB"), (1600, 400), method=Image.Resampling.LANCZOS, centering=(0.5, 0.27)), assets / "google-forms-header-xuan-phuong-v3.jpg", 88)

    update_index(root)
    write_mapping(root)
    (root / "image-optimization-report.json").write_text(json.dumps(optimization, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (reports / "GOOGLE-PHOTOS-V20-RECOVERY.json").write_text(
        json.dumps({"album": args.album_url, "discoveredUrls": len(urls), "candidates": len(candidates), "matches": [asdict(match) for match in matches]}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    cleanup_temporary(root)
    print(f"PASS: recovered and materialized {len(matches)} Google Photos sources")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

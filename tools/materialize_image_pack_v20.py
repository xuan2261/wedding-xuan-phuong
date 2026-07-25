#!/usr/bin/env python3
"""Materialize the Photoshopped wedding image pack v20.

This helper is intentionally temporary. It reconstructs the staged base64 ZIP,
installs the new 1280px WebP masters, derives responsive 720px variants and
landscape/social crops, updates cache-busting references, writes evidence, then
removes the staging payload and itself.
"""

from __future__ import annotations

import base64
import hashlib
import io
import json
import shutil
import zipfile
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
STAGING = ROOT / ".image-pack-v20"
EXPECTED_SHA256 = "6bcec6c685f2c6df177e0088d442fa892b6beae60430c6657565bb62cc64862b"
ASSETS = ROOT / "assets" / "images"


def safe_extract(archive: zipfile.ZipFile, destination: Path) -> None:
    destination = destination.resolve()
    for member in archive.infolist():
        target = (destination / member.filename).resolve()
        if destination not in target.parents and target != destination:
            raise RuntimeError(f"Unsafe ZIP member: {member.filename}")
    archive.extractall(destination)


def save_webp(image: Image.Image, path: Path, quality: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(
        path,
        "WEBP",
        quality=quality,
        method=6,
        exact=True,
    )


def save_jpeg(image: Image.Image, path: Path, quality: int = 88) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(
        path,
        "JPEG",
        quality=quality,
        optimize=True,
        progressive=True,
        subsampling="4:2:0",
    )


def make_landscape_with_context(source: Image.Image, size: tuple[int, int]) -> Image.Image:
    """Convert portrait to landscape without cutting the couple from the frame."""
    width, height = size
    background = ImageOps.fit(source, size, method=Image.Resampling.LANCZOS)
    background = background.filter(ImageFilter.GaussianBlur(max(14, width // 44)))
    background = ImageEnhance.Brightness(background).enhance(0.48)

    foreground = ImageOps.contain(source, (width, height), method=Image.Resampling.LANCZOS)
    canvas = background.copy()
    x = (width - foreground.width) // 2
    y = (height - foreground.height) // 2
    canvas.paste(foreground, (x, y))
    return canvas


def output_record(asset: str, source: dict[str, object]) -> dict[str, object]:
    outputs: dict[str, object] = {}
    for label, path in (
        ("720", ASSETS / f"{asset}-720.webp"),
        ("1280", ASSETS / f"{asset}-1280.webp"),
    ):
        with Image.open(path) as image:
            outputs[label] = {
                "size": list(image.size),
                "bytes": path.stat().st_size,
                "format": image.format,
                "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            }
    return {
        "asset": asset,
        "source": source["source"],
        "original_size": source["sourceSize"],
        "original_bytes": source["sourceBytes"],
        "outputs": outputs,
    }


def update_source_references() -> None:
    index_path = ROOT / "index.html"
    index = index_path.read_text(encoding="utf-8")
    index = index.replace("?v=18.2", "?v=20")
    index = index.replace("?v=16", "?v=20")
    index = index.replace("assets/images/meta-v3.jpg", "assets/images/meta-v4.jpg")
    index_path.write_text(index, encoding="utf-8")


def write_mapping(manifest: dict[str, object]) -> None:
    rows = []
    roles = {
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
    for item in manifest["assets"]:
        asset = str(item["asset"])
        rows.append(f"| `{item['source']}` | `{asset}` | {roles[asset]} |")

    content = """# Ánh xạ ảnh Wedding Xuân & Phượng — v20

## Nguồn ảnh Photoshop mới

| File tải lên | Key website | Vai trò |
|---|---|---|
""" + "\n".join(rows) + """

## Quy tắc xử lý

- Chỉ đổi định dạng, kích thước và tỷ lệ hiển thị; không thay đổi người, khuôn mặt hay bối cảnh.
- Ảnh dọc được chuẩn hóa 2:3 ở 720 × 1080 và 1280 × 1920.
- Định dạng WebP, bỏ metadata không cần thiết, giữ chất lượng phù hợp cho website.
- Ảnh `couple-intimate-landscape-*` giữ trọn khung người ở giữa và dùng chính ảnh làm nền mở rộng mờ, tránh crop vào mặt.
- Ảnh chia sẻ `meta-v4.jpg` là crop ngang từ ảnh studio mới, 1200 × 630.
- Header Google Forms `google-forms-header-xuan-phuong-v3.jpg` là crop ngang từ ảnh trang trọng mới, 1600 × 400.
- Các JPG gốc không được đưa lên GitHub Pages.

## Thứ tự kể chuyện giữ nguyên

Hero → chân dung riêng → cận cảnh thân mật → ánh nhìn → trang trọng → vui tươi → áo dài → tư thế ngồi → studio → toàn thân → kết bằng khoảnh khắc trong vườn.
"""
    (ROOT / "IMAGE-MAP-V20.md").write_text(content, encoding="utf-8")


def main() -> int:
    parts = sorted(STAGING.glob("part-*.b64"))
    if not parts:
        raise RuntimeError("No staged image-pack chunks found")

    encoded = "".join(part.read_text(encoding="ascii").strip() for part in parts)
    payload = base64.b64decode(encoded, validate=True)
    digest = hashlib.sha256(payload).hexdigest()
    print(f"INFO: staged image pack sha256={digest}; expected={EXPECTED_SHA256}")
    if not zipfile.is_zipfile(io.BytesIO(payload)):
        raise RuntimeError(f"Staged image pack is not a valid ZIP: {digest}")

    with zipfile.ZipFile(io.BytesIO(payload)) as archive:
        safe_extract(archive, ROOT)

    manifest_path = ROOT / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest_path.unlink()

    report = []
    for item in manifest["assets"]:
        asset = str(item["asset"])
        master_path = ASSETS / f"{asset}-1280.webp"
        with Image.open(master_path) as master:
            master = ImageOps.exif_transpose(master).convert("RGB")
            if master.size != (1280, 1920):
                master = ImageOps.fit(
                    master,
                    (1280, 1920),
                    method=Image.Resampling.LANCZOS,
                    centering=(0.5, 0.5),
                )
                save_webp(master, master_path, 81)
            responsive = master.resize((720, 1080), Image.Resampling.LANCZOS)
            save_webp(responsive, ASSETS / f"{asset}-720.webp", 78)
        report.append(output_record(asset, item))

    with Image.open(ASSETS / "couple-intimate-1280.webp") as intimate:
        intimate = intimate.convert("RGB")
        save_webp(
            make_landscape_with_context(intimate, (1280, 720)),
            ASSETS / "couple-intimate-landscape-1280.webp",
            80,
        )
        save_webp(
            make_landscape_with_context(intimate, (720, 405)),
            ASSETS / "couple-intimate-landscape-720.webp",
            77,
        )

    with Image.open(ASSETS / "couple-studio-1280.webp") as studio:
        meta = ImageOps.fit(
            studio.convert("RGB"),
            (1200, 630),
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.23),
        )
        save_jpeg(meta, ASSETS / "meta-v4.jpg", 89)

    with Image.open(ASSETS / "couple-formal-1280.webp") as formal:
        header = ImageOps.fit(
            formal.convert("RGB"),
            (1600, 400),
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.27),
        )
        save_jpeg(
            header,
            ASSETS / "google-forms-header-xuan-phuong-v3.jpg",
            88,
        )

    (ROOT / "image-optimization-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    update_source_references()
    write_mapping(manifest)

    shutil.rmtree(STAGING)
    Path(__file__).unlink()
    workflow = ROOT / ".github" / "workflows" / "materialize-image-pack-v20.yml"
    workflow.unlink(missing_ok=True)

    print(f"PASS: materialized {len(report)} Photoshop sources as responsive v20 assets")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

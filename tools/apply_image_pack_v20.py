#!/usr/bin/env python3
"""Install the recovered Photoshop image pack and generate production derivatives."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import zipfile
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

EXPECTED_SHA256 = "afca17358afe24cd9f199a68da4332cc2cef42520fede19ccbea294dcb7387c0"


def safe_extract(archive: zipfile.ZipFile, destination: Path) -> None:
    base = destination.resolve()
    for member in archive.infolist():
        target = (destination / member.filename).resolve()
        if target != base and base not in target.parents:
            raise RuntimeError(f"Unsafe ZIP member: {member.filename}")
    archive.extractall(destination)


def save_webp(image: Image.Image, path: Path, quality: int) -> None:
    image.convert("RGB").save(path, "WEBP", quality=quality, method=6, exact=True)


def save_jpeg(image: Image.Image, path: Path, quality: int) -> None:
    image.convert("RGB").save(
        path,
        "JPEG",
        quality=quality,
        optimize=True,
        progressive=True,
        subsampling="4:2:0",
    )


def make_landscape_with_context(source: Image.Image, size: tuple[int, int]) -> Image.Image:
    width, height = size
    background = ImageOps.fit(source, size, method=Image.Resampling.LANCZOS)
    background = background.filter(ImageFilter.GaussianBlur(max(14, width // 44)))
    background = ImageEnhance.Brightness(background).enhance(0.52)
    foreground = ImageOps.contain(source, size, method=Image.Resampling.LANCZOS)
    canvas = background.copy()
    canvas.paste(foreground, ((width - foreground.width) // 2, (height - foreground.height) // 2))
    return canvas


def replace_text(path: Path, replacements: tuple[tuple[str, str], ...]) -> None:
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    updated = text
    for old, new in replacements:
        updated = updated.replace(old, new)
    if updated != text:
        path.write_text(updated, encoding="utf-8")


def image_record(path: Path) -> dict[str, object]:
    with Image.open(path) as image:
        return {
            "path": str(path),
            "width": image.width,
            "height": image.height,
            "format": image.format,
            "bytes": path.stat().st_size,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True)
    parser.add_argument("--zip", required=True)
    args = parser.parse_args()

    root = Path(args.root).resolve()
    archive_path = Path(args.zip).resolve()
    observed = hashlib.sha256(archive_path.read_bytes()).hexdigest()
    if observed != EXPECTED_SHA256:
        raise RuntimeError(f"ZIP checksum mismatch: {observed}")

    assets = root / "assets" / "images"
    assets.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(archive_path) as archive:
        safe_extract(archive, root)

    manifest_path = root / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest_path.unlink()

    outputs: list[dict[str, object]] = []
    for item in manifest["assets"]:
        asset = str(item["asset"])
        master_path = assets / f"{asset}-1280.webp"
        with Image.open(master_path) as source:
            source = ImageOps.exif_transpose(source).convert("RGB")
            master = ImageOps.fit(
                source,
                (1280, 1920),
                method=Image.Resampling.LANCZOS,
                centering=(0.5, 0.5),
            )
            save_webp(master, master_path, 85)
            responsive = master.resize((720, 1080), Image.Resampling.LANCZOS)
            responsive_path = assets / f"{asset}-720.webp"
            save_webp(responsive, responsive_path, 82)
        outputs.extend([image_record(master_path), image_record(responsive_path)])

    with Image.open(assets / "couple-intimate-1280.webp") as intimate:
        intimate = intimate.convert("RGB")
        for size, quality in (((1280, 720), 84), ((720, 405), 81)):
            path = assets / f"couple-intimate-landscape-{size[0]}.webp"
            save_webp(make_landscape_with_context(intimate, size), path, quality)
            outputs.append(image_record(path))

    with Image.open(assets / "couple-studio-1280.webp") as studio:
        studio = studio.convert("RGB")
        meta = ImageOps.fit(
            studio,
            (1200, 630),
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.24),
        )
        meta_path = assets / "meta-v4.jpg"
        save_jpeg(meta, meta_path, 90)
        outputs.append(image_record(meta_path))

        header = ImageOps.fit(
            studio,
            (1600, 400),
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.22),
        )
        header_path = assets / "google-forms-header-xuan-phuong-v3.jpg"
        save_jpeg(header, header_path, 89)
        outputs.append(image_record(header_path))

    replacements = (
        ("?v=18.2", "?v=20"),
        ("?v=16", "?v=20"),
        ("assets/images/meta-v3.jpg", "assets/images/meta-v4.jpg"),
        ("meta-v3.jpg", "meta-v4.jpg"),
        ("google-forms-header-xuan-phuong-v2.jpg", "google-forms-header-xuan-phuong-v3.jpg"),
    )
    for relative in (
        "index.html",
        "app.js",
        "tools/build-dist.py",
        "tests/share_entry_pages_check.py",
        "IMAGE-MAP.md",
    ):
        replace_text(root / relative, replacements)

    old_meta = assets / "meta-v3.jpg"
    if old_meta.exists():
        old_meta.unlink()

    mapping_lines = [
        "# Ánh xạ ảnh Wedding Xuân & Phượng — v20",
        "",
        "| File Photoshop | Asset website |",
        "|---|---|",
    ]
    for item in manifest["assets"]:
        mapping_lines.append(f"| `{item['source']}` | `{item['asset']}` |")
    mapping_lines.extend(
        [
            "",
            "- Ảnh dọc: WebP 720 × 1080 và 1280 × 1920.",
            "- Ảnh ngang: WebP 720 × 405 và 1280 × 720, giữ trọn chủ thể bằng nền mở rộng mờ.",
            "- Ảnh chia sẻ: `meta-v4.jpg`, 1200 × 630.",
            "- Header Google Forms: `google-forms-header-xuan-phuong-v3.jpg`, 1600 × 400.",
            "- Không đưa JPG Photoshop gốc vào bản deploy.",
            "",
        ]
    )
    (root / "IMAGE-MAP-V20.md").write_text("\n".join(mapping_lines), encoding="utf-8")

    report = {
        "packSha256": observed,
        "sourceCount": len(manifest["assets"]),
        "outputCount": len(outputs),
        "totalBytes": sum(int(item["bytes"]) for item in outputs),
        "outputs": outputs,
    }
    (root / "image-optimization-report-v20.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    # Remove temporary staging and one-off recovery material from the image branch.
    shutil.rmtree(root / ".image-pack-v20", ignore_errors=True)
    for relative in (
        ".github/workflows/materialize-image-pack-v20.yml",
        ".github/workflows/diagnose-image-pack-v20.yml",
        ".github/workflows/diagnose-old-image-pack.yml",
        "tools/materialize_image_pack_v20.py",
        "tools/diagnose_image_pack_v20.py",
        "reports/materialize-image-pack-v20.log",
        "reports/image-pack-v20-diagnostic.json",
        "reports/old-image-pack-diagnosis.json",
        "noop",
        "temp-test-path.txt",
    ):
        path = root / relative
        if path.is_file():
            path.unlink()

    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

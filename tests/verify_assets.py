from pathlib import Path
from PIL import Image
import cv2
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

for path in sorted((ROOT / "assets").rglob("*")):
    if path.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp"}:
        continue
    try:
        with Image.open(path) as image:
            image.verify()
    except Exception as error:
        errors.append(f"Ảnh lỗi {path.relative_to(ROOT)}: {error}")

detector = cv2.QRCodeDetector()
for name in ["qr-nha-trai.png", "qr-nha-gai.png"]:
    path = ROOT / "assets" / "qr" / name
    image = cv2.imread(str(path))
    if image is None:
        errors.append(f"Không đọc được QR: {name}")
        continue
    value, _, _ = detector.detectAndDecode(image)
    if not value:
        errors.append(f"Không giải mã được QR: {name}")

if errors:
    print("FAIL")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("PASS: images and QR decode")

from pathlib import Path
from PIL import Image
import cv2
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
CONFIG = (ROOT / "config.js").read_text(encoding="utf-8")
errors = []


def parse_emv(payload):
    """Tách TLV theo EMVCo: mỗi phần tử là tag(2) + độ dài(2) + giá trị."""
    out, i = {}, 0
    while i + 4 <= len(payload):
        tag = payload[i:i + 2]
        try:
            length = int(payload[i + 2:i + 4])
        except ValueError:
            break
        out[tag] = payload[i + 4:i + 4 + length]
        i += 4 + length
    return out


# Chỉ tìm trong khối giftCatalog: `bride: {` còn xuất hiện trong SOURCE.events
# nên tra cứu trên toàn file sẽ lấy sai khối.
GIFT_CATALOG = re.search(r"giftCatalog: \{(.*?)\n    \},", CONFIG, re.S)


def read_gift(gift_id):
    """Đọc bankBin/qrAccountIdentifier của một gift từ giftCatalog trong config.js."""
    if not GIFT_CATALOG:
        return None
    block = re.search(gift_id + r": \{(.*?)\n      \}", GIFT_CATALOG.group(1), re.S)
    if not block:
        return None
    return dict(re.findall(r'(\w+): "([^"]*)"', block.group(1)))

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
        continue

    # Chỉ kiểm tra "giải mã được" là chưa đủ: QR nhà trai từng mã hoá một định
    # danh không hề xuất hiện trong config.js mà test vẫn xanh. Đối chiếu thẳng
    # payload EMVCo với giá trị đã khai báo để hai bên không thể lệch nhau.
    gift_id = "groom" if "trai" in name else "bride"
    gift = read_gift(gift_id)
    if not gift:
        errors.append(f"Không đọc được giftCatalog.{gift_id} trong config.js")
        continue

    # VietQR lồng hai lớp: tag 38 -> tag 01 -> { 00 = BIN, 01 = số/alias }.
    account = parse_emv(parse_emv(parse_emv(value).get("38", "")).get("01", ""))
    encoded_bin = account.get("00", "")
    encoded_id = account.get("01", "")
    if encoded_bin != gift.get("bankBin"):
        errors.append(
            f"{name}: BIN ngân hàng {encoded_bin!r} lệch config {gift.get('bankBin')!r}"
        )
    if encoded_id != gift.get("qrAccountIdentifier"):
        errors.append(
            f"{name}: QR mã hoá {encoded_id!r} lệch qrAccountIdentifier "
            f"{gift.get('qrAccountIdentifier')!r}"
        )

if errors:
    print("FAIL")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("PASS: images and QR decode")

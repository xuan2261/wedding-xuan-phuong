# Áp dụng mã QR ngân hàng v11

Ghi đè/thêm các file trong patch:

```text
config.js
index.html
assets/qr/qr-nha-trai.png
assets/qr/qr-nha-gai.png
assets/qr/README.md
CHANGELOG.md
README.md
reports/QR-VALIDATION-V11.json
```

Xóa hai file placeholder cũ nếu còn:

```text
assets/qr/qr-nha-trai.svg
assets/qr/qr-nha-gai.svg
```

Sau đó:

```powershell
git add .
git commit -m "Add verified MB and SHB VietQR codes"
git push
```

Không xóa `assets/audio/music.mp3`.

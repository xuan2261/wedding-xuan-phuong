# Cập nhật repository lên v7

## Phương án an toàn nhất: dùng patch

Gói patch chỉ có bốn file:

```text
index.html
styles.css
app.js
config.js
```

Ghi đè bốn file này ở thư mục gốc repository.

**Không xóa:**

```text
assets/audio/music.mp3
```

## PowerShell

```powershell
Set-Location -LiteralPath 'C:\DUONG_DAN\wedding-xuan-phuong'

Copy-Item 'C:\DUONG_DAN_PATCH\index.html' . -Force
Copy-Item 'C:\DUONG_DAN_PATCH\styles.css' . -Force
Copy-Item 'C:\DUONG_DAN_PATCH\app.js' . -Force
Copy-Item 'C:\DUONG_DAN_PATCH\config.js' . -Force

git add index.html styles.css app.js config.js
git commit -m "Review fonts, UX, music state and placeholder safety"
git push
```

## Kiểm tra sau deploy

1. Chờ GitHub Pages hoàn tất.
2. Mở cửa sổ ẩn danh.
3. Nhấn `Ctrl + F5`.
4. Kiểm tra:
   - Tên dùng font script rõ dấu.
   - Tiêu đề dùng serif.
   - Nội dung dùng sans.
   - Bấm “Mở thiệp” thì nhạc phát.
   - Pause hiện icon tắt.
   - Không thấy nút quà mừng khi tài khoản còn placeholder.
   - RSVP mở đúng Form.
   - Không tràn ngang trên điện thoại.

## Full source ZIP

Full source không kèm bản nhạc thương mại. Nếu thay toàn bộ repository bằng
full source, hãy chép file nhạc đang dùng trở lại:

```text
assets/audio/music.mp3
```

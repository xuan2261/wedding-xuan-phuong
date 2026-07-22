# Áp dụng bản sửa gửi lời chúc v13

## 1. GitHub Pages

Ghi đè:

```text
app.js
index.html
```

Không ghi đè `config.js`, nhờ đó URL Apps Script production được giữ nguyên.

```powershell
git add app.js index.html reports README.md CHANGELOG.md
git commit -m "Fix wishes postMessage response channel"
git push
```

## 2. Apps Script — bắt buộc

Ghi đè backend bằng:

```text
tools/wedding-wishes-webapp.gs
```

Sau đó:

```text
Deploy → Manage deployments → Edit
Version → New version
Deploy
```

Cập nhật đúng deployment hiện có để giữ nguyên URL `/exec`.

Nếu chỉ push GitHub mà không deploy Apps Script version mới, lỗi vẫn còn vì
Web App cũ vẫn chạy `window.parent.postMessage(...)`.

## 3. Kiểm tra

- Gửi lời chúc.
- Console không còn lỗi target origin.
- Form hiển thị thông báo gửi thành công.
- Google Sheet có hàng `pending`.

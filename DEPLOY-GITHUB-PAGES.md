# Deploy GitHub Pages — release v17

## Push source

```powershell
git add .
git commit -m "Release wedding website v17"
git push
```

## Pages settings

```text
Settings → Pages → Deploy from a branch
Branch: main
Folder: /root
```

Bật **Enforce HTTPS** sau khi Pages hoạt động.

## Xác minh đúng build

Source có marker:

```html
<meta name="wedding-build" content="v17-20260722">
```

Chạy:

```powershell
powershell -ExecutionPolicy Bypass -File tools/check-live-build.ps1
```

Nếu marker live khác `v17-20260722`, chưa gửi link cho khách.

## Apps Script

Sau khi thay backend, cập nhật deployment hiện có bằng một **New version** để giữ
nguyên URL `/exec`. Xem `WISHES-SETUP.md`.


## Apps Script bắt buộc

Source web mới yêu cầu backend `tools/wedding-wishes-webapp.gs` phiên bản 1.5.0.

```text
Deploy → Manage deployments → Edit
→ Version: New version
→ Deploy
```

Cập nhật đúng deployment hiện có để giữ URL `/exec`.

## Kiểm tra cá nhân hóa

Mở:

```text
https://xuan2261.github.io/wedding-xuan-phuong/#to=Gia%20đình%20cô%20Lan
```

Tên phải hiển thị bằng text thuần, không render HTML.

## Kiểm tra live

```powershell
powershell -ExecutionPolicy Bypass -File tools/check-live-build.ps1
```

Sau đó test:

```text
submit lời chúc → hàng pending → đổi approved → lời chúc xuất hiện
```

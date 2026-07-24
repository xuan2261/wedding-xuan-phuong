# Deploy GitHub Pages — v19 Multi-Event

## Cách khuyến nghị: GitHub Actions

1. Chép full source v19 vào repository.
2. Commit và push lên branch `main`.
3. Mở **Settings → Pages** và chọn nguồn **GitHub Actions**.
4. Theo dõi workflow **Verify and deploy wedding site**.
5. Chỉ gửi link khách khi workflow deploy hoàn tất.

Workflow thực hiện:

```text
verify source
→ test multi-event
→ browser smoke
→ build dist
→ verify dist
→ upload-pages-artifact
→ deploy-pages
→ kiểm tra marker live + release.json + 4 trang chia sẻ sự kiện
```

## Kiểm tra build live

```powershell
powershell -ExecutionPolicy Bypass -File tools/check-live-build.ps1
```

Marker cần thấy:

```html
<meta name="wedding-build" content="v19.4-20260724">
```

## Cổng phát hành

Không gửi link khách khi còn một trong các điều kiện:

- RSVP đa sự kiện chưa có URL.
- Nha Trang/Sài Gòn chưa có địa chỉ và map chính xác.
- Link nhà gái chưa xác minh pin.
- Chưa test Android, iPhone, Zalo và Messenger.


Có thể kiểm tra bằng Python:

```powershell
python tools/check-live-build.py
```

Trang chia sẻ cần tồn tại:

```text
events/bride/
events/groom/
events/nhatrang/
events/saigon/
```

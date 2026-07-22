# Release review v16

## Verdict

```text
PASS_READY_FOR_DEPLOYMENT
```

## Hình ảnh

- 11 ảnh nguồn đã được ánh xạ vào website.
- 22 file WebP responsive: 720 px và 1280 px.
- `DRS06828` dùng làm feature-photo cỡ lớn.
- `DRS07290` được thêm vào album và lightbox.
- `DRS07446` dùng làm ảnh kết.
- Ảnh chia sẻ mạng xã hội và Google Forms header đã dùng bản studio mới.
- Hero tiếp tục không lazy-load và có `fetchpriority="high"`.
- Ảnh dưới màn hình đầu tiếp tục dùng `loading="lazy"`.

## Chức năng được giữ nguyên

- RSVP.
- QR MB Bank và SHB Bank.
- Nhạc.
- Sổ lời chúc và Apps Script backend 1.4.0.
- Hợp đồng thành công `payload.ok && payload.stored === true`.
- Thông tin ngày giờ, địa điểm và liên hệ.

## Gate đã vượt

- Static release check.
- Wishes storage contract.
- JavaScript syntax.
- Ba Apps Script syntax.
- Giải mã toàn bộ ảnh.
- Browser visual smoke ở 5 viewport.
- Không có horizontal overflow.
- Album có 9 ảnh và lightbox ảnh mới dùng bản 1280 px.

## Hạn chế kiểm thử trình duyệt

Browser smoke dùng inline harness vì môi trường chặn localhost/file navigation.
Do đó kiểm tra được DOM, layout, ảnh và lightbox, nhưng không đo HTTP cache,
GitHub Pages CDN hoặc độ trễ Apps Script live.

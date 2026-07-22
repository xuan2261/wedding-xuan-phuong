# Thiệp cưới Thanh Xuân & Thị Phượng

Build hiện tại: **v18-20260722**.

## Thông tin đã xác nhận

- Lễ Thành Hôn: **08h30, ngày 30.07.2026**.
- Đón khách dự tiệc: **10h00**.
- Địa điểm: Tư gia nhà trai, 346 Nguyễn Huệ, Xã Bình Dương, Tỉnh Gia Lai.
- RSVP trước: **28.07.2026**.

## Cấu trúc

```text
index.html
styles.css
app.js
config.js
assets/
tools/
tests/
reports/
```

## Sổ lời chúc

Tính năng đang bật trong `config.js`. Backend production là:

```text
tools/wedding-wishes-webapp.gs
```

Website chỉ báo thành công khi Apps Script xác nhận `stored: true`. Xem
`WISHES-SETUP.md` để repair Sheet, deploy version mới và kiểm thử.

## QR mừng cưới

Website dùng hai PNG đã xác minh trong `assets/qr/`. Hai SVG là bản dự phòng nhúng
chính xác PNG tương ứng, không phải placeholder.

## Nhạc

Source này **có kèm**:

```text
assets/audio/music.mp3
```

Audio dùng `preload="none"` và chỉ bắt đầu sau tương tác của người dùng theo giới
hạn autoplay của trình duyệt.

## Deploy GitHub Pages

Xem `DEPLOY-GITHUB-PAGES.md`. Sau khi push, chạy:

```powershell
powershell -ExecutionPolicy Bypass -File tools/check-live-build.ps1
```

Trang live phải chứa build marker `v17-20260722`.

## Kiểm tra source

```powershell
python tests/verify_release.py
node tests/contract_check.js
node --check app.js
node --check config.js
```

GitHub Actions cũng chạy các gate này trong `.github/workflows/verify-pages.yml`.

## Riêng tư

Website là public-link và chứa ảnh, địa chỉ, số điện thoại cùng thông tin ngân
hàng. `noindex` không phải mật khẩu. Xem `PRIVACY.md`.


## Bản ảnh v16

- Dùng lại toàn bộ 8 ảnh đã chỉnh mới.
- Thêm `DRS06828` làm ảnh cảm xúc cỡ lớn.
- Thêm `DRS07290` vào album.
- Dùng `DRS07446` làm ảnh kết.
- Tạo 22 file WebP responsive ở 720 px và 1280 px.
- Giữ hero không lazy-load và duy trì `fetchpriority="high"`.
- Các ảnh dưới màn hình đầu vẫn dùng `loading="lazy"`.


## Nâng cấp v17

- Lời mời cá nhân hóa bằng `#to=...`, fallback **Quý vị**.
- Công cụ offline `tools/create-guest-links.html`.
- Google Forms có thể prefill tên khi cấu hình `rsvp.guestNameEntry`.
- Timeline rõ hai mốc **08h30** và **10h00**.
- Nút **Thêm vào lịch**, **Chia sẻ thiệp**, **Sao chép địa chỉ** và **Liên hệ chỉ đường**.
- Khối thông tin hai gia đình tự ẩn đến khi có dữ liệu thật.
- Lightbox có trước/sau, bộ đếm, phím mũi tên và swipe.
- Backend lời chúc 1.5.0: CacheService TTL hợp lệ và cache best-effort.
- CI có static, contract, personalization, image/QR và browser smoke.

Xem:

- `PERSONALIZATION-SETUP.md`
- `CALENDAR-SETUP.md`
- `reports/RELEASE-REVIEW-V17.md`


## Nâng cấp v18

- RSVP mở trong popup; Google Form chỉ tải sau khi khách bấm.
- Có nút mở Form toàn màn hình khi trình duyệt nhúng không thuận tiện.
- Bản đồ mở trong popup lazy-load và giữ nút Google Maps để điều hướng.
- Hiệu ứng được lưu local trong `assets/css/wedding-motion.css`.
- Google Fonts vẫn dùng Be Vietnam Pro, Lora và Dancing Script.
- Nhạc `Váy Cưới` dùng MP3 local trước, URL Pancake làm nguồn dự phòng.
- Dữ liệu cốt lõi được kiểm tra qua `tools/wedding-data.json`.

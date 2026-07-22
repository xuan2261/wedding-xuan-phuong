# Release review v17 — Wedding Xuân & Phượng

## Verdict

```text
PASS_READY_FOR_DEPLOYMENT
OPTIONAL_CONFIG_PENDING
LIVE_DEPLOYMENT_NOT_PERFORMED
```

## Đã triển khai

### v16.1 correctness/performance

- Cache TTL chống trùng giảm từ 86400 xuống 21600 giây.
- Cache put/remove được bọc best-effort sau khi xác minh Sheet đã lưu.
- Backend nâng lên 1.5.0.
- Bỏ startup autoplay; nhạc chỉ phát sau Mở thiệp hoặc nút nhạc.
- Sửa `sizes` ảnh wide.
- Bỏ empty `src` của lightbox.

### v17 guest experience

- Lời mời theo `#to=...`, fallback **Quý vị**.
- Không dùng `innerHTML`; tên được giới hạn 80 ký tự.
- Mặc định không lưu tên trong session trên thiết bị dùng chung.
- Tool offline tạo link cá nhân hóa và CSV.
- RSVP prefill sẵn sàng qua `rsvp.guestNameEntry`.
- Family section tự ẩn khi chưa có dữ liệu.
- Timeline 08h30/10h00.
- Copy địa chỉ, gọi hỗ trợ chỉ đường.
- ICS có hai VEVENT, không bịa giờ kết thúc.
- Web Share và clipboard fallback.
- Lightbox prev/next/counter/keyboard/swipe, preload một ảnh kế tiếp.
- CI browser/image/QR/personalization gates.

## Không thay đổi dữ liệu production

- URL Google Forms.
- URL Apps Script.
- QR MB Bank và SHB Bank.
- Tài khoản ngân hàng.
- File nhạc hiện có.
- 11 ảnh nguồn / 22 WebP responsive.
- Ngày, địa điểm, số điện thoại.

## Cấu hình đang chờ dữ liệu thật

1. `families.enabled` đang `false`; cần tên cha mẹ nếu muốn hiển thị.
2. `rsvp.guestNameEntry` đang trống; Form vẫn mở bình thường nhưng chưa prefill tên.
3. `landmarkNote`, `entranceNote`, `parkingNote` đang trống và tự ẩn.
4. Chưa có giờ kết thúc; ICS dùng hai sự kiện bắt đầu 08h30 và 10h00, không có DTEND.

## Test evidence

- Executable gates: **11/11 PASS**
- Duplicate HTML IDs: **0**
- Missing local assets: **0**
- CSS parse errors: **0**
- Raster images decoded: **30**
- Image failures: **0**
- Browser smoke viewports: **5 PASS**
- Horizontal overflow: **0**
- Initial wishes requests: **0**
- Requests near wishes section: **1**
- Audio paused on initial load: **PASS**
- Closed lightbox display none: **PASS**

## Deployment requirement

1. Push full source v17 to `main`.
2. Update existing Apps Script Web App to backend 1.5.0 using **New version**.
3. Run `tools/check-live-build.ps1`.
4. Test live submit → pending row → approved → public display.

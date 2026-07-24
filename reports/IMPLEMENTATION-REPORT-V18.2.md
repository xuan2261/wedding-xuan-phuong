# Wedding Xuân & Phượng v18.2 — Implementation report

**Build:** `v18.2-20260723`  
**Base:** `v18.1-20260722`  
**Verdict:** `PASS_SOURCE_RELEASE_CANDIDATE_LIVE_DEPLOYMENT_REQUIRED`

## 13-skill workflow

```text
brainstorm → planning → architecture/design → UI/UX → code review
→ debug/root-cause → fix/cook → static/visual/browser test
→ optimization loop → Fable evidence judge
```

## Đã thực hiện

- Tạo crop ngang thật 1280×720 và 720×405 cho ảnh feature.
- Dùng `<picture>`: mobile giữ ảnh dọc; tablet/desktop dùng ảnh ngang.
- Thêm trạng thái trước ngày cưới, ngày cưới và hậu đám cưới.
- Tự đóng nút RSVP sau 00:00 ngày 29/07/2026.
- Không tự ẩn phần mừng cưới vì gia đình chưa chọn ngày ẩn.
- QR mừng cưới chỉ được dựng/tải ở lần mở dialog đầu tiên.
- Form lời chúc focus trường lỗi đầu tiên và đặt `aria-invalid`.
- Thêm Apps Script lấy `guestNameEntry` từ URL prefill chính thức của Form.
- Đồng bộ cách xưng hô Google Form sang “Quý vị”.
- Xóa asset meta/header trùng; giữ `meta-v3.jpg` và header v2.
- Cập nhật ICS PRODID v18.2; không đoán giờ kết thúc.
- Thêm generator ICS yêu cầu giờ kết thúc thật.
- Tạo `dist/` sạch và CI kiểm tra dist.

## Kết quả

```text
Static/contract gates              PASS
Image and QR decode                PASS
Clean dist                         PASS
7 viewport visual/browser harness PASS
Wedding-day lifecycle              PASS
Post-wedding lifecycle             PASS
Feature mobile face crop           PASS
Feature desktop face/hair crop     PASS
Initial gift QR requests           0
QR requests after first open       2
```

## Chưa thể thực hiện tự động

- Deploy GitHub Pages.
- Thay nội dung Google Form live.
- Lấy `guestNameEntry` vì cần chạy trong tài khoản Apps Script sở hữu Form.
- Kiểm thử thiết bị Android/iPhone vật lý và trình duyệt in-app.
- Tạo DTEND chính xác khi chưa có giờ kết thúc thật.

# Wedding Xuân & Phượng — v20.2 Multi-Event Journey

Build hiện tại: **v20.2-20260726** — AK-DEBUG Full Audit & Deploy Hardening.

Website phục vụ bốn sự kiện:

| ID | Sự kiện | Ngày |
|---|---|---|
| `bride` | Tiệc cưới nhà gái | 29/07/2026 |
| `groom` | Lễ Thành Hôn và tiệc nhà trai | 30/07/2026 |
| `nhatrang` | Tiệc Báo Hỷ tại Nha Trang | 15/08/2026 |
| `saigon` | Tiệc Báo Hỷ tại Sài Gòn | 22/08/2026 |

## Nâng cấp v20.2

- Biểu mẫu **Xác nhận tham dự ngay trên thiệp**, đã nối vào Google Sheet dùng
  chung với sổ lời chúc (cùng một Apps Script Web App). Xem `RSVP-FORM-SETUP.md`.
- Hạn xác nhận tham dự: 23:59 một ngày trước mỗi sự kiện. Sau hạn biểu mẫu tự ẩn
  nhưng vẫn giữ nút **Liên hệ xác nhận**.
- Quà mừng cưới tách thành **hai nút riêng** cho chú rể và cô dâu, hiện ở cả bốn
  sự kiện, kèm một dòng ghi chú nhẹ đặt sự hiện diện của khách lên trước.
- Tải lại trang luôn mở từ đầu thiệp thay vì rơi vào giữa nội dung sau màn bìa.
- Tự xem chỉ dừng khi khách cuộn thật; chạm hoặc click để ngắm không còn làm chết tour.
- Chế độ tiết giảm chuyển động vẫn tự đi qua từng phần (nhảy tức thì) và vẫn có thanh điều khiển.
- Thiệp tôn trọng Data Saver/mạng 2G: không tự chạy, không tự phát nhạc và giảm preload ảnh.
- Cover xử lý tên khách dài và chuyển focus đúng sau khi mở.
- `tools/create-guest-links.html` hỗ trợ CSV riêng cho từng khách/sự kiện.


## Link cá nhân hóa

```text
#to=Gia%20đình%20cô%20Lan&event=bride
#to=Anh%20Minh&event=groom
#to=Chị%20Hương&event=nhatrang
#to=Nhóm%20bạn&events=nhatrang,saigon&event=nhatrang
```

Link cũ chỉ có `#to=...` vẫn mở sự kiện `groom`.

Link mới do công cụ tạo sẽ đi qua trang chia sẻ tĩnh theo sự kiện, ví dụ:

```text
https://xuan2261.github.io/wedding-xuan-phuong/events/groom/#to=Anh%20Minh&event=groom
```

Cấu trúc này cung cấp Open Graph metadata đúng sự kiện trước khi chuyển về website chính.

## Trạng thái an toàn

- Biểu mẫu xác nhận tham dự đã hoạt động; nút **Liên hệ xác nhận** giữ vai trò dự phòng.
- Luồng Google Form đa sự kiện cũ giữ nguyên làm phương án dự phòng, đang tắt.
- Popup map chỉ bật cho nhà trai; link nhà gái được giữ dưới dạng mở ngoài.
- Map Nha Trang/Sài Gòn chưa dùng vì link cung cấp trùng link nhà gái.
- Địa chỉ Nha Trang/Sài Gòn, giờ kết thúc và phân nhóm khách còn là dữ liệu nháp.

## Kiểm tra

```powershell
npm ci
python tests/consistency_check.py
python tests/build_metadata_check.py
python tests/verify_release.py
node tests/multi_event_check.mjs
node tests/rsvp_form_check.mjs
node tests/story_asset_preload_check.mjs
python tools/build-dist.py
python tests/share_entry_pages_check.py
python tests/verify_dist.py
npm run test:browser
npm run test:visual-safe-zones
```

## Triển khai

Workflow `.github/workflows/verify-pages.yml` sẽ kiểm tra, dựng `dist`, upload artifact và deploy GitHub Pages khi push lên `main`.

Xem:

- `MULTI-EVENT-SETUP.md`
- `RSVP-FORM-SETUP.md`
- `DEPLOY-GITHUB-PAGES.md`
- `tools/create-google-forms-rsvp-multi-event.gs`
- `tools/create-guest-links.html`


## Trải nghiệm mở thiệp

- Bìa xanh rừng và con dấu XP hiển thị trước hero.
- Bấm **Mở thiệp** để mở hai cánh, phát nhạc và tùy chọn tự động xem từng phần.
- Cuộn hoặc dùng bàn phím sẽ tạm dừng tự động xem; chạm để ngắm thì không.
- Có thể kiểm thử nhanh bằng `?skipCover=1`.


## Hardening v20.2

- Bốn trang chia sẻ tĩnh có Open Graph metadata riêng cho nhà gái, nhà trai, Nha Trang và Sài Gòn.
- Auto-story chuẩn bị và giải mã ảnh của chương kế trước khi cuộn tới, có timeout bảo vệ.
- Nhạc dùng timestamp của chính `requestAnimationFrame`, pause khi tab bị ẩn và không tự bật lại.
- Story chapter có `aria-live`; debug state dùng `data-story-chapter-index` để không xung đột selector.
- Workflow kiểm tra marker live, `release.json` và đủ bốn trang sự kiện sau deploy.

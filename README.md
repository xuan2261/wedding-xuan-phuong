# Wedding Xuân & Phượng — v19 Multi-Event Journey

Build hiện tại: **v19.4-20260724** — Share Preview & Guided Story Hardening.

Website phục vụ bốn sự kiện:

| ID | Sự kiện | Ngày |
|---|---|---|
| `bride` | Tiệc cưới nhà gái | 29/07/2026 |
| `groom` | Lễ Thành Hôn và tiệc nhà trai | 30/07/2026 |
| `nhatrang` | Tiệc Báo Hỷ tại Nha Trang | 15/08/2026 |
| `saigon` | Tiệc Báo Hỷ tại Sài Gòn | 22/08/2026 |

## Nâng cấp v19.4

- RSVP chưa có Google Form vẫn hoạt động bằng **Liên hệ xác nhận** qua điện thoại.
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

- RSVP đang tắt cho đến khi tạo Google Form đa sự kiện mới.
- Popup map chỉ bật cho nhà trai; link nhà gái được giữ dưới dạng mở ngoài.
- Map Nha Trang/Sài Gòn chưa dùng vì link cung cấp trùng link nhà gái.
- Địa chỉ Nha Trang/Sài Gòn, deadline RSVP, giờ kết thúc và phân nhóm khách còn là dữ liệu nháp.

## Kiểm tra

```powershell
npm ci
python tests/consistency_check.py
python tests/verify_release.py
node tests/multi_event_check.mjs
node tests/story_asset_preload_check.mjs
python tools/build-dist.py
python tests/share_entry_pages_check.py
python tests/verify_dist.py
npm run test:browser
```

## Triển khai

Workflow `.github/workflows/verify-pages.yml` sẽ kiểm tra, dựng `dist`, upload artifact và deploy GitHub Pages khi push lên `main`.

Xem:

- `MULTI-EVENT-SETUP.md`
- `DEPLOY-GITHUB-PAGES.md`
- `tools/create-google-forms-rsvp-multi-event.gs`
- `tools/create-guest-links.html`


## Trải nghiệm mở thiệp v19.2

- Bìa xanh rừng và con dấu XP hiển thị trước hero.
- Bấm **Mở thiệp** để mở hai cánh, phát nhạc và tùy chọn tự động xem từng phần.
- Cuộn, chạm hoặc dùng bàn phím sẽ tạm dừng tự động xem.
- Có thể kiểm thử nhanh bằng `?skipCover=1`.


## Hardening v19.4

- Bốn trang chia sẻ tĩnh có Open Graph metadata riêng cho nhà gái, nhà trai, Nha Trang và Sài Gòn.
- Auto-story chuẩn bị và giải mã ảnh của chương kế trước khi cuộn tới, có timeout bảo vệ.
- Nhạc dùng timestamp của chính `requestAnimationFrame`, pause khi tab bị ẩn và không tự bật lại.
- Story chapter có `aria-live`; debug state dùng `data-story-chapter-index` để không xung đột selector.
- Workflow kiểm tra marker live, `release.json` và đủ bốn trang sự kiện sau deploy.

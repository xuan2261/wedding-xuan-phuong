# Debug — nút copy link, khoảng trống hộp QR, thanh điều khiển, kiểu tự cuộn

Ngày: 26/07/2026 · Nhánh: `main` (sau khi merge PR #21) · Phương pháp: đo bằng Playwright, server tĩnh nội bộ.

## Tóm tắt

| # | Vấn đề | Kết luận | Trạng thái |
|---|---|---|---|
| 1 | Nút "Sao chép link có tên này" | Thừa **và** có hại khi khách gửi tiếp | Đã gỡ |
| 2 | Hộp thoại QR trống nửa bên phải | Lưới 2 cột còn sót từ thời một nút mở cả hai tài khoản | Đã sửa |
| 3 | Thanh điều khiển chiếm chỗ | 244×61px cố định, 4,5% màn hình điện thoại | Đã gỡ |
| 4 | Tự cuộn nhảy chứ không trôi | `scrollIntoView` hoàn tất trong <1 khung hình | Đã thay bằng cuộn liên tục |

## 1. Nút "Sao chép link có tên này" (đã gỡ)

Nút sao chép link **mang tên chính khách đang xem** (`#to=Anh Minh`). Ba lý do gỡ:

- Khách đã có sẵn link đó — họ đang mở nó.
- Gửi tiếp cho người khác thì người nhận thấy sai tên: "Trân trọng kính mời **Anh Minh**". Nút "Chia sẻ thiệp" mới là đường đúng, nó dùng `sharePersonalizedByDefault: false` nên chia sẻ link sạch không tên.
- Công dụng thật (tạo link riêng cho từng khách) là việc của gia đình, và đã có `tools/create-guest-links.html` làm đúng việc đó.

Gỡ kèm cờ `sharing.personalizedCopyEnabled` vì không còn ai đọc.

## 2. Hộp thoại quà mừng trống nửa bên phải (đã sửa)

Đo ở bề ngang 900px, trước khi sửa:

```
grid rộng 650px · thẻ rộng 294px · columns: "294px 294px" · số thẻ: 1
```

Nguyên nhân: `@media (min-width: 660px) { .gift-grid { grid-template-columns: repeat(2, minmax(0,1fr)) } }` có từ thời một nút mở hộp thoại chứa **cả hai** tài khoản. Từ khi tách hai nút, mỗi hộp thoại chỉ còn một thẻ nên cột thứ hai thành khoảng trống bên phải mã QR.

Sửa: bỏ `.gift-grid` khỏi rule đó, giữ nguyên cho `.wishes-grid` (lời chúc vẫn nhiều thẻ). Sau khi sửa: `columns: "606px"`, thẻ dùng hết chiều ngang.

## 3. Thanh điều khiển theo chương (đã gỡ)

Đo được: 244×61px, cố định góc dưới trái, che nội dung suốt thời gian đọc — 4,5% diện tích màn hình 390×844.

Gỡ toàn bộ: markup, 15 rule CSS, và bộ máy chương trong `app.js` (nút tới/lui, bộ đếm, nhãn chương, thanh tiến độ).

## 4. Tự cuộn nhảy chứ không trôi (đã thay)

Đây là lỗi thật, không phải cảm giác. Đo bằng cách lấy mẫu `scrollY` theo từng khung hình:

```
scrollIntoView({behavior:"smooth"}) → sau 80ms đã ở 1843px (toàn bộ quãng đường)
scrollIntoView({behavior:"auto"})   → sau 80ms cũng 1843px
```

Hai lệnh cho kết quả **giống hệt nhau**: smooth không animate gì cả. Kiểm tra thêm cả `headless=true` và `headless=false` — như nhau. Nghĩa là mỗi lần chuyển chương, thiệp dịch chuyển tức thời rồi đứng yên 5-7 giây. Đúng như mô tả "nhảy tới từng vị trí".

Ngay cả khi smooth có animate, Chrome cũng chỉ chạy ~300-500ms bất kể quãng đường, nên 855px vẫn là một cú vụt rồi đứng im — không phải "cuộn xuống dần dần".

Thay bằng bộ tự cuộn liên tục (`setupAutoScroll`):

- Cộng dồn vị trí theo **thời gian thực** (`speed * elapsed / 1000`) nên tốc độ không đổi theo tốc độ máy.
- Giữ phần lẻ dưới 1px qua từng khung hình; làm tròn sẽ khiến tốc độ chậm bị mất mát và đứng im.
- Tắt `scroll-behavior: smooth` của trang trong lúc trôi bằng `html.is-auto-scrolling`. Không tắt thì mỗi bước nhỏ lại thành một hoạt cảnh riêng và thiệp đứng ì.
- Lưới an toàn: mỗi khung hình so vị trí thật với vị trí vừa đặt, lệch quá 2px thì dừng. Bắt được cả cách cuộn không phát ra `wheel`/`touchmove` (kéo thanh cuộn, phím).

Đo sau khi sửa:

```
Trong 10,0s: di chuyển 400px · tốc độ 40,0 px/s
Bước nhảy lớn nhất giữa 2 khung hình: 1,00px
Khách lăn chuột → state=paused reason=interaction · y giữ nguyên
```

## Dọn theo

`prepareStoryAssets` (preload + decode ảnh chương kế) sinh ra vì kiểu nhảy chương vượt qua lazy-load của trình duyệt. Cuộn 40px/s cho trình duyệt thừa thời gian tự lazy-load (Chrome nạp trước ~1250px, tương đương 30 giây), nên hàm này mất lý do tồn tại và đã được gỡ cùng các cờ `preloadNextScene`, `preloadImageLimit`, `preloadWaitMs`, `constrainedPreloadImageLimit`.

Các thuộc tính `data-story-stop` / `data-story-title` / `data-story-hold` (24 thuộc tính trên 8 phần) cũng đã gỡ vì không còn gì đọc tới.

Giữ lại `disableAutoStoryOnConstrainedNetwork`: trên mạng 2G vẫn không tự cuộn, vì cuộn tự động kéo ảnh nhanh hơn khách tự đọc.

## Kiểm thử

`npm test` — 19/19 PASS (một bộ ít hơn trước vì đã gỡ `story_asset_preload_check.mjs`).

Test được cập nhật **có chủ đích** vì hợp đồng đã đổi, không phải nới lỏng:

| Test | Thay đổi |
|---|---|
| `story_asset_preload_check.mjs` | Gỡ — hợp đồng preload không còn tồn tại |
| `audio_story_regression_check.mjs` | Thay assertion chương bằng assertion cuộn liên tục, tốc độ trong [20,80] px/s, có lưới an toàn |
| `audio_story_browser_regression.mjs` | **Đo chuyển động thật**: lấy mẫu theo khung hình, bắt buộc bước nhảy lớn nhất ≤8px. Test này sẽ bắt được đúng lỗi gốc (bước nhảy 855px) |
| `opening_experience_check.mjs` | Đổi sang khẳng định thanh điều khiển **không** quay lại DOM/CSS |
| `verify_release.py`, `verify_dist.py` | Như trên |
| `release_hardening_check.mjs` | Đổi từ preload sang "không tự cuộn trên mạng hạn chế" |
| `browser_smoke.mjs` | Khẳng định nút copy link có tên không quay lại |

## Câu hỏi còn mở

1. Tốc độ 40px/s có vừa không? Đọc hết thiệp (~10.750px) mất khoảng 4,5 phút. Muốn nhanh/chậm hơn thì đổi `autoScrollSpeedPxPerSecond`.
2. Khách đã cuộn tay thì tự cuộn dừng hẳn, không có cách bật lại (đúng như lựa chọn "bỏ thanh điều khiển"). Nếu sau này thấy cần, có thể thêm lại một nút tròn nhỏ.

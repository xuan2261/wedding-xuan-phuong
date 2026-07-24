# v19.2.1 — Audio Fade & Auto Story Hotfix (2026-07-24)

- Sửa `IndexSizeError` khi Edge cung cấp timestamp `requestAnimationFrame` nhỏ hơn `performance.now()`.
- Clamp mọi giá trị âm lượng vào `[0, 1]` và thêm generation guard chống hai fade tranh chấp.
- Hủy fade khi tạm dừng nhạc.
- Khởi động story sau hai frame khi cover đóng; retry một lần nếu DOM chưa ổn định.
- Rút delay chương đầu từ 4,4 giây xuống 2,6 giây.
- Thêm trạng thái debug `data-story-state` và `data-story-autostart`.
- Thêm regression contract cho audio fade và auto-story.

# v19.2 — Cinematic Story 2.0 (2026-07-24)

- Audit lại toàn bộ v19.1 và sửa lỗi `sharing` của event Nha Trang bị lồng sai.
- Story Player 2.0 có phần trước/tiếp theo, tên chương, trạng thái Xem lại và đồng bộ khi cuộn tay.
- Thêm chế độ “Xem thiệp đơn giản”, không auto-story và không animation cinematic.
- Tạm dừng story rõ ràng khi mở bất kỳ dialog nào.
- Con dấu XP chỉ pulse hai chu kỳ thay vì animation vô hạn.
- Cover dùng ảnh responsive 720/1280 thay vì luôn tải ảnh 1280 trên mobile.
- Nhạc fade-in nhẹ, giảm âm lượng khi mở dialog và mặc định 35%.
- Tạo accent bìa riêng theo bốn sự kiện, vẫn giữ cùng nhận diện xanh–kem.
- `dist/` loại README, SVG QR và ảnh header Google Form không dùng ở runtime.

# Changelog

## v19.2 — Cinematic Opening & Guided Story

- Thêm bìa thiệp toàn màn hình theo phong cách xanh rừng, đường gấp đôi và con dấu XP.
- Nút Mở thiệp kích hoạt chuỗi mở hai cánh, làm lộ ảnh hero và bắt đầu nhạc trong thao tác người dùng.
- Thêm chế độ Tự động xem từng phần có nút phát/tạm dừng, tiến trình và tự dừng khi khách chạm/cuộn.
- Giữ fallback không JavaScript, hỗ trợ `prefers-reduced-motion` và không dùng thư viện animation bên ngoài.
- Bìa tự đổi tên khách, loại sự kiện, thứ và ngày cho bốn hồ sơ sự kiện.

## v19.0 — Multi-Event Wedding Journey

- Chuyển từ một sự kiện sang bốn sự kiện.
- Thêm `event` và `events` trong link cá nhân hóa.
- Thêm bộ chuyển sự kiện cho khách được mời nhiều buổi.
- Timeline, địa điểm, lịch, QR, lời mời và lifecycle theo từng event.
- Tắt an toàn Form RSVP cũ; thêm Apps Script tạo Form đa sự kiện mới.
- Không sử dụng link Maps Nha Trang/Sài Gòn vì trùng link nhà gái.

## v18.2 — Art direction, lifecycle và lazy gift

- Thêm crop ngang riêng cho ảnh feature và dùng `<picture>`.
- Thêm trạng thái ngày cưới/hậu đám cưới và tự đóng RSVP theo deadline.
- Lazy-init QR mừng cưới khi mở dialog.
- Thêm focus/ARIA cho validation lời chúc.
- Thêm Apps Script lấy Google Forms prefill entry.
- Cập nhật ICS PRODID; không tự đoán giờ kết thúc.
- Xóa asset meta/header trùng và tạo clean dist.


## v18.1 — runtime hotfix và crop safety

- Sửa iframe RSVP/Maps bị ẩn và popup trắng.
- Dialog mobile chuyển sang CSS grid, footer luôn trong viewport.
- Motion compose với layout transform, không làm lệch hero.
- Hero/lightbox tối ưu mobile landscape thấp.
- Feature focal point 25% trên màn hình rộng.
- RSVP progressive enhancement bằng href thật.
- Map embed chuyển sang pin tọa độ chính xác.
- Playwright 1.61.1, package-lock và CI `npm ci`.
- Browser smoke thêm 320×568 và 568×320, kiểm tra iframe visible/footer.

## v18 — RSVP popup, bản đồ lazy, motion và dữ liệu nhất quán

- Chuyển Google Forms RSVP từ tab mới sang native dialog.
- Chỉ tải iframe RSVP sau lần bấm đầu tiên; giữ nút mở toàn màn hình.
- Thêm Google Maps dialog lazy-load và nút chỉ đường bên ngoài.
- Đồng bộ 10h00, 28/07/2026 và địa chỉ 346 Nguyễn Huệ trong hai Apps Script.
- Thêm `tools/wedding-data.json`, script đồng bộ và consistency test.
- Thêm bộ animation local có reduced-motion; không hotlink Webcake CSS.
- Giữ Google Fonts hiện tại, không thêm family thứ tư.
- Giữ MP3 Váy Cưới local làm nguồn chính và URL Pancake làm fallback.
- Share mặc định dùng URL chung; link cá nhân hóa có nút copy riêng.
- Mở rộng CSP có giới hạn cho Forms, Maps và nguồn media Pancake.
- Nâng browser smoke để chứng minh Form/Map/Wishes đều lazy-load.

## v17 — Cá nhân hóa và trải nghiệm khách mời

- Sửa CacheService TTL từ 86400 xuống 21600 giây.
- Biến cache lời chúc thành best-effort sau khi Sheet đã lưu và xác minh.
- Bỏ lần thử autoplay khi initial load; nhạc chỉ phát sau thao tác người dùng.
- Sửa `sizes` của ảnh wide và loại bỏ `src=""` khỏi lightbox.
- Thêm lời mời theo tên khách bằng URL fragment.
- Thêm công cụ offline tạo link khách mời.
- Thêm prefill Google Forms theo entry ID tùy chọn.
- Thêm timeline Lễ Thành Hôn 08h30 và đón khách 10h00.
- Thêm file ICS hai sự kiện, chia sẻ native và fallback copy.
- Thêm khối gia đình tùy chọn và ghi chú đường đi tùy chọn.
- Nâng cấp lightbox: trước/sau, counter, keyboard và swipe.
- Bổ sung CI browser smoke, image decode và QR decode.
- Cập nhật build marker `v17-20260722`.

## v16 — Bộ ảnh mới và ba ảnh bổ sung

- Thay toàn bộ 8 ảnh cũ bằng bản chỉnh mới.
- Thêm ảnh cảm xúc `DRS06828`.
- Thêm ảnh ngồi áo dài `DRS07290`.
- Đổi ảnh kết sang `DRS07446`.
- Tổ chức album theo nhịp trang trọng → gần gũi → truyền thống → kết cảm xúc.
- Xuất 22 ảnh WebP responsive.
- Cập nhật lightbox và cache version.
- Giữ nguyên RSVP, QR, nhạc, Apps Script và cấu hình production.

## Release v15 — v15-20260722

- Xác nhận giờ đón khách dự tiệc là 10h00; giữ Lễ Thành Hôn lúc 08h30.
- Đổi nhãn giao diện thành “Đón khách dự tiệc”.
- Frontend chỉ báo gửi thành công khi `stored === true`.
- Thêm lỗi rõ ràng khi server phản hồi nhưng chưa xác nhận lưu.
- Chuẩn hóa backend production thành `tools/wedding-wishes-webapp.gs` version 1.4.0.
- Đồng bộ WISHES-SETUP, README và tools README.
- Thêm build marker `v15-20260722` và công cụ kiểm tra trang live.
- Thêm CSP host hẹp cho subdomain động `*.script.googleusercontent.com`.
- Thêm cấu hình lazy-load tường minh.
- Thay hai SVG placeholder bằng SVG nhúng đúng PNG VietQR.
- Thêm test/CI tái lập và validation v15.
- Chuyển tài liệu/báo cáo lịch sử sang `docs/history/`.

## Bản sửa postMessage v13

- Sửa timeout sau khi gửi lời chúc.
- Đổi `window.parent.postMessage` thành `window.top.postMessage`.
- Chấp nhận origin động `*-script.googleusercontent.com`.
- Giữ target origin GitHub chính xác, không dùng `*`.
- Tăng app.js cache version lên 1.9.
- Tăng backend version lên 1.2.0.
- Bổ sung root-cause report và test report.

## Bản lazy-load lời chúc v12

- Bỏ tải danh sách lời chúc khi trang vừa mở.
- Thêm IntersectionObserver với preload margin 1200px.
- Tải ngay khi khách bấm Gửi lời chúc.
- Thêm state `idle/loading/loaded` chống gọi trùng.
- Thêm retry khi JSONP lỗi hoặc timeout.
- Thêm fallback scroll/resize cho trình duyệt cũ.
- Thêm `content-visibility` và `contain-intrinsic-size`.
- Tăng Apps Script cache từ 90 lên 300 giây.
- Tăng cache version CSS/JS/config.
- Thêm browser-smoke chứng minh không request ở initial load.

## Bản QR ngân hàng v11

- Thay QR placeholder bằng hai VietQR thật.
- Cập nhật MB Bank: BÙI THANH XUÂN — 0374037026.
- Cập nhật SHB Bank: TRẦN THỊ PHƯỢNG — 0976699400.
- Dựng lại QR thành PNG lossless 1024 × 1024.
- Giữ vùng trắng bốn module.
- Xóa hai SVG placeholder.
- Tăng cache version `config.js` lên 2.0.
- Xác minh quét được ở 1024, 512, 340 và 240 px.

## Bản Sổ lời chúc v10

- Thêm guestbook có kiểm duyệt bằng Apps Script + Google Sheet.
- Thêm nút và dialog Gửi lời chúc.
- Thêm section Những lời chúc yêu thương.
- Chỉ hiển thị hàng `approved`.
- Thêm honeypot, consent, rate limit, duplicate check và formula-injection guard.
- Dùng JSONP approved-only và form POST vào iframe.
- Đổi mừng cưới thành hành động phụ.
- Tách lời nhắn RSVP thành lời nhắn riêng.
- Cập nhật CSP và cache version.
- Thêm hướng dẫn deploy, security review và skill workflow.

## Bản cách xưng hô v9

- Website đổi cách gọi khách mời thành “Quý vị”.
- Lời ngỏ dùng tên riêng và “hai gia đình” thay cho “chúng tôi”.
- Đổi “Chúng tôi” thành “Đôi uyên ương”.
- Đổi tiêu đề sự kiện thành “Hân hạnh đón tiếp Quý vị”.
- Đổi tiêu đề RSVP thành “Sự hiện diện của Quý vị là niềm vui quý giá”.
- Cập nhật Open Graph và Twitter description.
- Google Forms dùng “Quý khách” nhất quán.
- Script cập nhật Form hiện có sửa cả câu hỏi và phần trợ giúp.
- Tăng cache version `config.js` lên 1.8.

## Bản hero v8

- Tách tên chú rể và cô dâu thành hai cụm hai dòng ở hai bên ảnh hero.
- Giữ ký tự theo hướng ngang; không dùng writing-mode dọc.
- Giữ vùng trung tâm thông thoáng để không che khuôn mặt.
- Cân lại gradient nền, ngày cưới và nút Mở thiệp.
- Ép tiêu đề lời mời thành `Trân trọng` / `kính mời`.
- Giảm line-height đoạn lời mời và tinh chỉnh chữ ký.
- Bổ sung cấu trúc H1 thân thiện với trình đọc màn hình.

## Bản review v7

- Thêm Be Vietnam Pro, Lora và Dancing Script với `display=swap`.
- Cải thiện line-height, font-weight và độ tương phản tiếng Việt.
- Thêm `[hidden] { display:none !important; }`.
- Sửa icon nhạc bằng SVG và đồng bộ play/pause.
- Phát nhạc sau click “Mở thiệp” nếu autoplay bị chặn.
- Ẩn quà mừng khi số tài khoản/QR còn placeholder.
- Sửa tràn ngang ở phần lời mời trên mobile.
- Cập nhật CSP, Open Graph URL và Twitter image.
- Thêm báo cáo review, font và test.

## Bản ảnh mới v5

- Thay toàn bộ 8 ảnh bằng các bản JPG đã chỉnh sửa mới.
- Tạo lại 16 ảnh WebP responsive ở 720 px và 1280 px.
- Chuẩn hóa ảnh về tỷ lệ 2:3 và sharpen nhẹ sau resize.
- Tạo lại ảnh Open Graph `meta-v3.jpg`.
- Tạo lại header Google Forms phiên bản 2.
- Thêm cache-busting `?v=5` cho ảnh.
- Thêm `IMAGE-MAP.md` và ảnh preview bộ ảnh.
- Giữ nguyên cấu hình GitHub Pages, noindex, RSVP, ngân hàng và số điện thoại.

## Bản GitHub Pages v4

- Thêm `noindex, nofollow, noimageindex`.
- Thêm `referrer=no-referrer`.
- Thêm `robots.txt` cho phép crawler đọc thẻ noindex.
- Thêm `.nojekyll`.
- Thêm hướng dẫn triển khai GitHub Pages.
- Thêm tài liệu riêng tư.
- Cập nhật hạn RSVP thành 24.07.2026.
- Tăng phiên bản cache `config.js` lên 1.3.

## Bản trước

- Cập nhật địa điểm thành Tư gia nhà trai.
- Cập nhật ngân hàng nhà trai thành MB Bank.
- Cập nhật ngân hàng nhà gái thành SHB Bank.
- Cập nhật số điện thoại chú rể 0374037026 và cô dâu 0906878461 trong công cụ Google Forms RSVP.
- Bổ sung thông tin liên hệ vào cấu hình tập trung.
- Thay ảnh Open Graph bằng thiết kế mới 1200 × 630.
- Hiển thị đầy đủ khuôn mặt cô dâu, chú rể.
- Hiển thị đầy đủ họ tên: Bùi Thanh Xuân và Trần Thị Phượng.
- Dùng tên file `meta-v2.jpg` để hạn chế ảnh chia sẻ cũ bị lưu cache.
- Bổ sung metadata kích thước, mô tả ảnh và Twitter Card.
- Cấu hình sẵn link Google Forms RSVP.
- Đổi hạn RSVP thành 20.07.2026.
- Thêm ảnh header Google Forms 1600 × 400.
- Thêm mã Google Apps Script tạo và cập nhật RSVP.

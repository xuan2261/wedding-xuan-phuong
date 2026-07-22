# Changelog

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

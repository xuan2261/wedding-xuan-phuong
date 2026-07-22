# Báo cáo review toàn bộ source — Wedding Xuân & Phượng v7

**Ngày đánh giá:** 21/07/2026  
**Website đích:** `https://xuan2261.github.io/wedding-xuan-phuong/`  
**Chuỗi thực hiện:** brainstorm → architecture/design → UI/UX review → code review → debug → fix/cook → static test → optimization review → Fable evidence judge

## 1. Phạm vi

Đã kiểm tra:

- `index.html`
- `styles.css`
- `app.js`
- `config.js`
- Hai Google Apps Script trong `tools/`
- 16 ảnh WebP responsive
- Ảnh Open Graph và header Google Forms
- QR placeholder
- Thiết lập GitHub Pages, CSP, robots/noindex
- Hành vi RSVP, lightbox, nhạc và dialog
- Font tiếng Việt, fallback font, line-height, độ tương phản và tràn ngang

## 2. Kết luận

**Verdict: PASS cho source tĩnh và browser-smoke có kiểm soát, với các caveat được nêu rõ.**

Bản v7 phù hợp để cập nhật lên GitHub Pages. Không phát hiện lỗi cú pháp,
tài nguyên nội bộ bị thiếu, ID HTML trùng, hoặc lỗi console trong các kịch bản
smoke đã chạy.

Không tuyên bố Lighthouse/Core Web Vitals tuyệt đối vì sandbox không thể tải
trực tiếp GitHub Pages hoặc Google Fonts bằng Chromium do chính sách mạng.
Bản fallback đã được render và kiểm tra; font thực tế cần xác nhận thêm trên
điện thoại sau khi deploy.

## 3. Brainstorm và kiến trúc

### Mục tiêu giữ lại

- Website tĩnh, không thêm framework.
- Một file `config.js` quản lý nội dung.
- Ảnh responsive 720/1280 px.
- Google Forms mở ở tab mới thay vì nhúng iframe nặng.
- Nhạc chỉ bắt đầu chắc chắn sau hành động chủ động của khách.
- Không để dữ liệu tài khoản mẫu xuất hiện như dữ liệu thật.

### Phương án font được chọn

| Vai trò | Font | Lý do |
|---|---|---|
| Nội dung và nút | Be Vietnam Pro | Rõ ràng, phù hợp dấu tiếng Việt, đọc tốt trên điện thoại |
| Tiêu đề và lời mời | Lora | Trang trọng, dễ đọc hơn kiểu chữ trang trí |
| Tên cô dâu/chú rể và chữ ký | Dancing Script | Cảm giác thiệp cưới nhưng chỉ dùng ở đoạn ngắn |

Không dùng font script cho đoạn văn dài, thời gian, địa chỉ hay nút hành động.

## 4. UI/UX và font

### Các vấn đề ở bản công khai trước review

- Font phụ thuộc hệ điều hành: Segoe UI, Segoe Script, Palatino và Georgia.
  Do đó Windows, iPhone và Android có thể hiển thị khác nhau.
- `line-height: 0.92` ở tên hero có nguy cơ làm dấu tiếng Việt chạm hoặc cắt nhau.
- Màu vàng cũ `#b8995a` trên nền giấy sáng chỉ đạt khoảng **2.67:1**.
- Thuộc tính HTML `hidden` có thể bị các rule `display:inline-flex` hoặc
  `display:inline-grid` của author CSS ghi đè.
- Icon nhạc cũ không phản ánh rõ trạng thái tắt.
- Pseudo-element trang trí của phần lời mời tạo tràn ngang trên màn hình nhỏ.

### Các thay đổi v7

- Tải Be Vietnam Pro, Lora và Dancing Script bằng Google Fonts CSS2.
- Dùng `display=swap`, preconnect và fallback font phù hợp.
- Tăng line-height tên hero lên `1.1`; mobile là `1.12`.
- Tăng weight font script lên 600 để tên rõ trên nền ảnh.
- Dùng `text-wrap: balance` cho tên.
- Màu chữ vàng đổi thành `#886e38`, đạt khoảng **4.77:1** trên nền giấy.
- Màu phụ `#626c66` đạt khoảng **5.36:1** trên nền giấy và **4.88:1**
  trên nền kem.
- Thêm `[hidden] { display:none !important; }`.
- Giới hạn tràn của ornament trong phần lời mời.
- Nút nhạc dùng SVG rõ ràng, có trạng thái phát/tắt và nhãn accessibility.
- Countdown không dùng `aria-live` mỗi giây để tránh làm trình đọc màn hình
  thông báo liên tục.

## 5. Code review và debug

### Finding A — `hidden` bị CSS ghi đè

**Mức độ:** High UX/correctness

Các thành phần như nút quà mừng, ghi chú RSVP và icon SVG dùng thuộc tính
`hidden`, nhưng selector có `display` cụ thể có thể làm chúng vẫn xuất hiện.

**Fix:** rule toàn cục:

```css
[hidden] {
  display: none !important;
}
```

**Regression evidence:** browser smoke xác nhận nút quà bị ẩn khi tài khoản còn
là placeholder và icon nhạc chuyển trạng thái đúng.

### Finding B — SVG icon không đồng bộ bằng `.hidden`

**Mức độ:** Medium

Với SVG, sử dụng thuộc tính DOM `.hidden` không đáng tin cậy như phần tử HTML.

**Fix:** dùng `toggleAttribute("hidden", condition)` và đồng bộ theo các sự kiện
`play`, `pause`, `ended`, `volumechange`.

### Finding C — dữ liệu mừng cưới mẫu

**Mức độ:** High content/privacy

`11111111` và `222222` chưa phải tài khoản thật.

**Fix:** `giftsAreReady()` kiểm tra placeholder. Nút “Gửi quà mừng” bị ẩn cho
đến khi cả hai tài khoản và QR được thay đúng.

### Finding D — autoplay

**Mức độ:** Expected browser behavior

Trình duyệt có thể chặn media có tiếng khi vừa mở URL.

**Fix:** vẫn thử autoplay không gây lỗi; nếu bị chặn, nhạc bắt đầu khi khách
bấm “Mở thiệp”. Nút nhạc tiếp tục cho phép pause/resume.

### Finding E — nội dung fallback và metadata

- Fallback hạn RSVP sửa thành `24.07.2026`.
- `og:url`, `og:image`, Twitter image dùng URL tuyệt đối.
- Thêm CSP hạn chế script, media và object ngoài dự kiến.
- Giữ `noindex, nofollow, noimageindex`.

## 6. Static test

Đã chạy và đạt:

- `node --check app.js`
- `node --check config.js`
- Parse runtime của `WEDDING_CONFIG`
- Kiểm tra cú pháp hai Google Apps Script thông qua bản sao `.js`
- Không có ID HTML trùng
- `lang="vi"`
- Không thiếu đường dẫn ảnh/CSS/JS nội bộ
- Tất cả ảnh nội dung có `alt`, `width`, `height`
- Link mở tab mới có `noopener noreferrer`
- CSS parse không có lỗi
- Kích thước ảnh responsive đúng
- Open Graph image 1200 × 630
- Header Google Forms 1600 × 400

## 7. Browser smoke

Kích thước đã kiểm tra:

- Mobile: 390 × 844
- Desktop: 1440 × 900

Kết quả:

- Không tràn ngang.
- RSVP mở đúng Google Form.
- Nút quà bị ẩn khi còn placeholder.
- Click “Mở thiệp” chuyển nhạc sang trạng thái phát.
- Pause/resume đổi đúng icon và `aria-pressed`.
- Lightbox mở/đóng đúng và lấy ảnh 1280 px.
- Không có lỗi console hoặc page error trong kịch bản.

## 8. Optimization review

### Giữ lại

- Ảnh WebP responsive.
- Lazy-load cho ảnh ngoài màn hình đầu.
- Preload/fetchpriority chỉ cho hero.
- IntersectionObserver dùng một lần rồi `unobserve`.
- Font chỉ lấy các weight thực sự sử dụng.
- `display=swap`.

### Không áp dụng

- Không chuyển sang React/Vue.
- Không thêm animation mới.
- Không tự host font trong artifact này.
- Không preload toàn bộ font hoặc album.
- Không ép autoplay bằng thủ thuật gây khó chịu.

## 9. Fable evidence judge

### Đã chứng minh bằng evidence mới

- Source v7 được parse và test lại.
- Browser-smoke được chạy sau các fix cuối.
- ZIP được tạo từ đúng source đã review.
- SHA-256 được sinh sau khi đóng gói.

### Caveat

1. Sandbox không xác nhận được tải Google Fonts qua mạng thật.
2. Chưa chạy Lighthouse trên URL production.
3. Chưa kiểm tra trực tiếp iOS Safari và Android Chrome thật.
4. File `assets/audio/music.mp3` không được đóng gói lại; khi deploy full source
   cần giữ file đang có trên GitHub.
5. Tài khoản và QR vẫn là placeholder; tính năng quà mừng được ẩn an toàn.

## 10. Việc bắt buộc trước khi gửi thiệp

- Ghi đè bốn file: `index.html`, `styles.css`, `app.js`, `config.js`.
- Không xóa `assets/audio/music.mp3`.
- Thử bằng cửa sổ ẩn danh.
- Kiểm tra font trên ít nhất một Android và một iPhone.
- Chỉ bật quà mừng sau khi thay số tài khoản và QR thật.

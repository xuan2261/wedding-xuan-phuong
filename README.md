# Thiệp cưới Thanh Xuân & Thị Phượng

Bản website tĩnh đã được tối ưu lại từ ý tưởng của mẫu `hoangnv25/wedding`, sử dụng 8 ảnh cưới đã cung cấp.

## Chạy thử

Có thể mở `index.html` trực tiếp, nhưng nên chạy bằng local server:

```powershell
Set-Location -LiteralPath 'C:\Work\wedding-xuan-phuong'
python -m http.server 8080
```

Sau đó mở `http://localhost:8080`.

## Chỉnh thông tin

Mở `config.js`. Toàn bộ tên, ngày giờ, địa điểm, Google Maps, RSVP, QR, tài khoản và nhạc được tập trung trong file này.

### Các mục còn cần xác nhận

1. `event.guestTime`: đang tạm để `08h00`, tức trước lễ 30 phút.
2. Kiểm tra lại số tài khoản `11111111` và `222222` trước khi công khai.
3. Hai ảnh QR vẫn là placeholder và cần được thay bằng QR thật.
4. File nhạc chưa được kèm; chỉ bật sau khi thêm file có quyền sử dụng.

## Thông tin đã cập nhật

- Địa điểm: **Tư gia nhà trai**.
- Ngân hàng nhà trai: **MB Bank**.
- Ngân hàng nhà gái: **SHB Bank**.
- Điện thoại chú rể: **0374037026**.
- Điện thoại cô dâu: **0906878461**.

## Thay QR

Giữ nguyên tên file và ghi đè:

```text
assets/qr/qr-nha-trai.svg
assets/qr/qr-nha-gai.svg
```

Có thể dùng PNG/WebP, nhưng khi đổi đuôi file phải sửa `qrImage` trong `config.js`.

## Thêm nhạc

Không kèm ca khúc thương mại để tránh vấn đề bản quyền.

1. Chuẩn bị file MP3 mà bạn có quyền sử dụng.
2. Đặt tên `music.mp3`.
3. Chép vào `assets/audio/music.mp3`.
4. Trong `config.js`, đổi:

```js
music: {
  enabled: true,
  file: "assets/audio/music.mp3",
  title: "Tên bài hát — Ca sĩ"
}
```

Khuyến nghị nén MP3 96–128 kbps để tải nhanh.

## Google Forms RSVP

Website đã được cấu hình với Form dành cho khách tại:

```text
https://docs.google.com/forms/d/e/1FAIpQLSdWjs5UUj2uHvNcDDpTYBWoiTZP6maOukXgVpoSq2bFh-pVew/viewform
```

Hạn phản hồi hiện đặt là `24.07.2026`.

Thư mục `tools/` có:

- Mã tạo Google Forms và Google Sheet.
- Mã bổ sung số điện thoại liên hệ.
- Hướng dẫn sử dụng.
- Ảnh header Google Forms nằm ở `assets/images/google-forms-header-xuan-phuong.jpg`.

## Triển khai GitHub Pages

Source đã được chuẩn bị cho GitHub Pages:

- `index.html` ở thư mục gốc.
- Có `.nojekyll`.
- Có `robots.txt`.
- Có `noindex, nofollow, noimageindex`.
- Hướng dẫn chi tiết: `DEPLOY-GITHUB-PAGES.md`.
- Giải thích riêng tư: `PRIVACY.md`.

Tóm tắt:

1. Tạo repository.
2. Upload toàn bộ file bên trong source.
3. Vào **Settings → Pages**.
4. Chọn **Deploy from a branch**, `main`, `/(root)`.
5. Chờ URL `github.io`.
6. Bật **Enforce HTTPS** khi khả dụng.

> `noindex` không đặt mật khẩu. Người có link vẫn mở được website.


## Ảnh đã tối ưu

Mỗi ảnh có hai kích thước:

- `-720.webp`: dùng chủ yếu trên điện thoại.
- `-1280.webp`: dùng cho màn hình lớn và lightbox.

Ảnh được lazy-load bên dưới màn hình đầu; ảnh hero dùng `fetchpriority="high"`.

## Ảnh bìa chia sẻ

Ảnh bìa mới:

```text
assets/images/meta-v3.jpg
```

Thông số 1200 × 630, có đầy đủ hai khuôn mặt, họ tên đầy đủ và ngày cưới.
`meta.jpg` cũng được thay bằng cùng thiết kế để tương thích với đường dẫn cũ.

Khi có tên miền chính thức, hãy đổi `og:image` và `twitter:image` trong
`index.html` thành URL tuyệt đối, ví dụ:

```html
<meta property="og:image" content="https://xuanphuong.id.vn/assets/images/meta-v3.jpg">
<meta name="twitter:image" content="https://xuanphuong.id.vn/assets/images/meta-v3.jpg">
```

Sau khi triển khai, hãy thử chia sẻ URL ở chế độ riêng tư trước khi gửi khách.


## Bộ ảnh v5

Tám ảnh cưới đã được thay bằng bản chỉnh sửa mới và xuất lại thành WebP responsive.
Xem ánh xạ, kích thước và cách xử lý tại `IMAGE-MAP.md`.

Ảnh chia sẻ đang dùng:

```text
assets/images/meta-v3.jpg
```

Header Google Forms mới:

```text
assets/images/google-forms-header-xuan-phuong-v2.jpg
```


## Bản review v7 — font, UX và correctness

Bản này đã được review theo chuỗi:

```text
brainstorm → architecture/design → UI/UX → code review → debug
→ static test → optimization → Fable evidence judge
```

Thay đổi chính:

- Font tiếng Việt nhất quán: Be Vietnam Pro, Lora, Dancing Script.
- Sửa line-height và độ tương phản.
- Sửa lỗi thuộc tính `hidden` bị CSS ghi đè.
- Icon nhạc phát/tắt đồng bộ bằng SVG.
- Nhạc bắt đầu khi khách bấm **Mở thiệp** nếu autoplay bị chặn.
- Ẩn tính năng quà mừng khi tài khoản/QR còn placeholder.
- Sửa tràn ngang trên mobile.
- Bổ sung CSP và metadata URL production.

Báo cáo:

- `reports/FULL-REVIEW-V7.md`
- `reports/FONT-REVIEW-V7.md`
- `reports/TEST-REPORT-V7.md`
- `reports/DEPLOY-V7.md`

> Full source không kèm `assets/audio/music.mp3`. Khi deploy, giữ file nhạc
> hiện có trên repository.

## Bản hero v8

Hero dùng hai cụm tên đọc ngang nhưng xếp hai dòng ở hai bên:

```text
Thanh                     Thị
Xuân         &          Phượng
```

Cách này giữ trống vùng trung tâm cho khuôn mặt, đồng thời vẫn đọc tự nhiên bằng tiếng Việt. Tiêu đề lời mời được cân thành hai dòng `Trân trọng` / `kính mời`. Xem `reports/HERO-REVIEW-V8.md`.


## Cách xưng hô v9

- Website dùng **Quý vị** cho khách mời thuộc nhiều độ tuổi.
- Google Forms dùng **Quý khách** cho câu hỏi và hướng dẫn thao tác.
- Khi nói về cô dâu chú rể, nội dung dùng tên riêng hoặc **hai gia đình** thay
  cho “chúng tôi”.
- Các từ “bạn” trong tài liệu kỹ thuật chỉ hướng đến người quản trị source và
  không xuất hiện trên thiệp dành cho khách.

Cập nhật Google Form hiện có bằng cách chạy:

```javascript
updateWeddingRsvpContactInfo()
```

Hàm sửa mô tả, thông báo xác nhận, tiêu đề câu hỏi, help text và lựa chọn phân
nhóm khách mà không xóa phản hồi cũ.


## Sổ lời chúc v10

Source có đầy đủ frontend và Google Apps Script backend cho sổ lời chúc có kiểm
duyệt. Tính năng mặc định tắt để website production không hiển thị nút chưa hoạt
động.

Thiết lập theo `WISHES-SETUP.md`, sau đó dán URL `/exec` vào `config.js` và đổi:

```javascript
enabled: true
```

Lời nhắn trong RSVP được đổi thành **Lời nhắn riêng** và không hiển thị công khai.


## Mã QR ngân hàng v11

Đã thay hai QR placeholder bằng mã thật:

```text
Nhà trai — MB Bank
BÙI THANH XUÂN
0374037026
assets/qr/qr-nha-trai.png

Nhà gái — SHB Bank
TRẦN THỊ PHƯỢNG
0976699400
assets/qr/qr-nha-gai.png
```

QR được lưu ở PNG lossless và đã kiểm tra giải mã ở nhiều kích thước. Nút
“Thông tin mừng cưới dành cho khách ở xa” sẽ tự xuất hiện vì dữ liệu placeholder
đã được thay đầy đủ.


## Lazy-load lời chúc v12

Danh sách lời chúc không còn gọi Google Apps Script khi trang vừa mở.

Nó được tải một lần khi:

- section cách viewport khoảng `1200px`; hoặc
- khách bấm một trong các nút **Gửi lời chúc**.

Nếu request lỗi hoặc timeout, nút **Thử tải lại** xuất hiện. Backend cache danh
sách đã duyệt trong 300 giây; trigger kiểm duyệt vẫn xóa cache khi status thay đổi.


## Sửa phản hồi gửi lời chúc v13

- Backend đổi từ `window.parent.postMessage` sang `window.top.postMessage`.
- Frontend chấp nhận hostname Apps Script động dạng
  `*-script.googleusercontent.com`.
- Vẫn kiểm tra HTTPS, payload type và requestId.
- Cần tạo version mới cho Apps Script deployment hiện tại.

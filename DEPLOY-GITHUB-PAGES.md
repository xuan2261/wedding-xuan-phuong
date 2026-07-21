# Triển khai thiệp cưới lên GitHub Pages

## Trước khi đăng

Kiểm tra:

- `config.js`: ngày giờ, địa điểm và số điện thoại.
- Thay số tài khoản mẫu `11111111` và `222222`.
- Thay hai QR mẫu trong `assets/qr/`.
- Kiểm tra link Google Maps và Google Forms RSVP.
- Không upload ảnh PNG gốc dung lượng lớn; source đã có ảnh WebP tối ưu.

Website có:

```html
<meta name="robots" content="noindex, nofollow, noimageindex">
```

Thẻ này yêu cầu công cụ tìm kiếm không lập chỉ mục, nhưng **không đặt mật khẩu**.
Người có đường dẫn vẫn có thể mở website.

---

## Cách A — Upload bằng giao diện GitHub

### Bước 1: Tạo repository

1. Đăng nhập GitHub.
2. Chọn dấu **+** ở góc trên bên phải.
3. Chọn **New repository**.
4. Đặt tên, ví dụ:

```text
wedding-xuan-phuong
```

5. Chọn **Public** nếu dùng GitHub Free để xuất bản Pages đơn giản.
6. Không tạo sẵn README, `.gitignore` hoặc license.
7. Nhấn **Create repository**.

### Bước 2: Upload source

1. Trong repository mới, chọn **uploading an existing file**.
2. Giải nén ZIP.
3. Mở thư mục `wedding-xuan-phuong-github-pages-v4`.
4. Kéo **toàn bộ nội dung bên trong** vào GitHub:
   - `index.html`
   - `config.js`
   - `app.js`
   - `styles.css`
   - `assets/`
   - `tools/`
   - `robots.txt`
   - `.nojekyll`
   - các file hướng dẫn
5. Commit message:

```text
Publish wedding invitation
```

6. Nhấn **Commit changes**.

`index.html` phải nằm ngay thư mục gốc repository, không nằm trong một thư mục
con khác.

### Bước 3: Bật GitHub Pages

1. Vào **Settings** của repository.
2. Chọn **Pages**.
3. Trong **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/(root)**
4. Nhấn **Save**.
5. Chờ vài phút rồi tải lại Settings → Pages.

Địa chỉ sẽ có dạng:

```text
https://TEN_TAI_KHOAN.github.io/wedding-xuan-phuong/
```

### Bước 4: HTTPS

- Mở URL bằng `https://`.
- Trong Settings → Pages, bật **Enforce HTTPS** khi tùy chọn xuất hiện.
- Sau lần triển khai đầu, tùy chọn có thể cần vài phút mới khả dụng.

---

## Cách B — Đẩy source bằng PowerShell và Git

```powershell
Set-Location -LiteralPath 'C:\Work\wedding-xuan-phuong-github-pages-v4'

git init
git branch -M main
git add .
git commit -m "Publish wedding invitation"

git remote add origin https://github.com/TEN_TAI_KHOAN/wedding-xuan-phuong.git
git push -u origin main
```

Thay `TEN_TAI_KHOAN` bằng username GitHub của bạn.

Sau đó vào **Settings → Pages** và chọn:

```text
Deploy from a branch
main
/(root)
```

---

## Cập nhật website lần sau

```powershell
git add .
git commit -m "Update wedding information"
git push
```

GitHub Pages sẽ triển khai lại.

---

## Cập nhật ảnh chia sẻ sau khi có URL Pages

Mở `index.html`, đổi:

```html
<meta property="og:image" content="assets/images/meta-v2.jpg">
<meta name="twitter:image" content="assets/images/meta-v2.jpg">
```

thành URL tuyệt đối:

```html
<meta property="og:image"
      content="https://TEN_TAI_KHOAN.github.io/wedding-xuan-phuong/assets/images/meta-v2.jpg">

<meta name="twitter:image"
      content="https://TEN_TAI_KHOAN.github.io/wedding-xuan-phuong/assets/images/meta-v2.jpg">
```

Thêm:

```html
<meta property="og:url"
      content="https://TEN_TAI_KHOAN.github.io/wedding-xuan-phuong/">
```

Commit và push lại.

---

## Kiểm tra noindex sau khi triển khai

1. Mở website.
2. Nhấn `Ctrl + U`.
3. Tìm:

```html
<meta name="robots" content="noindex, nofollow, noimageindex">
```

4. Mở:

```text
https://TEN_TAI_KHOAN.github.io/wedding-xuan-phuong/robots.txt
```

`robots.txt` phải cho crawler truy cập, để crawler đọc được `noindex`.

Không đổi thành:

```text
User-agent: *
Disallow: /
```

vì crawler có thể không tải được trang để đọc chỉ thị `noindex`.

---

## Sau đám cưới

Nên:

1. Xóa số tài khoản, QR, địa chỉ và số điện thoại.
2. Hoặc thay website bằng trang cảm ơn.
3. Hoặc tắt GitHub Pages.
4. Hoặc xóa repository nếu không cần lưu trực tuyến.

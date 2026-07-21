# Bộ ảnh cưới v5

## Ánh xạ ảnh

| File gốc mới | Tài nguyên website | Mục đích |
|---|---|---|
| DRS06640.jpg | `hero-*` | Ảnh mở đầu và ảnh toàn thân |
| DRS06549.jpg | `bride-*` | Chân dung cô dâu |
| DRS07188.jpg | `groom-*` | Chân dung chú rể |
| DRS07545.jpg | `couple-studio-*` | Ảnh nền trắng, ảnh bìa và header Form |
| DRS06659.jpg | `couple-hands-*` | Ảnh nhìn nhau/nắm tay |
| DRS06605.jpg | `couple-formal-*` | Ảnh trang trọng |
| DRS06669.jpg | `couple-playful-*` | Ảnh toàn thân vui tươi |
| DRS07389.jpg | `couple-aodai-*` | Ảnh áo dài và nhẫn cưới |

## Cách xử lý

- Giữ nguyên người, khuôn mặt và bối cảnh.
- Chuẩn hóa ảnh website về tỷ lệ dọc 2:3.
- Tạo hai kích thước:
  - 720 × 1080 cho điện thoại.
  - 1280 × 1920 cho màn hình lớn và lightbox.
- Định dạng WebP.
- Nén có kiểm soát và sharpen rất nhẹ sau resize.
- Xóa metadata không cần thiết khi xuất ảnh.
- Hero được ưu tiên tải; các ảnh còn lại dùng lazy loading.
- Ảnh chia sẻ mới: `meta-v3.jpg`, 1200 × 630.
- Header Google Forms mới: `google-forms-header-xuan-phuong-v2.jpg`, 1600 × 400.

Không cần đưa 8 ảnh JPG gốc lên GitHub Pages.

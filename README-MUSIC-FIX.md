# Bản vá nhạc nền v6

## Lỗi đã sửa

1. Nhạc không thể tự phát ổn định ngay khi vừa tải trang do chính sách autoplay
   của trình duyệt.
2. Code cũ không thay ký hiệu hiển thị; nó chỉ thay `aria-pressed` và nhãn dành
   cho trình đọc màn hình.
3. Trạng thái nút có thể lệch nếu audio bị trình duyệt hoặc hệ điều hành dừng.

## Hành vi mới

- Trình duyệt vẫn thử autoplay nếu người dùng đã cấp quyền trước đó.
- Khi autoplay bị chặn, nhạc bắt đầu ngay lúc khách bấm **Mở thiệp**.
- Đang phát: icon `♫` và xoay.
- Đã tắt/tạm dừng: icon `🔇`.
- `aria-label`, `title` và icon luôn đồng bộ với sự kiện `play`/`pause`.

## Cách cập nhật GitHub

Ghi đè ba file ở thư mục gốc repository:

```text
app.js
index.html
styles.css
```

Không xóa hoặc thay file:

```text
assets/audio/music.mp3
```

Sau đó commit:

```powershell
git add app.js index.html styles.css
git commit -m "Fix wedding music autoplay fallback and mute icon"
git push
```

Chờ GitHub Pages triển khai xong rồi mở trang bằng cửa sổ ẩn danh.

## Hành vi dự kiến

- Vào link trực tiếp: trình duyệt có thể chưa phát nhạc.
- Bấm **Mở thiệp**: nhạc bắt đầu.
- Bấm icon `♫`: nhạc dừng và icon đổi thành `🔇`.
- Bấm `🔇`: nhạc phát tiếp và icon đổi thành `♫`.

Không nên ép phát nhạc khi người dùng chỉ vừa mở URL vì Chrome, Safari và nhiều
trình duyệt di động chặn media có tiếng trước thao tác chủ động.

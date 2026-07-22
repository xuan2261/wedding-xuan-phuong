# RSVP popup, bản đồ và motion — v18

## RSVP

Website dùng Form:

```text
https://docs.google.com/forms/d/e/1FAIpQLSdWjs5UUj2uHvNcDDpTYBWoiTZP6maOukXgVpoSq2bFh-pVew/viewform
```

Iframe không tải lúc mở trang. Nó chỉ nhận `src` khi khách bấm **Xác nhận tham dự**.

`guestNameEntry` vẫn để trống vì chưa có `entry.x` thật của câu hỏi tên khách.
Để bật prefill:

1. Mở Google Form.
2. Chọn More → Pre-fill form.
3. Điền một tên mẫu.
4. Lấy tham số `entry.xxxxx` từ URL.
5. Ghi vào `config.js` và `tools/wedding-data.json`.

## Bản đồ

Popup dùng URL tìm kiếm nhúng dựa trên địa chỉ:

```text
https://www.google.com/maps?q=346%20Nguy%E1%BB%85n%20Hu%E1%BB%87%2C%20X%C3%A3%20B%C3%ACnh%20D%C6%B0%C6%A1ng%2C%20T%E1%BB%89nh%20Gia%20Lai&output=embed
```

Nút **Mở Google Maps** vẫn dùng link vị trí chính xác của gia đình.

## Nhạc

Thứ tự nguồn:

1. `assets/audio/music.mp3`
2. URL Pancake do người dùng cung cấp

Nguồn remote chỉ là fallback. Không autoplay trước thao tác của khách.

## Animation

Không hotlink `api.webcake.io`. Bộ keyframe được lưu local để tránh phụ thuộc
endpoint và giữ CSP hẹp.

## Dữ liệu nhất quán

Nguồn tham chiếu:

```text
tools/wedding-data.json
```

Kiểm tra:

```powershell
python tests/consistency_check.py
```

Đồng bộ literal sau khi chỉnh JSON:

```powershell
python tools/sync-wedding-data.py
```

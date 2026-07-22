# Thiết lập cá nhân hóa khách mời — v17

## Link theo tên khách

Mẫu:

```text
https://xuan2261.github.io/wedding-xuan-phuong/#to=Gia%20đình%20cô%20Lan
```

Website:

- ưu tiên tham số `to` trong URL fragment;
- hỗ trợ thêm `?to=...`;
- giới hạn 80 ký tự;
- chỉ gán tên bằng `textContent`;
- fallback `Quý vị`;
- mặc định không lưu tên vào `sessionStorage` để tránh nhầm tên trên thiết bị dùng chung;
- có thể bật `persistSession: true` nếu thực sự cần.

## Công cụ tạo link offline

Mở:

```text
tools/create-guest-links.html
```

Công cụ không gửi danh sách khách lên mạng. Có thể tạo link theo tên cá nhân,
tên gia đình hoặc nhóm khách.

## Prefill Google Forms RSVP

Trong Google Forms:

1. Chọn **More → Pre-fill form**.
2. Điền một giá trị thử vào câu hỏi tên khách.
3. Chọn **Get link**.
4. Trong URL, tìm tham số dạng:

```text
entry.123456789=...
```

5. Cập nhật `config.js`:

```javascript
rsvp: {
  guestNameEntry: "entry.123456789"
}
```

Nếu để trống, RSVP vẫn hoạt động nhưng không tự điền tên.

## Không đưa guest list vào GitHub

Không tạo `guests.json`, CSV hoặc spreadsheet khách mời trong repository công
khai. Chỉ gửi từng link hoặc quản lý danh sách ở máy cá nhân/Google Drive riêng.

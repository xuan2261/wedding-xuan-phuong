# Lưu ý riêng tư

GitHub Pages là website có thể truy cập công khai.

Đã bổ sung:

- `noindex`: yêu cầu không đưa trang vào kết quả tìm kiếm.
- `nofollow`: yêu cầu không theo dõi liên kết trên trang.
- `noimageindex`: yêu cầu không lập chỉ mục ảnh của trang.
- `referrer=no-referrer`: hạn chế gửi URL thiệp sang website ngoài.
- `.nojekyll`: phục vụ source tĩnh trực tiếp.
- `robots.txt` không chặn crawler để crawler đọc được `noindex`.

Các biện pháp này **không đặt mật khẩu**. Người có link vẫn xem được nội dung.
Không đăng dữ liệu mà bạn không chấp nhận công khai.


## Cá nhân hóa tên khách

Tên khách có thể nằm trong fragment `#to=...` của link. Fragment không được gửi
đến máy chủ GitHub Pages trong HTTP request. Website chỉ hiển thị bằng
`textContent`; mặc định không lưu tên vào `sessionStorage`.

Nếu cấu hình `rsvp.guestNameEntry`, tên khách sẽ được thêm vào link Google Forms
khi khách chủ động bấm **Xác nhận tham dự**.

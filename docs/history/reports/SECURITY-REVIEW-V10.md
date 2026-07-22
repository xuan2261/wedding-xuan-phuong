# Security review — Sổ lời chúc v10

## Biện pháp đã áp dụng

- `pending` được đặt ở server, client không thể chọn `approved`.
- GET chỉ trả `approved`.
- Dữ liệu công khai chỉ gồm id, displayName, relationship, message, featured.
- Không thu thập điện thoại, email, IP hoặc RSVP.
- DOM tạo bằng `createElement` và `textContent`.
- Server từ chối HTML và URL.
- Honeypot.
- Kiểm tra thời gian mở form.
- Cooldown client và server.
- Duplicate cache.
- Script lock trước khi append.
- Safe cell prefix chống công thức Sheet.
- Callback JSONP được kiểm tra bằng regex.
- postMessage có requestId và parent kiểm tra Google origin.
- Backend postMessage về đúng origin `https://xuan2261.github.io`.

## Residual risks

- Client key có thể bị giả mạo; rate limiting chỉ là chống spam cơ bản.
- JSONP mở rộng script-src đến Google Script, nhưng endpoint chỉ trả dữ liệu đã duyệt.
- Apps Script quotas có thể bị cạn nếu link bị spam diện rộng.
- ALLOWALL cho iframe response đòi hỏi thận trọng; trang response không chứa UI
  hay dữ liệu nhạy cảm và postMessage chỉ về origin đã cấu hình.
- Kiểm duyệt thủ công vẫn là hàng rào quan trọng nhất.

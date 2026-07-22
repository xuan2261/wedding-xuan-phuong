# Test report — postMessage fix v13

## Static

- app.js syntax: PASS
- config.js syntax: PASS
- wedding-wishes-webapp.gs syntax: PASS
- backend dùng `window.top.postMessage`: PASS
- không còn `window.parent.postMessage`: PASS
- allowlist nhận hostname động `*-script.googleusercontent.com`: PASS
- targetOrigin vẫn là GitHub origin chính xác: PASS
- app.js cache version 1.9: PASS

## Security

- Không đổi targetOrigin thành `*`.
- Frontend vẫn yêu cầu HTTPS.
- Frontend vẫn kiểm tra payload type và requestId.
- Google dynamic subdomain chỉ được chấp nhận khi hostname kết thúc chính xác
  bằng `-script.googleusercontent.com`.

## Deployment required

Phải cập nhật Apps Script deployment lên version mới. Chỉ push GitHub Pages
không sửa được đoạn `window.parent.postMessage` đang chạy trên Web App cũ.

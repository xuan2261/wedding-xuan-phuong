# Giữ nguyên config.js đang chạy

Gói safe patch **không ghi đè `config.js`**, nên giữ nguyên:

- `wishes.enabled: true`
- URL Apps Script `/exec` hiện tại
- thông tin cưới, QR và tài khoản ngân hàng

Code v12 có giá trị mặc định, vì vậy hai dòng dưới là tùy chọn. Có thể thêm vào cuối khối `wishes`:

```javascript
preloadRootMargin: "1200px 0px",
fallbackCheckThrottleMs: 180
```

Sau khi sửa config thủ công, nhớ thêm dấu phẩy sau thuộc tính đứng trước.

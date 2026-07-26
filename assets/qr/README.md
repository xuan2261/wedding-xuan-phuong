# Mã VietQR production

Ghi đúng nội dung **thực sự được mã hoá** trong ảnh, không phải số hiển thị trên
web. Hai thứ này hiện không giống nhau ở QR nhà trai.

| File | Ngân hàng (BIN) | Định danh trong QR | Số hiển thị trên web |
|---|---|---|---|
| `qr-nha-trai.png` | MB Bank (`970422`) | `VQRQAKQFO1476` | `0374037026` |
| `qr-nha-gai.png` | SHB Bank (`970443`) | `0976699400` | `0976699400` |

- `qr-nha-gai.png` (TRẦN THỊ PHƯỢNG) khớp hoàn toàn với `giftCatalog.bride`.
- `qr-nha-trai.png` (BÙI THANH XUÂN) mã hoá **alias VietQR** `VQRQAKQFO1476`
  (kèm trường tham chiếu `NPS6869`), **không phải** số tài khoản `0374037026`
  mà trang web hiển thị và nút "Sao chép số tài khoản" chép ra.

> **Cần xác nhận:** gia đình vui lòng kiểm tra trong app MB Bank xem alias
> `VQRQAKQFO1476` có đúng trỏ về tài khoản `0374037026` hay không.
>
> - Nếu **đúng**: đặt `qrIdentifierVerified: true` trong `config.js`, giữ nguyên ảnh.
> - Nếu **sai**: tạo lại QR từ đúng tài khoản rồi cập nhật `qrAccountIdentifier`
>   trong `config.js` cho khớp.
>
> Không sửa được từ trong repo: không có dữ liệu nào ở đây chứng minh alias và số
> tài khoản là cùng một đích đến. Lưu ý `0374037026` cũng chính là
> `contact.groomPhone`, nên gõ nhầm một chỗ sẽ hỏng cả link gọi lẫn đích chuyển tiền.

`tests/verify_assets.py` đối chiếu payload EMVCo của cả hai ảnh với `bankBin` và
`qrAccountIdentifier` khai trong `config.js`, nên ảnh và cấu hình không thể lệch
nhau trong im lặng nữa (đã kiểm chứng: đổi định danh, đổi BIN, tráo hai ảnh — cả
ba trường hợp đều làm test đỏ).

Hai file `.svg` là bản sao vector-container nhúng đúng PNG tương ứng, giữ làm bản
dự phòng. Website production dùng PNG lossless 1024 × 1024 khai trong `config.js`.

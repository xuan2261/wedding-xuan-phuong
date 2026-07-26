# Mã VietQR production

Ghi đúng nội dung **thực sự được mã hoá** trong ảnh, không phải số hiển thị trên
web. Ở QR nhà trai hai giá trị này khác nhau về mặt chuỗi ký tự, nhưng đã được
xác nhận cùng trỏ về một tài khoản.

| File | Ngân hàng (BIN) | Định danh trong QR | Số hiển thị trên web |
|---|---|---|---|
| `qr-nha-trai.png` | MB Bank (`970422`) | `VQRQAKQFO1476` | `0374037026` |
| `qr-nha-gai.png` | SHB Bank (`970443`) | `0976699400` | `0976699400` |

- `qr-nha-gai.png` (TRẦN THỊ PHƯỢNG) khớp hoàn toàn với `giftCatalog.bride`.
- `qr-nha-trai.png` (BÙI THANH XUÂN) mã hoá **alias VietQR** `VQRQAKQFO1476`
  (kèm trường tham chiếu `NPS6869`), **không phải** số tài khoản `0374037026`
  mà trang web hiển thị và nút "Sao chép số tài khoản" chép ra.

> **Đã xác nhận:** gia đình đã kiểm tra trong app MB Bank — alias
> `VQRQAKQFO1476` trỏ đúng về tài khoản `0374037026`. Hai đường chuyển tiền (quét
> QR và chép số tài khoản) cùng về một đích, nên **giữ nguyên ảnh QR**.
> `config.js` ghi `qrIdentifierVerified: true`.
>
> Nếu sau này đổi tài khoản: tạo QR mới trong app MB Bank rồi cập nhật
> `qrAccountIdentifier` trong `config.js` cho khớp — test sẽ đỏ nếu quên.
>
> Lưu ý `0374037026` cũng chính là `contact.groomPhone`, nên gõ nhầm một chỗ sẽ
> hỏng cả link gọi lẫn đích chuyển tiền.

`tests/verify_assets.py` đối chiếu payload EMVCo của cả hai ảnh với `bankBin` và
`qrAccountIdentifier` khai trong `config.js`, nên ảnh và cấu hình không thể lệch
nhau trong im lặng nữa (đã kiểm chứng: đổi định danh, đổi BIN, tráo hai ảnh — cả
ba trường hợp đều làm test đỏ).

Hai file `.svg` là bản sao vector-container nhúng đúng PNG tương ứng, giữ làm bản
dự phòng. Website production dùng PNG lossless 1024 × 1024 khai trong `config.js`.

# Thiết lập Sổ lời chúc v17

## Source chính

```text
tools/wedding-wishes-webapp.gs
```

Backend version: `1.5.0`.

## Trạng thái production

- Website: GitHub Pages.
- API: Google Apps Script Web App.
- Dữ liệu: tab `Lời chúc` trong Google Sheet.
- Lời chúc mới: `pending`.
- Website chỉ đọc `approved`.
- Frontend chỉ báo thành công khi backend trả `stored: true`.

## Cập nhật project Apps Script hiện có

1. Mở project `LoiChuc_DamCuoi_Xuan_Phuong`.
2. Ghi đè file backend bằng `tools/wedding-wishes-webapp.gs`.
3. Lưu source.
4. Chạy một lần:

```javascript
repairAndCompactWeddingWishes()
```

5. Kiểm tra:

```javascript
inspectWeddingWishesStorage()
```

Kết quả đúng: `nextWishRow = lastWishDataRow + 1`.

## Cập nhật Web App mà không đổi URL

```text
Deploy → Manage deployments → Edit
→ Version: New version → Deploy
```

Cập nhật deployment hiện có để URL `/exec` trong `config.js` tiếp tục dùng được.

## Kiểm thử lưu

Gửi một lời chúc thử. Kết quả cần có:

- UI hiển thị “đã được lưu”.
- Execution log có `event: wish-stored`.
- Payload có `stored: true`, `submissionId`, `rowNumber`.
- Hàng mới nằm ngay sau dữ liệu thật cuối cùng.
- Trạng thái là `pending`.

## Kiểm duyệt

- `pending`: chờ duyệt.
- `approved`: công khai.
- `hidden`: ẩn.
- `featured`: ưu tiên hiển thị.
- `sortOrder`: thứ tự thủ công.

Khi đổi sang `approved`, trigger ghi `approvedAt` và xóa cache.

## Kiểm tra endpoint

```text
WEB_APP_URL?action=health
```

Kết quả phải có `ok: true` và version `1.5.0`.


## CacheService v17

- `duplicateWindowSeconds` tối đa 21600 giây.
- Cache chỉ là tối ưu ngắn hạn.
- Sau khi `submissionId` được xác minh trong Sheet, lỗi cache chỉ ghi warning và
  không làm website báo gửi thất bại.

# Thiết lập Sổ lời chúc v10

## Kiến trúc

- GitHub Pages: giao diện gửi và hiển thị lời chúc.
- Google Apps Script Web App: nhận POST và trả danh sách approved bằng JSONP.
- Google Sheet: lưu và kiểm duyệt.
- Trạng thái mặc định: `pending`.
- Website chỉ nhận các hàng `approved`.

## Bước 1 — Tạo backend

1. Mở Google Apps Script.
2. Tạo project mới.
3. Dán nội dung `tools/wedding-wishes-webapp.gs`.
4. Chạy:

```javascript
setupWeddingWishes()
```

5. Cấp quyền.
6. Mở Execution log và lưu `spreadsheetUrl`.

## Bước 2 — Deploy Web App

1. Chọn **Deploy → New deployment**.
2. Type: **Web app**.
3. Execute as: **Me**.
4. Who has access: **Anyone**.
5. Deploy.
6. Sao chép URL kết thúc bằng `/exec`.

Apps Script gọi `doGet()` cho GET và `doPost()` cho POST. Backend dùng Content
Service cho JSON/JSONP và HtmlService cho phản hồi vào iframe.

## Bước 3 — Kết nối website

Trong `config.js`:

```javascript
wishes: {
  enabled: true,
  apiUrl: "https://script.google.com/macros/s/MA_TRIEN_KHAI/exec",
  initialDisplayLimit: 6,
  pageSize: 6,
  maxNameLength: 50,
  maxRelationshipLength: 40,
  minMessageLength: 5,
  maxMessageLength: 280,
  cooldownSeconds: 180,
  requestTimeoutMs: 15000
}
```

Sau đó commit và push.

## Bước 4 — Kiểm duyệt

Trong Google Sheet:

- `pending`: chờ duyệt.
- `approved`: xuất hiện công khai.
- `hidden`: không hiển thị.

Đổi cột `status` thành `approved`. Trigger cài bởi setup sẽ:

- ghi `approvedAt`;
- xóa cache danh sách lời chúc.

Có thể chọn cột `featured` và điền `sortOrder` để ưu tiên.

## Bước 5 — Kiểm tra

Mở:

```text
WEB_APP_URL?action=health
```

Kết quả phải có `ok: true`.

Sau đó gửi một lời chúc thử:

1. Sheet nhận hàng `pending`.
2. Website chưa hiển thị.
3. Đổi status thành `approved`.
4. Tải lại sau vài giây; lời chúc xuất hiện.

## An toàn

- Không lưu số điện thoại hoặc email.
- Không trả hàng `pending`.
- Không render HTML từ người dùng.
- Có honeypot, giới hạn độ dài, rate limit, duplicate check và chống formula injection.
- JSONP chỉ chứa dữ liệu đã duyệt và công khai.
- `XFrameOptionsMode.ALLOWALL` chỉ được dùng cho trang phản hồi trống trong iframe;
  backend dùng target origin cố định `https://xuan2261.github.io`.

# Thiết lập biểu mẫu Xác nhận tham dự (RSVP) trên thiệp

Biểu mẫu nằm ngay trên thiệp và ghi thẳng vào Google Sheet — dùng chung file
Sheet với sổ lời chúc, đúng như gia đình đã chốt.

## Source chính

```text
tools/wedding-rsvp-webapp.gs      module RSVP (thêm vào project lời chúc)
tools/wedding-wishes-webapp.gs    doPost định tuyến form=rsvp sang module trên
```

Backend version: `1.0.0`.

## Cách hoạt động

- Biểu mẫu POST vào một iframe ẩn (`rsvpSubmitFrame`) nên không vướng CORS và
  chạy được trên GitHub Pages, không cần backend riêng.
- Apps Script trả kết quả về thiệp bằng `postMessage`.
- Thiệp chỉ báo "đã nhận" khi Apps Script trả `stored: true`, tức Sheet đã ghi
  thật. Không có báo thành công lạc quan.
- Dữ liệu vào tab `Xác nhận tham dự`, cùng file Sheet với tab `Lời chúc`.

## Trạng thái hiện tại

Đã cấu hình và đã kiểm chứng trên deployment thật (26/07/2026):

```text
config.js → rsvpForm.apiUrl = .../AKfycbzQN36…T3AjFT5o/exec
```

Trùng URL với sổ lời chúc là đúng thiết kế — RSVP là một module trong chính
project Apps Script đó.

Đã dò endpoint bằng hai request **không ghi dữ liệu**:

| Probe | Kết quả trả về | Kết luận |
|---|---|---|
| honeypot có dữ liệu | `wedding-rsvp-result-v1` · `SPAM_GUARD` | routing `form=rsvp` đã sống |
| thiếu họ tên | `wedding-rsvp-result-v1` · `INVALID_NAME` | chuỗi validation là code mới |

Còn lại một bước chỉ bạn làm được: gửi thử một xác nhận thật trên
`https://xuan2261.github.io/...` và xoá dòng thử trong Sheet.

> **Phải thử trên chính domain đã deploy.** Apps Script gửi kết quả về đúng
> `WISHES_APP.siteOrigin` = `https://xuan2261.github.io`. Mở bằng `file://` hay
> `localhost` thì dòng vẫn được ghi vào Sheet nhưng thiệp không nhận được phản
> hồi và sẽ báo hết thời gian chờ — đó là giới hạn của môi trường thử, không
> phải lỗi.

## Cài đặt (một lần)

1. Mở project Apps Script đang chạy sổ lời chúc (`LoiChuc_DamCuoi_Xuan_Phuong`).
2. Tạo file mới, dán toàn bộ `tools/wedding-rsvp-webapp.gs`.
3. Cập nhật file lời chúc bằng `tools/wedding-wishes-webapp.gs` trong repo
   (bản này đã có đoạn định tuyến `form=rsvp` trong `doPost`).
4. Chạy một lần:

```javascript
setupWeddingRsvp()
```

5. Deploy giữ nguyên URL:

```text
Deploy → Manage deployments → Edit
→ Version: New version → Deploy
```

URL `/exec` không đổi nên sổ lời chúc không bị gián đoạn.

6. Dán URL `/exec` đó vào `config.js`:

```javascript
rsvpForm: {
  enabled: true,
  apiUrl: "https://script.google.com/macros/s/…/exec",
```

Khi `apiUrl` còn để trống, biểu mẫu tự ẩn và thiệp giữ nguyên nút
**Liên hệ xác nhận** — không bao giờ hiện một biểu mẫu bấm vào là hỏng.

## Các trường được ghi

| Cột | Nguồn |
|---|---|
| Thời điểm | thời gian máy chủ |
| Họ và tên | khách nhập, tự điền sẵn từ link `#to=` |
| Tham dự | Có / Không |
| Số người | 0 khi khách không tham dự |
| Khách của | Chú rể / Cô dâu |
| Sự kiện | chọn trong danh sách sự kiện khách được mời |
| Lời nhắn | không bắt buộc |
| Link khách nhận | URL khách đang mở, để truy nguồn link đã gửi |
| Client key, Request ID | chống trùng và đối chiếu log |

## Chống spam và trùng lặp

- Honeypot ẩn: bot điền là bị từ chối.
- `minFormOpenMs`: gửi quá nhanh sau khi mở là bị từ chối.
- Cooldown phía khách: `rsvpForm.cooldownSeconds` (mặc định 60 giây).
- `LockService` + cửa sổ chống trùng 300 giây: khách bấm gửi hai lần chỉ ghi một dòng.

## Kiểm thử sau khi deploy

Gửi một xác nhận thử. Kết quả đúng:

- Thiệp hiện "Cảm ơn Quý khách! Hai gia đình đã nhận được xác nhận tham dự."
- Tab `Xác nhận tham dự` có đúng một dòng mới.
- Bấm gửi lại ngay lần nữa: không sinh thêm dòng.

## Tổng hợp nhanh

Chạy trong Apps Script để xem số khách theo từng sự kiện:

```javascript
summarizeWeddingRsvp()
```

## Hạn xác nhận và lúc cổng đóng

Hạn đã chốt: **23:59 của một ngày trước mỗi sự kiện**.

| Sự kiện | Ngày tổ chức | Hạn xác nhận (`rsvpClosesAt`) |
|---|---|---|
| Nhà gái | 29/07/2026 | 28/07/2026 23:59 |
| Nhà trai | 30/07/2026 | 29/07/2026 23:59 |
| Nha Trang | 15/08/2026 | 14/08/2026 23:59 |
| Sài Gòn | 22/08/2026 | 21/08/2026 23:59 |

Muốn đổi thì sửa `lifecycle.rsvpClosesAt` **và** `rsvp.deadline` của sự kiện đó
trong `config.js` — một cái điều khiển hành vi, một cái là dòng chữ khách đọc.

Trước hạn, thiệp hiển thị: *"Vui lòng xác nhận tham dự trước 28/07/2026 để gia
đình chuẩn bị đón tiếp chu đáo."*

Sau hạn: biểu mẫu và dòng hạn tự ẩn, thiệp hiển thị `lifecycle.rsvpClosedMessage`
và **vẫn giữ nút "Liên hệ xác nhận"** — vì chính thông điệp đó bảo khách liên hệ
trực tiếp, ẩn nút đi là bảo khách gọi rồi cất mất chỗ để gọi.

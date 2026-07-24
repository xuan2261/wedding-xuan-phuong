# Thiết lập v19 — Wedding Journey đa sự kiện

## Các sự kiện đã nhập

| ID | Sự kiện | Ngày | Giờ chính | Trạng thái |
|---|---|---|---|---|
| `bride` | Tiệc cưới nhà gái | 29/07/2026 | 09h00 · 09h30 · 10h00 | Thông tin chính đã có; map chưa xác minh |
| `groom` | Lễ và tiệc nhà trai | 30/07/2026 | 08h30 · 10h00 | Thông tin chính đã có |
| `nhatrang` | Tiệc Báo Hỷ Nha Trang | 15/08/2026 | 17h00 · 18h00 | Địa điểm và map còn là bản nháp |
| `saigon` | Tiệc Báo Hỷ Sài Gòn | 22/08/2026 | 17h00 · 18h00 | Địa chỉ và map còn là bản nháp |

## Link thử

```text
#to=Gia%20đình%20cô%20Lan&event=bride
#to=Anh%20Minh&event=groom
#to=Chị%20Hương&event=nhatrang
#to=Nhóm%20bạn&events=nhatrang,saigon&event=nhatrang
```

Nếu URL không có `event`, website tiếp tục dùng `groom` để tương thích link cũ.

## RSVP

RSVP đang tắt an toàn vì Form cũ chỉ phục vụ một sự kiện và còn dữ liệu cũ.

1. Chép `tools/create-google-forms-rsvp-multi-event.gs` vào Apps Script.
2. Chạy `createMultiEventWeddingRsvpForm()`.
3. Sao chép bốn URL trong `prefilledUrls` vào `config.js` tại từng event.
4. Sao chép `guestNameEntry` vào cả bốn event.
5. Đổi `enabled: false` thành `enabled: true`.
6. Chạy test và build lại `dist`.

Google Forms mới được tạo riêng, không ghi đè Form một sự kiện cũ.

## Bản đồ

- Nhà trai: popup map hoạt động theo tọa độ hiện có.
- Nhà gái: giữ link Google Maps ngoài nhưng popup tạm ẩn vì chưa xác minh pin.
- Nha Trang và Sài Gòn: link được cung cấp trùng link nhà gái nên không đưa vào runtime.

## Dữ liệu còn cần bổ sung

- Deadline RSVP từng sự kiện.
- Giờ kết thúc từng buổi.
- Địa chỉ chính xác, sảnh và bản đồ Nha Trang/Sài Gòn.
- Phân nhóm khách và giới hạn người đi cùng.
- Mốc dễ tìm, cổng vào, chỗ để xe.

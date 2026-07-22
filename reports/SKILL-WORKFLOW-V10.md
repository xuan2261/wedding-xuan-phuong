# Chuỗi 13 gói skill — bản v10

## Integrity

Báo cáo `SKILL_INTEGRITY_REPORT.txt` xác nhận 13 archive đều PASS unzip và extraction.

## Brainstorm

So sánh:

1. Chỉ giữ lời nhắn RSVP.
2. Google Form riêng.
3. Firebase.
4. Google Apps Script + Sheet có kiểm duyệt.

Chọn phương án 4 vì phù hợp kiến trúc tĩnh, không thêm framework/SDK lớn và tận
dụng hệ Google đã dùng cho RSVP.

## Planning

- Phân tách lời nhắn riêng trong RSVP và lời chúc công khai.
- Frontend không hoạt động cho đến khi URL backend hợp lệ.
- Không hiển thị trực tiếp nội dung mới gửi.
- Thiết kế module độc lập khỏi gift dialog.

## Architecture/design

- POST bằng form vào iframe để tránh phụ thuộc CORS.
- Phản hồi iframe dùng postMessage và requestId.
- GET approved-only bằng JSONP.
- Apps Script dùng ScriptProperties, Sheet, LockService, CacheService.
- Sheet là moderation UI.

## UI/UX

- RSVP và Gửi lời chúc là hai CTA chính.
- Mừng cưới chuyển thành liên kết phụ.
- Section lời chúc đặt sau album và trước ảnh kết.
- Form có label, counter, consent, aria-live và native dialog.
- Card chỉ có lời chúc, tên, quan hệ; không avatar, timestamp hay like.

## Code review/debug/fix

- Không dùng innerHTML.
- Kiểm tra exact Apps Script `/exec`.
- CSP chỉ cho hai miền Google Script cần thiết.
- Chống spreadsheet formula injection.
- Chỉ approved được serialize.
- pending là trạng thái bắt buộc phía server.
- requestId chống nhận nhầm postMessage.
- Parent kiểm tra event.origin.

## Test

- Node syntax cho JS/GS.
- HTML/CSS/static asset gates.
- Browser smoke với backend Google giả lập.
- Responsive 5 viewport.
- Submit success, JSONP list, load more, no overflow.

## Optimization loop

- Cache approved list 90 giây.
- Chỉ tải module khi enabled và apiUrl hợp lệ.
- Không polling.
- Không tải avatar hoặc thư viện ngoài.
- Ban đầu chỉ render 6 card.

## Fable evidence judge

PASS cho source/static/mock browser smoke.
Chưa PASS live Apps Script vì chưa có deployment URL thật; điều này được ghi rõ.

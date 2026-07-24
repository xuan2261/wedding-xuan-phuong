# Wedding Xuân & Phượng — v19.2.1 Audio Fade & Auto Story Hotfix

**Build:** `v19.2.1-20260724`  
**Baseline:** `v19.2-20260724`

## Phán quyết

```text
AUDIO IndexSizeError              FIXED
AUTO STORY AFTER OPEN             FIXED
NEGATIVE rAF TIMESTAMP TEST       PASS
390×844 REGRESSION                PASS
568×320 REGRESSION                PASS
7-VIEWPORT LAYOUT AUDIT           PASS
STATIC / CONTRACT GATES           PASS
LOCAL SOURCE VERDICT              RELEASE CANDIDATE
LIVE GUEST VERDICT                BLOCKED PENDING DEPLOY + DATA
```

## Root cause

`HTMLMediaElement.volume` chỉ nhận giá trị từ `0` đến `1`. Hàm cũ chỉ dùng:

```js
Math.min(1, (now - startedAt) / duration)
```

Nó không clamp cạnh dưới. Ở Edge, timestamp callback `requestAnimationFrame`
có thể nhỏ hơn `performance.now()` một lượng rất nhỏ, làm `ratio` âm và sinh
`volume = -0.001939`. Trình duyệt ném `IndexSizeError` trước khi frame fade tiếp
theo được lên lịch.

Dòng `[Intervention] Images loaded lazily...` là thông báo tối ưu của Edge đối
với ảnh `loading="lazy"`, không phải lỗi làm story dừng.

## Sửa đổi

1. Thêm `clampVolume()` cho target và mọi giá trị trung gian.
2. Clamp `elapsed` và `ratio` ở cả hai đầu.
3. Thêm `volumeFadeGeneration` để hai fade không tranh chấp.
4. Hủy fade khi pause.
5. Chờ hai frame sau khi cover đóng rồi mới start story.
6. Retry autostart một lần sau 240ms.
7. Rút thời gian chờ chương đầu từ 4,4 giây xuống 2,6 giây.
8. Thêm diagnostics trên `<body>`:
   - `data-story-state`
   - `data-story-chapter`
   - `data-story-autostart`
9. Cache bust `app.js/config.js/styles.css` từ `v=5.2` lên `v=5.3`.

## Regression test

Browser test chủ động làm sai lệch timestamp rAF `-50ms`, mô phỏng đúng điều
kiện gây lỗi trên Edge. Sau khi bấm Mở thiệp, test xác minh:

```text
volume luôn trong [0,1]
không có pageerror/console error
storyAutostart = started
storyState = running
storyChapterIndex >= 2
trang tự cuộn tới lời mời
```

## Audit còn lại

- 7 viewport: 320×568, 360×800, 390×844, 430×932, 568×320,
  768×1024, 1440×900 đều không tràn ngang.
- 9 ảnh album vẫn hiện đúng.
- Audio không phát ở initial load.
- QR chỉ tải khi mở Mừng cưới.
- RSVP vẫn disabled an toàn cho đến khi có Form đa sự kiện.
- Lazy images tiếp tục được giữ để bảo vệ tải trang đầu.

## Hạn chế live

- Chưa deploy lên GitHub Pages.
- Cần hard refresh hoặc cache bust; v19.2.1 đã dùng `app.js?v=5.3`.
- Chưa test thiết bị Android/iPhone vật lý và trình duyệt Zalo/Messenger.
- Dữ liệu Maps/RSVP đa sự kiện vẫn chưa hoàn chỉnh.

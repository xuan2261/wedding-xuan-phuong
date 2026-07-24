# Cinematic Opening & Guided Story

Cấu hình trong `config.js`:

```javascript
openingExperience: {
  enabled: true,
  rememberSession: false,
  autoStoryDefault: true,
  openingDurationMs: 1280,
  storyStartDelayMs: 4200,
  storyHoldMs: 6500,
  pauseOnInteraction: true
}
```

## Chế độ test

Thêm query sau để bỏ qua bìa:

```text
?skipCover=1
```

Hoặc trong browser test:

```javascript
window.__WEDDING_SKIP_COVER__ = true;
```

## Story stops

Thêm vào section:

```html
<section data-story-stop="event" data-story-hold="7000">
```

- `data-story-stop`: đánh dấu một điểm dừng.
- `data-story-hold`: số mili-giây giữ section trước khi chuyển tiếp.

## Story Player 2.0

- Nút trước / phát-tạm dừng / tiếp theo.
- Hiển thị tên chương và tiến trình.
- “Xem lại” hoạt động đúng khi đến cuối.
- Tự dừng khi người dùng cuộn, chạm, mở dialog hoặc chuyển tab.
- Nút “Xem thiệp đơn giản” bỏ qua animation, nhạc tự phát và auto-story.

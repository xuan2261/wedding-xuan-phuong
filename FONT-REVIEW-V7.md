# Font review — Wedding Xuân & Phượng v7

## Hệ font

```css
--sans: "Be Vietnam Pro", system-ui, -apple-system,
        BlinkMacSystemFont, "Segoe UI", sans-serif;

--serif: "Lora", "Noto Serif", Georgia, serif;

--script: "Dancing Script", "Segoe Script", cursive;
```

## Phân bổ

- **Be Vietnam Pro:** body, nút, nhãn, địa chỉ, UI.
- **Lora:** tiêu đề, lời mời, thời gian, quote.
- **Dancing Script:** tên hero, chữ ký, “Thank you”.

## Quy tắc chất lượng

- Không dùng script font cho đoạn văn dài.
- Hero dùng weight 600, line-height 1.1–1.12 để giữ dấu tiếng Việt.
- Body line-height 1.65.
- Lời mời line-height 1.9.
- `font-synthesis: none` tránh trình duyệt tự tạo bold/italic giả.
- `display=swap` giữ nội dung luôn nhìn thấy khi font đang tải.
- Fallback vẫn hoạt động khi Google Fonts không khả dụng.

## Độ tương phản

| Cặp màu | Tỷ lệ |
|---|---:|
| Vàng cũ `#b8995a` / `#fffdf8` | 2.67:1 — không dùng cho chữ nhỏ |
| Vàng mới `#886e38` / `#fffdf8` | 4.77:1 |
| Muted `#626c66` / `#fffdf8` | 5.36:1 |
| Muted `#626c66` / `#f7f2e8` | 4.88:1 |

## Caveat

Font hiện được tải từ Google Fonts. Điều này tạo request tới Google và phụ
thuộc kết nối mạng. Nếu cần độc lập hoàn toàn, có thể self-host WOFF2 sau khi
xác nhận license và thiết lập subset tiếng Việt. Artifact này không kèm file font.

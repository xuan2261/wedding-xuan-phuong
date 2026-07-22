# Full review and implementation — Wedding Xuân & Phượng v8

## Hero

```text
Thanh                         Thị
Xuân             &          Phượng
```

Từng từ vẫn đọc ngang. Hai cụm tên nằm ở vùng cây tối hai bên và không phủ lên
khuôn mặt như bố cục chữ lớn ở giữa trước đây.

## HTML

- Một H1 duy nhất.
- H1 có chuỗi sr-only: `Thanh Xuân và Thị Phượng`.
- Hai cụm visual dùng `aria-hidden="true"`.
- Tiêu đề lời mời gồm hai dòng có chủ đích.
- Chữ ký tách dấu `&` sang font serif.

## JavaScript

- `splitDisplayName()` tách từ cuối xuống dòng 2.
- `setHeroNames()` cập nhật hero từ `config.js`.
- `setBalancedInvitationHeading()` cân tiêu đề động.

## CSS

- Hero dùng grid ba cột.
- Gradient tối hơn ở phần trên và hai mép, nhẹ ở vùng mặt.
- Ngày cưới và CTA nằm ở vùng cuối màn hình.
- Breakpoint cho 460 px và 350 px.
- Lời mời có max-width 34ch và line-height 1.78.
- Chữ ký nhỏ hơn, có flex-wrap.

## Giới hạn

Preview sandbox dùng font fallback vì Google Fonts không thể tải trong môi trường
kiểm thử. Website production vẫn dùng Dancing Script, Lora và Be Vietnam Pro.

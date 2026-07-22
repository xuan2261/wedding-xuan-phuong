# Chuỗi 13 gói skill — Lazy Wishes v12

## Integrity
Đối chiếu SKILL_INTEGRITY_REPORT.txt: 13 archive đều PASS kiểm tra ZIP và giải nén.

## Chuỗi áp dụng
brainstorm → planning → architecture/design → UI/UX → code review → debug/fix/cook → static test → optimization loop → Fable evidence judge.

## Quyết định
- Không dùng setTimeout cố định.
- Dùng IntersectionObserver rootMargin 1200px.
- Click Gửi lời chúc tải ngay.
- State idle/loading/loaded chống request trùng.
- Lỗi/timeout quay lại idle và hiện retry.
- Fallback scroll/resize cho trình duyệt cũ.
- content-visibility giảm layout/paint ngoài viewport.
- Backend cache 300 giây; trigger duyệt vẫn xóa cache.

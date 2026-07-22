# 13-skill implementation matrix — Wedding v17

| Phase | Skills | Kết quả thực hiện |
|---|---|---|
| Brainstorm | ak-brainstorm | Giữ kiến trúc static nhẹ; chọn cá nhân hóa, timeline, calendar và share là nâng cấp giá trị cao. |
| Planning | ak-plan + ck-plan | Tách v16.1 correctness khỏi v17 UX; đặt acceptance criteria trước khi sửa. |
| Architecture / design | ak-design | Thêm guest-utils độc lập, cấu hình tùy chọn và không đưa guest list vào repo. |
| UI/UX | ak-ui-ux-pro-max | Thiết kế thẻ mời XP, timeline hai mốc, action buttons và lightbox điều hướng. |
| Code review | ak-code-review | Rà soát HTML/CSS/JS/config/Apps Script/CI và hợp đồng stored:true. |
| Debug | ck-debug | Sửa TTL CacheService, cache side effect, autoplay, image sizes và empty src. |
| Fix / cook | ak-fix + ak-cook + cook | Áp dụng patch tối thiểu, giữ RSVP/QR/nhạc/ảnh production. |
| Test | ak-test | Static, contract, personalization, image/QR decode và 5 viewport browser smoke. |
| Optimization loop | ak-loop | Không tăng initial image requests; preload lightbox chỉ ảnh kế tiếp; giữ lazy wishes. |
| Fable evidence judge | ak-fable-thinking | Phân biệt source pass với live deployment và các cấu hình chưa có dữ liệu. |


## Integrity

Bản nghiên cứu trước ghi nhận 13/13 gói skill PASS kiểm tra ZIP và giải nén.
Release v17 không phân phối lại các archive skill; chỉ chứa source thiệp và bằng
chứng triển khai.

## Chuỗi áp dụng

```text
brainstorm
→ planning
→ architecture/design
→ UI/UX review
→ code review
→ debug
→ fix/cook
→ static test
→ browser test
→ optimization review
→ Fable evidence judge
```

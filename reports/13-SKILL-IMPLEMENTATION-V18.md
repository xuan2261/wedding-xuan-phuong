# 13-skill implementation matrix — Wedding v18

| Phase | Skills | Kết quả |
|---|---|---|
| Brainstorm | ak-brainstorm | Chọn popup lazy thay vì custom RSVP backend mới. |
| Planning | ak-plan + ck-plan | Đặt invariant: không request Forms/Maps lúc initial load; dữ liệu web/Form phải khớp. |
| Architecture/design | ak-design | Thêm dialog boundaries, single source dữ liệu và fallback rõ ràng. |
| UI/UX | ak-ui-ux-pro-max | RSVP full-screen mobile, map dialog, loading state, general/personalized share separation. |
| Code review | ak-code-review | Rà HTML/CSS/JS/CSP/config/Apps Script/CI. |
| Debug | ck-debug | Sửa data drift 08h00/24-07/thiếu địa chỉ và href RSVP rời trang. |
| Fix/cook | ak-fix + ak-cook + cook | Áp dụng patch giới hạn, giữ backend lời chúc, QR, ảnh và MP3. |
| Test | ak-test | Static, contract, consistency, assets/QR, syntax và 5-viewport browser smoke. |
| Optimization loop | ak-loop | Forms, Maps và Wishes đều lazy; animation local; remote music chỉ fallback. |
| Fable judge | ak-fable-thinking | Chấp nhận source candidate; live deployment và real Google Form vẫn là gate ngoài môi trường. |

## Integrity

Báo cáo skill đã tải lên ghi nhận 13/13 archive PASS kiểm tra ZIP và giải nén.
Các archive không được phân phối lại trong source thiệp.

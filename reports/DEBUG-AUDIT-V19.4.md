# Wedding Xuân & Phượng — v19.4 Full Debug, Audit & Adaptive Guest-Ready Upgrade

**Build:** `v19.4-20260724`  
**Nguồn nâng cấp:** `v19.3-20260724`  
**Generated:** `2026-07-24T08:25:45+00:00`  
**Phán quyết:** `LOCAL_RELEASE_CANDIDATE_BLOCKED_BY_LIVE_RSVP_MAP_AND_PHYSICAL_DEVICE_GATES`

## Chuỗi 13-skill

```text
integrity gate
→ requirements + live parity audit
→ online invitation research
→ brainstorm
→ architecture/planning
→ visual/motion + mobile UI/UX
→ accessibility/privacy
→ code review
→ root-cause debug
→ fix/cook
→ static/contract/browser test
→ optimization loop
→ Fable evidence judge
```

Báo cáo integrity đã tải lên xác nhận 13/13 archive skill giải nén thành công.
Các workflow được dùng làm phương pháp audit; archive không được nhúng vào runtime.

## Fresh audit trước khi sửa

### A01 — RSVP đa sự kiện bị vô hiệu hóa thành ngõ cụt

Source v19.3 chủ động không mở Google Form cũ, nhưng nút RSVP không còn hành động
hữu ích. Trong thời gian chờ Form đa sự kiện, khách vẫn cần một cách xác nhận.

### A02 — cinematic story chưa thích ứng với Data Saver/2G

Auto-story có thể chuẩn bị ảnh chương kế và nhạc có thể bắt đầu sau thao tác mở,
nhưng source chưa giảm hoạt động tự động khi trình duyệt báo chế độ tiết kiệm dữ
liệu hoặc mạng rất chậm.

### A03 — focus sau mở thiệp chưa chuyển tới nội dung vừa lộ ra

Sau khi dialog bìa đóng, focus có thể về `body`. Người dùng bàn phím hoặc trình
đọc màn hình không được đưa tới tiêu đề hero.

### A04 — tên khách dài trên màn hình ngang thấp

Tên cá nhân hóa dài làm tăng chiều cao phần bìa. Bố cục cần wrap/scroll an toàn
và giữ nút Mở thiệp tiếp cận được ở 568×320.

### A05 — công cụ tạo link chưa hỗ trợ phân nhóm khách thật

Công cụ cũ áp dụng cùng một tổ hợp event cho toàn bộ danh sách. Mô hình bốn sự
kiện cần dữ liệu theo từng khách/gia đình.

### A06 — live site vẫn cũ

Website công khai vẫn là thiệp một sự kiện với đón khách 08h00 và RSVP trước
24.07.2026. Source local tốt không chứng minh URL khách mời đã được cập nhật.

## Nâng cấp đã thực hiện

### 1. RSVP contact fallback

Khi URL Form của event chưa được cấu hình, nút đổi thành **Liên hệ xác nhận** và
mở native dialog gồm:

- số chú rể `0374 037 026`;
- số cô dâu `0906 878 461`;
- nút gọi điện;
- nút sao chép;
- gợi ý liên hệ nhà gái/nhà trai theo event;
- trả focus về nút RSVP khi đóng dialog.

Khi Form thật được bật, cơ chế iframe RSVP hiện có tiếp tục được sử dụng.

### 2. Adaptive constrained-data mode

`navigator.connection.saveData` và `effectiveType` được đọc như progressive
enhancement. Khi phát hiện Data Saver hoặc `slow-2g/2g`:

- checkbox Tự động xem mặc định tắt;
- nhạc không tự bắt đầu;
- ảnh chuẩn bị mỗi chương giảm từ tối đa 4 xuống 1;
- bìa thông báo rõ chế độ tiết kiệm dữ liệu;
- người dùng vẫn có thể bấm Story Player hoặc icon nhạc thủ công.

API Network Information không có trên mọi trình duyệt, nên khi không hỗ trợ,
website giữ hành vi chuẩn thay vì coi đó là lỗi.

### 3. Focus management sau cinematic cover

`#hero-title` có `tabindex="-1"` và nhận focus sau khi dialog bìa đóng. Browser
audit xác minh active element là `hero-title` ở cả 7 viewport.

### 4. Bìa chịu được tên khách dài

- `overflow-wrap:anywhere` cho tên khách;
- cover content có `overflow-y:auto` và overscroll containment;
- short-landscape giảm cỡ chữ khách, bố trí nội dung và action thành hai cột;
- test tên dài tại 568×320 không tràn ngang, nút Mở thiệp vẫn nhìn thấy và hoạt động.

### 5. Guest Link Tool 2.0

`tools/create-guest-links.html` hỗ trợ CSV theo từng khách:

```text
invitationCode,displayName,phone,events,defaultEvent,maxGuestCount,note
```

Đã thêm:

- chọn/tải CSV;
- CSV mẫu;
- event riêng cho mỗi dòng;
- default event riêng;
- export CSV có link;
- hoạt động offline, không tải danh sách khách lên server.

Tệp mẫu độc lập: `tools/guest-list-template.csv`.

### 6. Regression gates mới

- `tests/release_hardening_check.mjs`
- `tests/guest_tool_check.py`
- assertions v19.4 trong browser/dist tests
- CI chạy các gate hardening mới trước deploy.

## Research được áp dụng

1. Thiệp đa sự kiện nên cá nhân hóa để khách chỉ thấy event và câu hỏi RSVP liên
   quan tới mình.
2. Nội dung tự chạy phải có pause/restart rõ ràng; Story Player hiện tại được giữ.
3. Animation tiếp tục ưu tiên `transform`/`opacity` thay vì thuộc tính gây layout.
4. Data Saver/mạng chậm là tín hiệu để giảm autoplay và preload, không phải lý do
   khóa hoàn toàn nội dung.

Nguồn nghiên cứu chính:

- W3C WCAG Pause, Stop, Hide
- web.dev High-performance CSS animations
- MDN NetworkInformation.saveData
- Joy multi-event schedules/RSVP and guest tags

## Kết quả test

```text
Static / contract / syntax gates      18/18 PASS
Four event profiles                   4/4 PASS
Chromium viewports                    7/7 PASS
Horizontal overflow                   0
Page errors                           0
Console errors                        0
Focus after opening                   PASS
Audio volume                          PASS [0,1]
RSVP contact fallback                 PASS
Constrained-data behavior             PASS
Long guest name 568×320               PASS
Clean dist                            PASS
```

Viewport:

```text
320×568
360×800
390×844
430×932
568×320
768×1024
1440×900
```

## Source metrics

```text
Source files (excluding dist)         175
Source bytes                          8377638
Dist files                            47
Dist bytes                            7893227
HTML IDs                              100
Duplicate IDs                         0
Missing local references              0
innerHTML assignments                 0
eval calls                            0
new Function calls                    0
Static event share pages              4
```

## Blocker còn lại

1. Chưa tạo/gắn Google Form RSVP đa sự kiện.
2. Chưa có địa chỉ và Maps thật của Nha Trang/Sài Gòn.
3. Pin nhà gái chưa xác minh.
4. Chưa có deadline RSVP và giờ kết thúc từng event.
5. Chưa nhập phân nhóm khách thật vào CSV.
6. GitHub Pages chưa deploy v19.4.
7. Chưa test thiết bị Android/iPhone thật và Zalo/Messenger.
8. Chưa chạy live E2E RSVP và lời chúc.

## Fable Evidence Judge

```text
SOURCE v19.4                         ACCEPT
ADAPTIVE DATA MODE                  ACCEPT
RSVP CONTACT FALLBACK               ACCEPT
POST-COVER FOCUS                    ACCEPT
LONG-NAME LANDSCAPE                 ACCEPT
PER-GUEST CSV LINK TOOL             ACCEPT
MORE RANDOM ANIMATION               REJECT
SHOW ALL EVENTS TO ALL GUESTS       REJECT
PRODUCTION CLAIM FROM LOCAL TESTS    REJECT

FINAL:
LOCAL RELEASE CANDIDATE
NOT YET GUEST-READY
```

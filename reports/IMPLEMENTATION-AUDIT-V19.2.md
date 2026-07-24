# Wedding Xuân & Phượng — v19.2 Full Debug, Audit & Cinematic Story 2.0

**Build:** `v19.2-20260724`  
**Nguồn nâng cấp:** `v19.1-20260723`  
**Phán quyết:** `PASS_LOCAL_RELEASE_CANDIDATE_BLOCKED_BY_LIVE_CONFIGURATION`

## Chuỗi 13-skill

```text
integrity gate
→ requirements / multi-event audit
→ online invitation research
→ brainstorm
→ architecture and planning
→ visual / motion design
→ mobile UI/UX
→ accessibility / privacy
→ code review
→ root-cause debug
→ fix/cook
→ static + contract + browser test
→ optimization loop
→ Fable evidence judge
```

Báo cáo toàn vẹn đã tải lên xác nhận 13/13 archive skill giải nén thành công. Các archive không được nhúng vào runtime; workflow của chúng được dùng như phương pháp đánh giá và sửa source.

## Root causes tìm thấy trong v19.1

1. **Cấu hình chia sẻ Nha Trang bị lồng `sharing` hai lần.** Metadata động nhận sai cấu trúc.
2. **Trạng thái kết thúc story bị ghi đè.** Code đặt `Xem lại`, sau đó hàm đồng bộ đổi thành `Tự xem`.
3. **Cuộn mượt do chương trình bị hiểu là cuộn tay.** Auto-story có thể tự pause ngay sau khi chuyển chương.
4. **Thiếu điều hướng chương.** Chỉ có play/pause và bộ đếm, khách khó quay lại phần vừa bỏ lỡ.
5. **Con dấu pulse vô hạn.** Không phù hợp nguyên tắc chuyển động tiết chế và gây phân tán.
6. **Không có chế độ xem đơn giản.** Người lớn tuổi hoặc người không muốn animation vẫn phải đi qua cinematic opening.
7. **Cover luôn tải ảnh 1280px qua CSS background.** Mobile không tận dụng ảnh 720px.
8. **Pause khi mở modal chưa được quản lý bằng trạng thái modal.** Phụ thuộc tương tác pointer nên không bao quát mọi cách mở.
9. **Âm lượng khởi tạo 0.8 quá cao cho nhạc nền.** Không có fade-in/ducking khi đọc Form hoặc bản đồ.
10. **`dist/` chứa tài nguyên không phục vụ runtime.** README, QR SVG trùng và ảnh header Google Forms không cần được public.

## Nâng cấp đã thực hiện

### Bìa cinematic có hai chế độ

- `Mở thiệp`: chạy split-panel, ảnh reveal, nhạc fade-in và story tự động nếu khách chọn.
- `Xem thiệp đơn giản`: bỏ animation dài, không tự chạy story, không tự phát nhạc và hiển thị nội dung ngay.
- Cover dùng `<picture>`: 720px trên mobile, 1280px trên màn hình lớn.
- Con dấu XP chỉ pulse hai chu kỳ.
- Accent cover thay nhẹ theo Nhà gái, Nhà trai, Nha Trang và Sài Gòn nhưng vẫn giữ nhận diện xanh rừng–kem.

### Story Player 2.0

- Chương trước.
- Phát/tạm dừng.
- Tên chương.
- Bộ đếm.
- Chương tiếp theo.
- Thanh tiến trình.
- Kết thúc đúng trạng thái `Xem lại`.
- Replay trở về chương 1/8.
- Cuộn tay đồng bộ chương gần nhất khi đang pause.
- Tự pause khi mở RSVP, Maps, Gift, Lightbox hoặc dialog khác.
- Tự pause khi tab bị ẩn.

Tám chương hiện tại:

1. Ảnh mở đầu
2. Lời mời dành cho Quý vị
3. Lời ngỏ
4. Cô dâu và chú rể
5. Lịch trình sự kiện
6. Album ảnh cưới
7. Những lời chúc
8. Lời cảm ơn

### Nhạc nền

- Âm lượng mặc định giảm xuống 0.35.
- Fade-in 1,2 giây từ thao tác Mở thiệp.
- Giảm còn khoảng 0.12 khi dialog mở.
- Khôi phục sau khi dialog đóng.
- Chế độ đơn giản không tự phát nhạc.

### Tối ưu production

Bản `dist` không còn chứa:

```text
assets/audio/README.txt
assets/qr/README.md
assets/qr/qr-nha-gai.svg
assets/qr/qr-nha-trai.svg
assets/images/google-forms-header-xuan-phuong-v2.jpg
```

## Kết quả kiểm thử

```text
Static / syntax / consistency / contract gates   12/12 PASS
Event-specific mobile covers                      4/4 PASS
Additional responsive viewports                   6/6 PASS
Horizontal overflow                               0
Story chapters                                    8/8
Story completion / replay                         PASS
Dialog-triggered pause                            PASS
Simple mode                                       PASS
Reduced Motion                                    PASS
Initial external/QR/music requests                0
```

Các viewport browser audit:

```text
320 × 568
360 × 800
390 × 844
430 × 932
568 × 320
768 × 1024
1440 × 900
```

## Những gì chưa được phép gọi là hoàn tất production

1. Website GitHub Pages công khai vẫn là source cũ một sự kiện.
2. Google Form công khai vẫn chứa giờ 08h00, `Nhà hàng XXX`, địa chỉ và deadline cũ.
3. Bốn URL RSVP đa sự kiện chưa được tạo/gắn.
4. Maps nhà gái chưa xác minh pin.
5. Nha Trang và Sài Gòn chưa có địa chỉ/Maps chính xác.
6. Chưa test thiết bị Android, iPhone, Zalo và Messenger thật.

## Fable Evidence Judge

```text
CINEMATIC FOUNDATION             ACCEPT
MULTI-EVENT PERSONALIZATION      ACCEPT
STORY PLAYER 2.0                 ACCEPT
SIMPLE MODE                      ACCEPT
INFINITE DECORATIVE MOTION       REJECTED
EXTERNAL ANIMATION DEPENDENCY    REJECTED
LOCAL SOURCE                     RELEASE CANDIDATE
LIVE GUEST RELEASE               BLOCKED
```

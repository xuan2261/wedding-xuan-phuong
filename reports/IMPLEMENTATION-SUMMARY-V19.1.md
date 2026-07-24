# Wedding Xuân & Phượng v19.1 — Cinematic Opening & Guided Story

**Build:** `v19.1-20260723`  
**Nguồn nâng cấp:** `v19.0-20260723`  
**Video tham khảo:** `msedge_YRn82VKSXv.mp4` — 122,3 giây, 1912×956, 30 fps

## Phán quyết

```text
13-SKILL WORKFLOW                 APPLIED
VIDEO REFERENCE ANALYSIS         COMPLETE
CINEMATIC COVER                  PASS
FOUR EVENT-SPECIFIC COVERS       PASS
OPENING SPLIT-PANEL SEQUENCE     PASS
GUIDED AUTO-STORY                PASS
MANUAL PAUSE ON INTERACTION      PASS
REDUCED-MOTION FALLBACK          PASS
STATIC / CONTRACT / ASSET        PASS
CLEAN DIST                       PASS
LIVE DEPLOYMENT                  NOT PERFORMED
FINAL RSVP / MAP DATA            STILL PENDING
```

## Chuỗi đánh giá được áp dụng

```text
integrity gate
→ video decomposition
→ interaction brainstorm
→ multi-event architecture review
→ visual and motion design
→ mobile-first UI/UX review
→ accessibility and privacy review
→ code review
→ root-cause debug
→ TDD fix/cook
→ static + browser test
→ performance optimization loop
→ Fable evidence judge
```

Các gói skill đã được kiểm tra toàn vẹn ở các vòng trước. Vòng này sử dụng chuỗi
phương pháp của chúng để triển khai trên source v19.0; không nhúng hoặc phân phối
các archive skill vào website.

## Phân tích video tham khảo

### 0–4 giây — bìa thiệp đóng

- Nền xanh lá đậm.
- Đường gấp dọc màu kem ở giữa.
- Con dấu tròn đặt đúng đường gấp.
- Tên cô dâu/chú rể và nút mở thiệp rất tối giản.
- Người xem chưa bị tải ngay toàn bộ thông tin.

### 4–7 giây — mở thiệp

- Hai cánh xanh tách về hai phía.
- Ảnh cưới xuất hiện phía dưới.
- Nội dung chính được lộ ra thay vì chuyển sang một trang hoàn toàn khác.
- Chuyển động ngắn và có điểm kết thúc rõ ràng.

### 8–122 giây — hành trình nội dung

- Xen kẽ nền xanh và nền kem.
- Ảnh lớn làm điểm neo thị giác.
- Thông tin gia đình, nghi lễ, địa điểm, lịch, countdown, lời chúc, quà mừng và
  RSVP xuất hiện tuần tự.
- Các animation chủ yếu là fade/slide nhẹ, còn chuyển trang được tạo bởi cuộn dọc.

## Thiết kế v19.1

### Bìa thiệp đa sự kiện

Bìa mới tự đổi theo:

- Tên khách từ `#to=`.
- Sự kiện từ `event=bride|groom|nhatrang|saigon`.
- Tên sự kiện.
- Thứ và ngày.
- Tên Thanh Xuân & Thị Phượng.

Bốn profile đã kiểm tra:

```text
bride       Tiệc cưới nhà gái                 29.07.2026
groom       Lễ Thành Hôn và tiệc nhà trai    30.07.2026
nhatrang    Tiệc Báo Hỷ tại Nha Trang        15.08.2026
saigon      Tiệc Báo Hỷ tại Sài Gòn          22.08.2026
```

### Chuỗi mở thiệp

```text
Bấm con dấu XP
→ bắt đầu nhạc trong chính thao tác người dùng
→ con dấu thu nhỏ
→ nội dung bìa mờ đi
→ cánh trái và cánh phải mở
→ ảnh hero được lộ ra
→ bìa đóng
→ hero chạy stagger animation
```

Không sử dụng thư viện animation ngoài. Animation chính chỉ thay đổi
`transform` và `opacity`.

### Chế độ xem tự động

Checkbox **Tự động xem từng phần** mặc định được bật.

Sau khi mở:

```text
Hero
→ Lời mời cá nhân hóa
→ Lời ngỏ
→ Cô dâu & chú rể
→ Lịch trình
→ Album
→ Lời chúc nếu khả dụng
→ Lời cảm ơn
```

Mỗi section có thời gian giữ riêng từ 4,2 đến 8,5 giây.

Khách có thể:

- Bấm nút **Đang tự xem** để tạm dừng.
- Bấm lại để tiếp tục từ section gần nhất.
- Cuộn, chạm hoặc dùng phím điều hướng để tự động tạm dừng.
- Chuyển tab sẽ tự động tạm dừng.

Không thực hiện continuous-scroll ép buộc; hệ thống chỉ chuyển tới từng điểm neo
bằng `scrollIntoView()`.

### Reduced motion

Khi thiết bị bật giảm chuyển động:

- Bìa vẫn hiển thị.
- Bấm Mở thiệp sẽ mở ngay.
- Tự động xem bị tắt.
- Story control bị ẩn.
- Các animation khác được rút về trạng thái tĩnh.

## Thay đổi source

```text
index.html
  + dialog bìa thiệp
  + dữ liệu cover đa sự kiện
  + 8 story stops
  + story player cố định

styles.css
  + bìa xanh, đường gấp, con dấu XP
  + responsive portrait/landscape
  + story player và progress

assets/css/wedding-motion.css
  + split-panel opening
  + seal animation
  + hero reveal bridge
  + reduced-motion overrides

app.js
  + setupOpeningExperience()
  + setupGuidedStory()
  + đồng bộ cover với event/guest
  + phát nhạc từ cover click
  + pause story khi có tương tác

config.js
  + openingExperience

tests
  + opening_experience_check.mjs
  + sửa browser smoke RSVP stale assertion
  + cập nhật multi-event lifecycle contract
```

## Test tĩnh

```text
node --check app.js                         PASS
node --check config.js                      PASS
python tests/consistency_check.py           PASS
python tests/verify_release.py              PASS
node tests/opening_experience_check.mjs     PASS
node tests/multi_event_check.mjs            PASS
node tests/contract_check.js                PASS
node tests/personalization_check.js         PASS
node tests/lifecycle_check.js               PASS
python tests/verify_assets.py               PASS
python tools/build-dist.py                  PASS
python tests/verify_dist.py                 PASS
```

## Browser audit mới

### Bốn cover sự kiện

[
  {
    "eventId": "bride",
    "screenshot": "cover-bride-390x844.png",
    "guest": "Gia đình cô Hạnh",
    "event": "Tiệc cưới nhà gái",
    "date": "29.07.2026",
    "open": true,
    "sealInside": true,
    "overflow": 0
  },
  {
    "eventId": "groom",
    "screenshot": "cover-groom-390x844.png",
    "guest": "Gia đình cô Lan",
    "event": "Lễ Thành Hôn và tiệc nhà trai",
    "date": "30.07.2026",
    "open": true,
    "sealInside": true,
    "overflow": 0
  },
  {
    "eventId": "nhatrang",
    "screenshot": "cover-nhatrang-390x844.png",
    "guest": "Nhóm bạn Nha Trang",
    "event": "Tiệc Báo Hỷ tại Nha Trang",
    "date": "15.08.2026",
    "open": true,
    "sealInside": true,
    "overflow": 0
  },
  {
    "eventId": "saigon",
    "screenshot": "cover-saigon-390x844.png",
    "guest": "Đồng nghiệp Sài Gòn",
    "event": "Tiệc Báo Hỷ tại Sài Gòn",
    "date": "22.08.2026",
    "open": true,
    "sealInside": true,
    "overflow": 0
  }
]

### Responsive cover

[
  {
    "name": "desktop",
    "viewport": [
      1440,
      900
    ],
    "screenshot": "cover-desktop-1440x900.png",
    "contentInside": true,
    "sealInside": true,
    "overflow": 0
  },
  {
    "name": "landscape",
    "viewport": [
      568,
      320
    ],
    "screenshot": "cover-landscape-568x320.png",
    "contentInside": true,
    "sealInside": true,
    "overflow": 0
  },
  {
    "name": "small-mobile",
    "viewport": [
      320,
      568
    ],
    "screenshot": "cover-small-mobile-320x568.png",
    "contentInside": true,
    "sealInside": true,
    "overflow": 0
  }
]

### Opening và auto-story

{
  "afterClick": {
    "bodyOpened": true,
    "storyVisible": true,
    "storyRunning": "true",
    "audioSources": 2,
    "overflow": 0
  },
  "afterAdvance": {
    "scrollY": 855,
    "counter": "2/8",
    "running": "true"
  },
  "afterManualScroll": {
    "running": "false",
    "label": "Tự xem"
  }
}

### Reduced motion

{
  "before": {
    "autoDisabled": true,
    "autoChecked": false
  },
  "after": {
    "storyHidden": true,
    "bodyOpened": true
  }
}

## Giới hạn còn lại

1. Browser audit dùng Chromium với source thật được inline vì sandbox chặn localhost.
2. Google Fonts bị chặn trong môi trường test; cần kiểm tra Dancing Script/Lora
   trên Android, iPhone, Zalo và Messenger.
3. Google Form đa sự kiện vẫn chưa được tạo và điền URL.
4. Maps nhà gái/Nha Trang/Sài Gòn vẫn chưa xác minh.
5. Source vẫn ở trạng thái draft multi-event; chưa deploy GitHub Pages.
6. Nhạc trực tuyến dự phòng phụ thuộc máy chủ bên thứ ba.

## Cấu hình có thể chỉnh

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

- `rememberSession: true`: chỉ hiện cover một lần trong mỗi tab/session.
- `autoStoryDefault: false`: mở thiệp nhưng không tự chuyển section.
- `openingDurationMs`: thời gian mở hai cánh.
- `storyStartDelayMs`: giữ hero bao lâu trước bước đầu.
- `storyHoldMs`: thời gian mặc định cho mỗi section.

## Fable Evidence Judge

```text
VIDEO REFERENCE PATTERN           PROVEN
COVER PERSONALIZATION             PROVEN
EVENT-SPECIFIC COPY               PROVEN
SPLIT-PANEL ANIMATION             PROVEN
AUTO STORY ADVANCE                PROVEN
MANUAL INTERACTION PAUSE          PROVEN
REDUCED MOTION                    PROVEN
NO HORIZONTAL OVERFLOW            PROVEN
LIVE FONT METRICS                 NOT PROVEN
LIVE GOOGLE RSVP                  NOT PROVEN
LIVE MAP PINS                     NOT PROVEN
PHYSICAL IOS / ANDROID            NOT PROVEN

VERDICT:
ACCEPT V19.1 AS A CINEMATIC MULTI-EVENT RELEASE CANDIDATE
DO NOT DEPLOY AS FINAL UNTIL RSVP AND MAP DATA ARE COMPLETED
```

## Nguồn kỹ thuật tham khảo

- MDN — Web Animations API và `Element.animate()`
- MDN — Intersection Observer API
- MDN — Autoplay guide for media
- MDN — View Transition API
- W3C WAI — `prefers-reduced-motion`
- web.dev — high-performance animation with transform and opacity

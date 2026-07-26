# Debug v20.2 — tự cuộn, reload, RSVP inline, nút quà mừng cưới

Ngày: 26/07/2026 · Branch: `main` (clean) · Phương pháp: repro thật bằng Playwright 1.62 (Chromium, viewport 390×844), server tĩnh nội bộ.

Script repro: `tmp/repro-scroll.mjs`, `tmp/repro-scroll-variants.mjs`, `tmp/repro-gift-and-reload.mjs` (thư mục `tmp/` đã gitignore).

## Tóm tắt

| # | Vấn đề | Mức | Trạng thái |
|---|---|---|---|
| 1 | F5 không quay về đầu trang | P0 | Đã chứng minh |
| 2 | Tự cuộn chết ngay khi khách chạm màn hình | P0 | Đã chứng minh |
| 3 | Máy bật "tiết giảm chuyển động" → mất hẳn tự cuộn *và* mất story player | P0 | Đã chứng minh |
| 4 | 4,2s đầu sau khi mở thiệp không có gì di chuyển | P1 | Đã chứng minh |
| 5 | Mọi khách đều thấy 2 câu "RSVP sẽ cập nhật sau" | P1 | Đã chứng minh |
| 6 | Comment QR trái ngược với cờ `qrIdentifierVerified` | P3 | Đã xác nhận |

Kết luận nhanh về 2 đề xuất: **cả hai đều nên làm**. Đề xuất RSVP → Google Sheet đặc biệt đáng làm vì hạ tầng y hệt **đã chạy thật** trong repo (sổ lời chúc). Đề xuất 2 nút quà mừng cưới cần gia đình chốt 1 câu hỏi dữ liệu trước khi code.

---

## 1. F5 không quay về đầu trang (P0)

Bằng chứng:

```
before reload scrollY: 4200
after reload: {"y":4200,"coverOpen":true,"coverBtnFocused":"coverOpenButton"}
history.scrollRestoration === "auto"
```

Nguyên nhân gốc: không có chỗ nào trong `app.js` đặt `history.scrollRestoration` hay reset scroll khi load. Trình duyệt tự phục hồi vị trí cũ, trong khi `setupOpeningExperience()` lại `showModal()` màn bìa đè lên trên (`app.js:1146-1153`). Khách F5 thấy màn bìa, bấm "Mở thiệp", và ở dưới lớp bìa trang đang nằm giữa album.

Hệ quả kép: nếu tự cuộn bị tắt (mục 2, 3) thì sau khi mở thiệp khách đứng luôn ở y=4200, không hiểu mình đang ở đâu.

Cách sửa: đặt `history.scrollRestoration = "manual"` ngay đầu `app.js`, và `window.scrollTo(0, 0)` trước khi mở màn bìa. Trường hợp `skipCover`/chuyển sự kiện cũng nên về đầu vì cấu hình sự kiện đã đổi. Giữ ngoại lệ cho link có `#anchor` thật (không phải `#to=`).

## 2. Tự cuộn chết ngay khi khách chạm màn hình (P0 — nguyên nhân chính của "vẫn không tự cuộn")

Bằng chứng — kịch bản D (thiết bị cảm ứng, chạm 1 lần vào màn hình ở giây thứ 3,5 sau khi mở thiệp):

```
{"y":0,"autostart":"started","state":"paused","ch":1,"pause":"interaction"}
```

So với kịch bản C (không chạm gì): `y: 0 → 855 → 1214`, chạy bình thường.

Nguyên nhân gốc: `app.js:926-940` gắn `pauseForInteraction` vào `touchstart` **và** `pointerdown`. Chỉ cần *chạm*, chưa cần cuộn, là tour dừng vĩnh viễn — chỉ có 1 toast nhỏ "Đã tạm dừng chế độ xem tự động" báo lại. Trên điện thoại, chạm màn hình sau khi bấm "Mở thiệp" là hành vi gần như chắc chắn xảy ra (khách chạm để "xem có gì"), nên phần lớn khách sẽ thấy đúng hiện tượng bạn gặp: bấm mở thiệp, dừng ở hero, không cuộn.

Cách sửa (3 lớp):
- Bỏ `pointerdown`/`touchstart` khỏi danh sách tín hiệu pause; dùng `wheel` + `touchmove` (cuộn thật) — chạm để ngắm không phải là ý định dừng.
- Thêm grace window ~1200ms sau `finishOpening` để chuỗi sự kiện của chính cú bấm "Mở thiệp" không tự pause.
- Pause phải có đường quay lại rõ ràng: hiện nút "Tiếp tục tự xem" trong story player (hoặc tự chạy lại sau ~10s không tương tác), thay vì chỉ một toast biến mất.

## 3. Bật "tiết giảm chuyển động" → mất hẳn tự cuộn và mất cả story player (P0)

Bằng chứng — kịch bản B (`prefers-reduced-motion: reduce`):

```
{"y":0,"autostart":"simple-mode","state":"-","playerHidden":true,"simple":true}
```

Không có chương nào chạy, story player bị ẩn hoàn toàn, khách không có nút Tiếp/Trước để tự đi.

Nguyên nhân gốc: `openInvitation()` (`app.js:1116-1119`) coi `reduceMotion` = `simpleMode`, `start()` (`app.js:879`) chặn thẳng khi `reduceMotion`, `show()` (`app.js:914`) ẩn player, và `app.js:1014` còn `autoStory.disabled = reduceMotion` nên khách **không thể tự bật lại**.

Đây là ứng viên số 1 nếu máy bạn đang tắt hiệu ứng động (Windows: Settings → Ease of Access → "Show animations in Windows" = Off; iOS/Android: Reduce Motion). Đúng tinh thần `prefers-reduced-motion` là **bỏ animation, không bỏ chức năng**: vẫn tự chuyển chương nhưng nhảy tức thì (`behavior: "auto"`, `scrollToCurrent` đã hỗ trợ sẵn) và luôn hiện story player.

Cách sửa: tách `reduceMotion` khỏi `simpleMode`; reduce-motion vẫn cho auto-tour với `behavior:"auto"` và hold dài hơn; luôn hiện player; bỏ `autoStory.disabled`.

## 4. 4,2 giây đầu không có gì di chuyển (P1)

Bằng chứng (kịch bản A, mốc thời gian tính từ lúc bấm):

```
+1,6s  story bắt đầu, ch=1, y=0
+4,2s  ch=2, y=855   ← lần cuộn đầu tiên thực sự thấy được
```

Nguyên nhân: `openingDurationMs: 1580` + `storyStartDelayMs: 2600`, và **chương 1 chính là `hero` đang ở y=0** (`index.html:123`) nên `scrollToCurrent()` đầu tiên không tạo chuyển động nhìn thấy được. Với khách, 4,2 giây im lặng = "không tự cuộn".

Cách sửa: hạ `storyStartDelayMs` xuống ~1200-1500ms, hoặc cho `fromStart` bắt đầu ở chương 2 (hero đã hiện sẵn, không cần "cuộn tới" nó).

## 5. Mọi khách đều thấy 2 câu "RSVP sẽ cập nhật sau" (P1)

Bằng chứng (cả 4 sự kiện): `#rsvpNote` **không ẩn** → "Link xác nhận tham dự sẽ được cập nhật sau.", cộng `#actionsDescription` → "Thông tin RSVP … sẽ được bổ sung sau…". Nút chính là `tel:` ("Liên hệ xác nhận"), `rsvp.enabled = false` ở cả 4 sự kiện (`config.js:137,197,258,319`).

Nghĩa là hiện tại thiệp đang xin lỗi khách 2 lần ở khu vực quan trọng nhất. Đề xuất RSVP inline bên dưới xử lý gọn việc này.

## 6. Comment QR trái ngược cờ dữ liệu (P3)

`config.js:61-65`: comment ghi "CẦN GIA ĐÌNH XÁC NHẬN alias VQRQAKQFO1476" nhưng `qrIdentifierVerified: true` (đã chốt ở commit `148f24d`). Comment cũ còn sót → dễ gây hiểu sai về sau. Chỉ cần cập nhật comment.

---

## Đề xuất A — Form xác nhận tham dự ngay trên thiệp, gửi vào Google Sheet

**Khuyến nghị: NÊN LÀM.** Đây là đề xuất tốt, và tốt hơn cả kế hoạch Google Form đang chờ trong repo.

Lý do (dựa trên code thật, không phải phỏng đoán):

- **Hạ tầng y hệt đã chạy thật rồi.** Sổ lời chúc đang POST tới Google Apps Script Web App (`config.js:341` → `script.google.com/.../exec`), transport là form `method="post" target="wishSubmitFrame"` + iframe ẩn + `postMessage` trả kết quả (`index.html:742,817-824`, `app.js:1637-1775`), backend `tools/wedding-wishes-webapp.gs` ghi thẳng vào Google Sheet. Nhân bản pattern này cho RSVP là việc rẻ, không cần backend, chạy được trên GitHub Pages, không vướng CORS.
- **Đã có sẵn cả chống spam để tái dùng**: honeypot (`.form-honeypot`), cooldown, `requestId`, kiểm tra `minFormOpenMs`, whitelist origin của `postMessage`.
- **Tốt hơn nhúng Google Form iframe** (`#rsvpDialog` + `#rsvpFrame` hiện đang chờ dùng): iframe nặng, không khớp thẩm mỹ thiệp, và prefill tên khách phải dựa vào entry ID (`guestNameEntry` đang rỗng ở cả 4 sự kiện) — rất dễ vỡ khi form bị sửa.

Lưu ý khi bám theo ảnh mẫu `bieumauxacnhanthamdu.PNG` — **không nên copy y nguyên**, ảnh có 3 lỗi cần sửa:

1. Hai nhóm radio (tham dự/không tham dự, và khách của chú rể/cô dâu) đứng cạnh nhau không có nhãn nhóm → phải bọc `fieldset` + `legend` để khách và screen reader hiểu đây là 2 câu hỏi khác nhau.
2. `<select>` dùng chính câu hỏi làm option placeholder → tách `<label>` riêng, option đầu để `disabled` + `required`.
3. "Số người tham dự" nên là `type="number"` với `min=1` và giới hạn trên hợp lý, tránh nhập rác.

Nên có thêm: prefill tên từ link `#to=`, preselect sự kiện từ `event=` (dữ liệu này đã có trong `guestState`/`config`), giữ nút "Liên hệ xác nhận" làm phương án dự phòng khi mạng lỗi, và cho sheet 1 cột `event` để tổng hợp theo 4 tiệc.

## Đề xuất B — Thay 1 nút bằng 2 nút "Quà mừng cưới chú rể" / "Quà mừng cưới cô dâu"

**Khuyến nghị: NÊN LÀM, nhưng cần gia đình chốt 1 điều trước.**

Điểm tốt: rõ ràng hơn, khách bớt 1 bước (hiện phải mở dialog rồi mới chọn), và đúng tập quán cưới Việt.

Vướng dữ liệu — bằng chứng đo được:

| Sự kiện | `giftIds` | Số QR hiện có |
|---|---|---|
| bride (29/07) | `["bride"]` | 1 — chỉ nhà gái |
| groom (30/07) | `["groom"]` | 1 — chỉ nhà trai |
| nhatrang (15/08) | `["groom","bride"]` | 2 |
| saigon (22/08) | `["groom","bride"]` | 2 |

Nếu đổi sang 2 nút mà không đổi dữ liệu thì **ở 2 tiệc chính chỉ hiện được 1 nút**, đúng bằng thông tin hiện tại — không sai, nhưng khác với hình mẫu của bạn. Muốn giống hình (2 nút ở mọi sự kiện) thì phải đặt `giftIds: ["groom","bride"]` cho cả `bride` và `groom` — đây là quyết định của gia đình, không phải quyết định kỹ thuật.

Hai lưu ý nữa:

- Bỏ chữ "dành cho khách ở xa" sẽ làm lời mời mừng cưới nổi hơn ở mọi trang. Nhiều gia đình cố ý giữ cách nói giảm này. Gợi ý: giữ 2 nút như hình nhưng thêm 1 dòng ghi chú nhẹ phía trên ("Dành cho Quý khách ở xa không tiện đến dự").
- Giữ nguyên dialog QR phía sau (2 nút mở dialog đã lọc đúng người) để không mất chức năng copy số tài khoản + ảnh QR + kiểm tra payload VietQR mà test đang khoá.

---

## Thứ tự thực thi đề nghị

1. Mục 1 + 2 + 3 (3 sửa nhỏ trong `app.js`, gỡ đúng nguyên nhân "không tự cuộn" và "F5 không về đầu").
2. Mục 4 (tinh chỉnh 2 con số trong `config.js`).
3. Đề xuất A (form RSVP inline + Apps Script mới, nhân bản `wedding-wishes-webapp.gs`) — kèm xoá 2 câu "sẽ cập nhật sau" ở mục 5.
4. Đề xuất B (sau khi gia đình chốt câu hỏi `giftIds`).
5. Mục 6 (sửa comment).

---

# Kết quả thực thi (26/07/2026, sau khi gia đình chốt)

Quyết định đã nhận: máy test **không** bật tiết giảm chuyển động · cả 29/07 và 30/07 hiện **cả hai** tài khoản · **bỏ** chữ "dành cho khách ở xa" · form RSVP **tối giản** theo hình mẫu · Sheet RSVP **dùng chung file** với sổ lời chúc.

## Nguyên nhân thật của "không tự cuộn" trên máy bạn

Vì máy không bật tiết giảm chuyển động, tôi đo lại ở viewport desktop 1440×900. Kết quả:

```
click chuột vào trang ở +3s  → state:"paused", pause:"interaction", ch=1, y=0  (chết hẳn)
lăn chuột 1 nhịp ở +3s       → state:"paused", ch=1
không tương tác gì           → chạy bình thường
```

Trên desktop `pointerdown` chính là click chuột. Cộng với 4,2 giây đầu không có gì di chuyển, khách gần như chắc chắn click hoặc lăn để "thử xem có chạy không" — và đúng cú đó giết tự xem.

## Đã sửa và đã kiểm chứng lại

| # | Vấn đề | Thay đổi | Đo lại sau khi sửa |
|---|---|---|---|
| 1 | F5 không về đầu | `history.scrollRestoration = "manual"` + `resetScrollForFreshLoad()` (giữ nguyên vị trí nếu hash là anchor thật) | cuộn tới 4200 → F5 → **y=0** |
| 2 | Chạm/click giết tự xem | Bỏ `pointerdown`/`touchstart` khỏi tín hiệu dừng, chỉ giữ `wheel` + `touchmove`; thêm `interactionGraceMs: 1200`; toast nói rõ cách chạy lại | click ở +3s → **chạy tiếp tới chương 4**; lăn chuột vẫn dừng đúng ý đồ |
| 3 | Reduce-motion mất tự cuộn | Tách `reduceMotion` khỏi `simpleMode`; vẫn tự chuyển chương nhưng nhảy tức thì; luôn hiện thanh điều khiển; bỏ `autoStory.disabled` | y: 0 → 844 → 1214, `playerHidden:false` |
| 4 | 4,2s đầu bất động | `storyStartDelayMs` 2600 → 1400 | chương 2 ở **3,0s** thay vì 4,5s |
| 5 | Hai câu "sẽ cập nhật sau" | Khi form inline bật, `#rsvpNote` ẩn và mô tả đổi thành lời mời điền form | `rsvpNoteHidden: true` |
| 6 | Comment QR mâu thuẫn | Cập nhật theo trạng thái đã chốt | — |

## Đề xuất A — form RSVP inline (đã dựng xong, chờ bạn deploy)

- `index.html`: form ngay trong khu "Xác nhận tham dự" — Họ tên (tự điền từ link `#to=`), Có/Không tham dự, Số người, Khách của chú rể/cô dâu, Sự kiện (chỉ liệt kê sự kiện khách được mời, chọn sẵn sự kiện đang xem), Lời nhắn. Đúng 6 trường như hình mẫu, không thêm gì.
- Ba lỗi của ảnh mẫu đã sửa: hai nhóm chọn một có `fieldset`/`legend` riêng; bỏ option placeholder trùng nhãn; số người là `type="number"` có `min`/`max`.
- Chọn "không tham dự" thì ô số người tự ẩn và ghi 0.
- Đường truyền: POST vào iframe ẩn → Apps Script → `postMessage` trả kết quả. Thiệp **chỉ** báo thành công khi Sheet đã ghi thật.
- Backend: `tools/wedding-rsvp-webapp.gs` thêm vào **đúng project Apps Script của sổ lời chúc**, ghi sang tab `Xác nhận tham dự` trong **cùng file Sheet**. `doPost` ở file lời chúc định tuyến khi `form=rsvp`, nên URL `/exec` không đổi và sổ lời chúc không gián đoạn.
- Chống spam: honeypot, `minFormOpenMs`, cooldown 60s, `LockService` + cửa sổ chống trùng 300s (bấm gửi hai lần chỉ ghi một dòng).
- **Trạng thái: `rsvpForm.apiUrl` đang để trống nên form tự ẩn**, thiệp giữ nguyên nút "Liên hệ xác nhận". Không thể tự tạo URL `/exec` thay bạn. Các bước ở `RSVP-FORM-SETUP.md`.

Đã đo với URL giả lập: form hiện đúng, tên tự điền "Gia đình cô Lan", select chỉ có 2 sự kiện được mời và chọn sẵn `bride`, submit rỗng bị chặn và **không** phát POST, submit hợp lệ POST đủ trường sang `/exec`.

## Đề xuất B — hai nút quà mừng cưới (xong)

- `giftIds` cả bốn sự kiện thành `["groom","bride"]` theo quyết định của gia đình.
- Hai nút "Quà mừng cưới chú rể" / "Quà mừng cưới cô dâu" có icon quà, dựng từ config.
- Bỏ hoàn toàn chữ "dành cho khách ở xa" (nút, tiêu đề hộp thoại, kicker, dòng mô tả).
- Hộp thoại lọc đúng bên được bấm; QR vẫn lazy-load, mỗi nút chỉ tải 1 ảnh.

## Kiểm thử

`npm test` — 20/20 PASS (gồm dựng `dist` và ba bộ browser test).

Ba test khoá hành vi cũ đã được cập nhật **có chủ đích**, không phải nới lỏng:

- `audio_story_regression_check.mjs`: bỏ khoá cứng `storyStartDelayMs: 2600` (chính là con số gây lỗi), thay bằng ràng buộc ≤1600ms, cộng thêm 6 assertion mới khoá các bản sửa #1–#3.
- `multi_event_check.mjs`: kỳ vọng cũ "mỗi tiệc chính 1 tài khoản" đã bị chính gia đình đảo, cập nhật thành 2 tài khoản ở mọi sự kiện.
- `browser_smoke.mjs`: chuyển từ `#giftButton` sang hai nút, thêm kiểm tra mỗi nút chỉ tải đúng QR của bên đó.

Thêm mới: `tests/rsvp_form_check.mjs` khoá hợp đồng form RSVP (đã nối vào `npm test`).

## Việc còn lại của bạn

1. Làm theo `RSVP-FORM-SETUP.md` để lấy URL `/exec`, dán vào `config.js` → `rsvpForm.apiUrl`. Trước bước này form vẫn ẩn.
2. Gửi thử một xác nhận và kiểm tra tab `Xác nhận tham dự` trong Sheet.

## Vòng chốt cuối (2 câu hỏi còn mở đã được trả lời)

### 1. Hạn xác nhận — chốt lại: 23:59 **một ngày** trước mỗi sự kiện

| Sự kiện | Ngày tổ chức | `rsvpClosesAt` | Hiển thị cho khách |
|---|---|---|---|
| Nhà gái | 29/07/2026 | 28/07/2026 23:59 | 28/07/2026 |
| Nhà trai | 30/07/2026 | 29/07/2026 23:59 | 29/07/2026 |
| Nha Trang | 15/08/2026 | 14/08/2026 23:59 | 14/08/2026 |
| Sài Gòn | 22/08/2026 | 21/08/2026 23:59 | 21/08/2026 |

**Kèm theo phát hiện: bật `rsvpClosesAt` sẽ kích hoạt một lỗi tiềm ẩn.** Nhánh `now >= rsvpClosesAt` từ trước tới nay chưa từng chạy vì cả bốn sự kiện đều để trống. Trong nhánh đó, `rsvpButton.hidden = true` ẩn luôn nút gọi — trong khi chính thông điệp đóng cổng lại bảo khách "vui lòng liên hệ trực tiếp cô dâu hoặc chú rể". Bảo khách gọi rồi cất mất chỗ để gọi.

Đã sửa theo đúng ý định gốc: chỉ ẩn nút khi nó trỏ tới Google Form đã đóng (`dataset.rsvpFallback !== "contact"`); khi nút là số điện thoại dự phòng thì giữ lại. Dòng hạn cũng tự ẩn sau hạn.

Đo bằng `__WEDDING_TEST_NOW__`: trước hạn → form hiện + dòng hạn hiện + nút gọi hiện; sau hạn → form ẩn + dòng hạn ẩn + thông điệp đóng cổng hiện + **nút gọi vẫn hiện**.

### 2. Dòng ghi chú trên hai nút quà mừng — đã thêm

> *Sự hiện diện của Quý khách đã là món quà quý giá nhất với hai gia đình.*

Đặt sự hiện diện lên trước nên lời mời mừng cưới không còn đứng trần, mà vẫn không quay lại cách nói "dành cho khách ở xa" bạn đã bỏ. Sửa ở `config.js` → `site.giftNote`; để trống thì dòng này tự ẩn.

### Kiểm thử vòng cuối

`npm test` — 20/20 PASS. Một test nữa được cập nhật có chủ đích: `browser_smoke.mjs` khoá `deadline === ""` ("chưa chốt"), nay đổi thành `"28/07/2026"` đúng theo quyết định vừa rồi.

### Nối endpoint thật (26/07/2026)

URL bạn đưa **trùng đúng URL sổ lời chúc** — đúng thiết kế, vì RSVP là một module trong chính project Apps Script đó, dùng chung một deployment và một Sheet. Nhưng trùng URL cũng có nghĩa nó chưa tự chứng minh được module đã được thêm và deploy version mới, nên tôi dò thẳng endpoint bằng hai request **không ghi dữ liệu**:

| Probe | Kết quả | Kết luận |
|---|---|---|
| honeypot có dữ liệu | `wedding-rsvp-result-v1` · `SPAM_GUARD` | routing `form=rsvp` đã sống trên production |
| thiếu họ tên | `wedding-rsvp-result-v1` · `INVALID_NAME` | chuỗi validation đúng là code mới |

Cả hai đều dừng trước bước ghi Sheet nên không tạo dòng rác. Đã đặt `rsvpForm.apiUrl` và dựng lại `dist` (2 lần xuất hiện URL trong `dist/config.js`).

Kiểm tra giao diện với cấu hình production (chặn mọi request ra Apps Script): form hiện, tên tự điền "Anh Minh", dòng hạn "trước 29/07/2026", `#rsvpNote` ẩn, khách một sự kiện thì ô chọn sự kiện tự ẩn (vẫn gửi kèm `eventId`), không có lỗi console.

**Lưu ý quan trọng khi bạn thử thật:** Apps Script gửi kết quả về đúng `siteOrigin = https://xuan2261.github.io`. Nếu mở bằng `file://` hoặc `localhost`, dòng vẫn được ghi vào Sheet nhưng thiệp không nhận được phản hồi và sẽ báo hết thời gian chờ — đó là giới hạn môi trường thử, không phải lỗi. Hãy thử trên chính domain đã deploy.

### Việc còn lại của bạn


Chỉ còn một việc tôi không làm thay được: sau khi deploy, gửi thử **một** xác nhận thật trên `https://xuan2261.github.io/...`, kiểm tra tab `Xác nhận tham dự` trong Sheet có đúng một dòng, rồi xoá dòng thử đó.

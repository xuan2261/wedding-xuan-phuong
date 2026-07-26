# Debug & Audit toàn diện — v20.1-20260726

Ngày: 2026-07-26 · Nhánh: `claude/debug-audit-comprehensive-kzchzy`

> **Trạng thái cuối:** 12/12 nhóm kiểm tra đã hoàn tất và qua vòng phản biện
> đối kháng (81 phát hiện được xác nhận trên 129 báo cáo — 48 bị bác bỏ).
> Toàn bộ lỗi nêu ở mục 2 và phần lớn mục 3 đã được sửa và kiểm chứng lại bằng
> Chromium. `npm test` hiện xanh hoàn toàn (exit 0).

Phạm vi: toàn bộ mã nguồn (`index.html`, `app.js`, `config.js`, `guest-utils.js`,
`styles.css`), pipeline build `dist/`, bộ test, GitHub Actions, tài liệu và tài sản.

---

## 1. Hiện trạng cơ sở

| Hạng mục | Kết quả |
|---|---|
| 17 bộ test trong `npm test` | **PASS** toàn bộ |
| `dist/` đã commit vs build mới | **Trùng khớp tuyệt đối** (không drift) |
| 22 đường dẫn asset được tham chiếu | **Tồn tại đủ**, không có 404 tiềm ẩn |
| Ngày/thứ của cả 4 sự kiện | **Chính xác** (đã đối chiếu lịch thực tế +07:00) |
| Sink XSS (`innerHTML`/`eval`/`document.write`) | **Không có** trong toàn bộ mã |

Hai điểm môi trường (không phải lỗi sản phẩm):

- `package.json` ghim `playwright@1.62.0` cần Chromium build `1234`, môi trường
  chỉ có `1194` → hai bộ test browser crash khi khởi động cho tới khi alias binary.
- Repo **không có `.gitignore`** — đây là nguyên nhân của 7 commit
  `chore: remove accidental temporary file` và 4 commit `tmp` trong lịch sử.
  Đã sửa trong nhánh này.

---

## 2. Lỗi đã được xác minh trực tiếp

### 2.1 [NGHIÊM TRỌNG] Nút chuyển sự kiện không đổi nội dung

`app.js:211` · `guest-utils.js:57` (`buildInvitationUrl`)

`setupEventSwitcher()` tạo thẻ `<a>` với `href` sinh từ
`buildInvitationUrl(config.site.domain, …)`. Hàm này **chỉ đặt `url.hash`**, giữ
nguyên origin và path. Mà `config.site.domain` chính là URL production
(`https://xuan2261.github.io/wedding-xuan-phuong/`).

Trên production, href chỉ khác URL hiện tại ở **fragment** → trình duyệt coi là
điều hướng cùng tài liệu, không tải lại trang. Trong khi đó `app.js`
**không hề có listener `hashchange` hay `popstate`** (đã grep toàn file, không có
kết quả). Hệ quả: URL đổi, nội dung đứng yên.

Bằng chứng runtime (đường đi thật của khách, không có query string):

```
BEFORE  hash=…event=bride   tab="Nhà gái · 29/07"  ngày=29.07.2026  nơi="Tư gia nhà gái"
click   href=…event=groom
AFTER   hash=…event=groom   tab="Nhà gái · 29/07"  ngày=29.07.2026  nơi="Tư gia nhà gái"
reloaded? NO — same document
```

Khách bấm **"Nhà trai · 30/07"** nhưng vẫn thấy **29.07.2026 tại nhà gái**.
Nếu sau đó họ tải lại trang thì nội dung mới nhảy sang nhà trai. Đây đúng là loại
lỗi khiến khách **đi sai ngày**.

*Ghi chú:* từ các trang chia sẻ `/events/<id>/` thì href trỏ sang document khác
nên vẫn hoạt động — lỗi chỉ xảy ra khi khách đã ở trang chính.

**Hướng sửa:** thêm listener `hashchange` gọi lại pipeline áp dụng cấu hình, hoặc
cho `href` trỏ tới `events/<id>/` để buộc điều hướng khác tài liệu.

### 2.2 [CAO] CTA hero và skip-link xóa sạch dữ liệu cá nhân hóa

`index.html:151` — `<a id="openInvitationButton" href="#guest-invitation">`
`index.html:52` — `<a class="skip-link" href="#main">`

`readGuestName()` và `readEventContext()` (`guest-utils.js:12,23`) đọc tên khách
và sự kiện **từ fragment**. Bấm hai link trên sẽ thay toàn bộ fragment thành
`#guest-invitation` / `#main`, xóa mất `to=`, `event=`, `events=`.

Sau đó chỉ cần khách tải lại trang (hoặc chia sẻ lại URL đó) là:

- tên khách rơi về `Quý khách`;
- sự kiện rơi về mặc định `groom` — kể cả khi khách được mời dự nhà gái.

**Hướng sửa:** dùng `scrollIntoView()` qua JS và `preventDefault()`, hoặc ghi lại
fragment cá nhân hóa sau khi cuộn.

### 2.3 [CAO] Hai workflow ghim sai build id → giám sát production hỏng

`.github/workflows/verify-pages.yml:122` · `.github/workflows/pages-live-watch.yml:40,56`

Cả hai đều ghim `EXPECTED_BUILD: v19.4-20260724`, trong khi build hiện tại là
`v20.1-20260726` (`BUILD.json`, `config.js`, `index.html`, `dist/release.json`).

Logic bị **đảo ngược**: bước kiểm tra hậu-deploy chỉ "PASS" khi trang public vẫn
còn **cũ**, và sẽ chuyển đỏ đúng lúc v20.1 lên sóng thật.

Đã xác nhận bằng CI thật — *Verify live GitHub Pages* trên `main` **thất bại** hai
lần hôm nay (10:55Z và 11:02Z). Watchdog chạy mỗi giờ này vì thế không còn phân
biệt được "site hỏng" với "build id đã đổi", và không bao giờ đóng được issue #10.

*Đính chính một nghi vấn:* các phiên bản action (`actions/checkout@v7`,
`setup-node@v7`, `upload-artifact@v7`) **đều hợp lệ** — job deploy đã chạy thành
công lúc 11:02Z. Không cần sửa.

### 2.4 [CAO] Ảnh social của 4 trang chia sẻ vẫn là bản cũ

`tools/build-dist.py:14` — `META_IMAGE = …/assets/images/meta-v3.jpg`

`index.html` quảng bá `meta-v4.jpg`, còn cả 4 trang `dist/events/*/index.html`
quảng bá `meta-v3.jpg`. Link cá nhân hóa gửi cho khách đi **qua trang chia sẻ**,
nên preview trên Zalo/Messenger/Facebook hiện **ảnh cũ**.

### 2.5 [CAO] Test khóa chặt chính lỗi 2.4

`tests/share_entry_pages_check.py:37` — `"OG image": "assets/images/meta-v3.jpg" in html`

Test này khẳng định giá trị **sai**. Nó pass trên output lỗi, và sẽ **fail ngay
khi lỗi được sửa** — đúng nghĩa test tạo niềm tin giả.

### 2.6 [TRUNG BÌNH] Metadata phiên bản mâu thuẫn 3 nơi

| Nguồn | Giá trị |
|---|---|
| `BUILD.json`, `config.js`, `index.html`, `dist/release.json` | `v20.1-20260726` |
| `package.json` | `19.4.0` |
| `README.md` | `v19.4-20260724` |
| `CHANGELOG.md` (mục đầu) | `v19.4` — **không có mục nào cho v20.0/v20.1** |

---

## 3. Phát hiện từ 6 nhóm kiểm tra tự động

Chưa qua vòng phản biện đối kháng — cần xác minh trước khi sửa.

**`app.js`**
- `app.js:801` — chỉ số chương tăng *trước* khi `await` preload ảnh → một lần bấm
  Next có thể nhảy 2 chương.
- `app.js:1156` — countdown về 0 khi phase vẫn là `before` sinh vòng lặp
  `setTimeout`/`setInterval` không giới hạn.
- `app.js:1704` — hai handler click cùng gắn vào `#rsvpButton` → mở 2 dialog khi
  `rsvp.url` có giá trị nhưng `rsvp.enabled` false.
- `app.js:705` — `syncPlayer()` bỏ ẩn story player vô điều kiện, sống lại với
  người dùng `prefers-reduced-motion`.

**Giao diện / CSS**
- `styles.css:1015` — quy tắc `footer {}` toàn cục tràn vào dialog liên hệ, khiến
  nút "Đóng" còn **1.53:1** tương phản (gần như vô hình) — `index.html:622`.
- `styles.css:2243` — bìa thiệp bị cắt mất dòng trên ở mọi máy ngang, không cuộn tới được.
- `styles.css:1751` — dialog bản đồ/RSVP sập bố cục ở chế độ ngang.
- `styles.css:1171` — toast xác nhận copy không thể hiện trên modal dialog.
- `styles.css:2313` — 4 biến `var()` trỏ tới custom property chưa từng được định nghĩa.

**Dữ liệu / lịch**
- `config.js:57` — QR nhà trai mã hóa định danh thanh toán **khác** số tài khoản
  hiển thị cho khách. *(Cần kiểm chứng thủ công — ảnh hưởng tiền mừng.)*
- `app.js:494` — cờ `mapsVerified` không bao giờ được đọc; sự kiện nhà gái vẫn
  phát link chỉ đường mà chính config khai là chưa xác minh.
- Cả 4 file `.ics`: kết thúc dòng LF thay vì CRLF, **thiếu `DTEND`** (sự kiện dài
  0 phút), có `TZID` nhưng không kèm `VTIMEZONE`.
- `index.html:47` — `guest-utils.js?v=1.0` chưa bump cache qua 2 lần đổi API, trong
  khi `app.js`/`config.js` đã lên `?v=5.6`. Bản cache cũ sẽ làm `app.js` ném lỗi.

**Truy cập được (a11y)** — `index.html`: landmark `banner`/`contentinfo` trùng
trong dialog; lightbox không thông báo ảnh đổi; `#main` thiếu `tabindex="-1"`.

---

## 4. Còn lại chưa sửa

Đã xác nhận nhưng **chưa** sửa trong đợt này — phần lớn cần bạn quyết định hoặc
cung cấp dữ liệu thật:

- **QR nhà trai lệch số tài khoản** — *đã xử lý phần làm được, còn chờ xác nhận.*
  Ảnh **không bị sửa**: `VQRQAKQFO1476` đúng định dạng alias VietQR của MB Bank
  nên nhiều khả năng là mã thật; dựng lại QR theo số đang hiển thị có thể làm
  hỏng đường chuyển tiền thật. Thay vào đó đã khai báo `bankBin` +
  `qrAccountIdentifier` trong `config.js`, sửa `assets/qr/README.md` (trước đó
  ghi sai sự thật), và siết `tests/verify_assets.py` để đối chiếu payload EMVCo
  với cấu hình. **Gia đình cần kiểm tra trong app MB Bank** xem alias
  `VQRQAKQFO1476` có trỏ về `0374037026` không, rồi đặt
  `qrIdentifierVerified: true` hoặc tạo lại QR.
- **`.ics`** — *đã sửa.* Bổ sung `DTEND`, `VTIMEZONE` cho `Asia/Ho_Chi_Minh`,
  ghi CRLF và gấp dòng theo RFC 5545. Giờ kết thúc thật vẫn chưa được cung cấp
  nên dùng tạm mốc cuối timeline + 2 giờ, đánh dấu `calendarEndIsProvisional`
  trong `tools/wedding-data.json` để sửa một chỗ khi chốt.
- **Công cụ tạo link khách** (`tools/create-guest-links.html`): CSV có dấu ngoặc
  chưa đóng nuốt mất các dòng sau; sửa tay trong textarea âm thầm huỷ CSV vừa
  nhập; CSV không phải UTF-8 sinh tên khách lỗi font.
- **Web app lời chúc** (`tools/wedding-wishes-webapp.gs`): chống spam hoàn toàn
  nằm ở phía client nên bỏ qua được.
- **Tài liệu lệch thực tế**: `CALENDAR-SETUP.md` trỏ tới file `.ics` không tồn
  tại, `RSVP-MAP-MOTION-SETUP.md` trỏ script đã đổi chỗ, `check-live-build`
  vẫn ghim v19.4, `MULTI-EVENT-SETUP.md` hướng dẫn các bước làm hỏng CI.
- **CI**: workflow chạy trên pull request dùng chung concurrency group với
  deploy; job thực thi mã từ PR vẫn được cấp `pages: write` và `id-token: write`.
- **Chất lượng test**: `contract_check.js` là phép lặp thừa tự đúng,
  `lifecycle_check.js` khớp cả giá trị rỗng, `npm test` bỏ sót 2 test.
- Hai khối media query cho máy nhỏ bị đè hoàn toàn (`styles.css`) — cần ý đồ
  thiết kế mới sửa đúng, không đoán được.

---

## 5. Đề xuất thứ tự xử lý

1. **2.1** — khách đi sai ngày. Nặng nhất.
2. **2.2** — mất cá nhân hóa và sai sự kiện sau khi tải lại.
3. **2.3** — bỏ ghim build id, đọc từ `BUILD.json` để giám sát hoạt động trở lại.
4. **2.4 + 2.5** — sửa `META_IMAGE` và sửa luôn test đang khóa lỗi.
5. **2.6** — đồng bộ phiên bản, bổ sung mục CHANGELOG cho v20.x.

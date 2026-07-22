# Test report — Wedding Xuân & Phượng v7

## Static

- app.js syntax: PASS
- config.js syntax: PASS
- create-google-forms-rsvp.gs syntax: PASS
- update-google-forms-rsvp-contact.gs syntax: PASS
- config runtime parse: PASS
- duplicate HTML IDs: 0
- missing local references: 0
- image accessibility issues: 0
- CSS parse errors: 0

## Browser smoke

| Kịch bản | Mobile 390×844 | Desktop 1440×900 |
|---|---:|---:|
| Tràn ngang | Không | Không |
| Gift placeholder bị ẩn | PASS | PASS |
| RSVP đúng URL | PASS | PASS |
| Mở thiệp phát nhạc | PASS | PASS |
| Pause đổi icon | PASS | PASS |
| Resume đổi icon | PASS | PASS |
| Lightbox mở/đóng | PASS | PASS |
| Console error | 0 | 0 |

## Không được tuyên bố PASS

- Lighthouse production
- Real Google Fonts network loading trong sandbox
- Safari iOS thật
- Chrome Android thật
- Nội dung tài khoản/QR thật
- Quyền sử dụng file nhạc

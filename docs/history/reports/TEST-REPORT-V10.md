# Test report — Sổ lời chúc v10

## Static

- app.js/config.js: PASS
- Ba Google Apps Script: PASS
- HTML unique IDs: PASS
- CSS parse: PASS
- Local assets: PASS
- CSP allowlist: PASS
- Không dùng innerHTML: PASS
- Backend approved-only, pending default: PASS
- Lock/Cache/formula guard/callback validation: PASS

## Browser smoke

```json
[
  {
    "viewport": [
      360,
      800
    ],
    "horizontal_overflow": false,
    "initial_cards": 6,
    "after_load_more": 7,
    "submit_success": true,
    "gift_placeholder_hidden": true
  },
  {
    "viewport": [
      390,
      844
    ],
    "horizontal_overflow": false,
    "initial_cards": 6,
    "after_load_more": 7,
    "submit_success": true,
    "gift_placeholder_hidden": true
  },
  {
    "viewport": [
      430,
      932
    ],
    "horizontal_overflow": false,
    "initial_cards": 6,
    "after_load_more": 7,
    "submit_success": true,
    "gift_placeholder_hidden": true
  },
  {
    "viewport": [
      768,
      1024
    ],
    "horizontal_overflow": false,
    "initial_cards": 6,
    "after_load_more": 7,
    "submit_success": true,
    "gift_placeholder_hidden": true
  },
  {
    "viewport": [
      1440,
      900
    ],
    "horizontal_overflow": false,
    "initial_cards": 6,
    "after_load_more": 7,
    "submit_success": true,
    "gift_placeholder_hidden": true
  }
]
```

## Đã kiểm tra

- JSONP tải approved wishes.
- Render 6 card đầu và Xem thêm card thứ 7.
- Gift placeholder tiếp tục bị ẩn.
- Dialog, label, counter, consent.
- POST iframe và postMessage success.
- Không tràn ngang ở 5 viewport.

## Chưa xác minh

- Deployment Apps Script thật.
- Google Sheet và installable trigger thật.
- Apps Script quotas thực tế.
- iOS Safari và Android Chrome vật lý.

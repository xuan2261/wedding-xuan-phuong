# Root cause — lỗi timeout gửi lời chúc v13

## Triệu chứng

Frontend chờ `message` tối đa `requestTimeoutMs`, nhưng không nhận được nên hiển thị:

> Chưa nhận được phản hồi từ máy chủ. Vui lòng kiểm tra kết nối và thử lại.

Console:

```text
Failed to execute 'postMessage' on 'DOMWindow':
The target origin provided ('https://xuan2261.github.io')
does not match the recipient window's origin
('https://...-script.googleusercontent.com').
```

## Root cause 1 — sai cửa sổ nhận

Backend dùng:

```javascript
window.parent.postMessage(...)
```

Apps Script HtmlService chạy trong IFRAME sandbox. Response có thêm iframe/wrapper
Google, nên `window.parent` trỏ tới window Google trung gian. Target origin lại là
GitHub Pages, vì vậy trình duyệt từ chối gửi.

Fix:

```javascript
window.top.postMessage(...)
```

`window.top` trỏ tới trang thiệp GitHub Pages ở tầng cao nhất.

## Root cause 2 — allowlist không khớp hostname thật

Frontend chỉ chấp nhận:

```text
https://script.googleusercontent.com
```

Nhưng origin thực tế có dạng:

```text
https://n-...-script.googleusercontent.com
```

Fix dùng parser URL và chỉ chấp nhận HTTPS với:

- `script.google.com`
- `script.googleusercontent.com`
- hostname kết thúc bằng `-script.googleusercontent.com`

Không dùng wildcard `*` trong `postMessage`.

## Không liên quan

Thông báo Edge:

```text
[Intervention] Images loaded lazily and replaced with placeholders
```

chỉ là thông báo tối ưu lazy image; không gây lỗi gửi lời chúc.

# Áp dụng bản cách xưng hô v9

## Website

Ghi đè:

```text
config.js
index.html
```

## Google Forms tools

Ghi đè:

```text
tools/create-google-forms-rsvp.gs
tools/update-google-forms-rsvp-contact.gs
```

Sau đó mở Apps Script và chạy:

```javascript
updateWeddingRsvpContactInfo()
```

Hàm cập nhật Form hiện có mà không xóa phản hồi cũ.

## GitHub

```powershell
git add config.js index.html tools
git commit -m "Use age-neutral wedding invitation wording"
git push
```

Không xóa `assets/audio/music.mp3`.

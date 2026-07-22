# Áp dụng Lazy Wishes v12 an toàn

Patch này không chứa `config.js`, tránh làm mất URL Apps Script hoặc tắt sổ lời chúc đang chạy.

Ghi đè/thêm các file, sau đó:

```powershell
git add app.js index.html styles.css tools/wedding-wishes-webapp.gs reports CONFIG-MERGE-V12.md
git commit -m "Lazy load approved wedding wishes"
git push
```

Không xóa `assets/audio/music.mp3`.

Nếu đã deploy Apps Script, cập nhật deployment để nhận cache backend 300 giây.

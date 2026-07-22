# Áp dụng patch hero v8

Ghi đè ba file:

```text
index.html
styles.css
app.js
```

Không xóa file nhạc:

```text
assets/audio/music.mp3
```

PowerShell:

```powershell
Set-Location -LiteralPath 'C:\DUONG_DAN\wedding-xuan-phuong'

Copy-Item 'C:\DUONG_DAN_PATCH\index.html' . -Force
Copy-Item 'C:\DUONG_DAN_PATCH\styles.css' . -Force
Copy-Item 'C:\DUONG_DAN_PATCH\app.js' . -Force

git add index.html styles.css app.js
git commit -m "Improve hero name layout and invitation typography"
git push
```

Sau khi GitHub Pages deploy, mở cửa sổ ẩn danh và nhấn Ctrl+F5.

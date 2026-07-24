param(
  [string]$Url = "https://docs.google.com/forms/d/e/1FAIpQLSdWjs5UUj2uHvNcDDpTYBWoiTZP6maOukXgVpoSq2bFh-pVew/viewform"
)

$ErrorActionPreference = "Stop"
$content = (Invoke-WebRequest -UseBasicParsing -Uri $Url).Content
$expected = @(
  "Thời gian đón khách: 10h00",
  "Thời gian làm lễ: 08h30",
  "Địa điểm: Tư gia nhà trai",
  "346 Nguyễn Huệ",
  "28/07/2026"
)
$missing = @($expected | Where-Object { $content -notmatch [regex]::Escape($_) })
if ($missing.Count -gt 0) {
  Write-Error ("FAIL: Google Form live còn thiếu/sai: " + ($missing -join "; "))
  exit 1
}
Write-Host "PASS: Google Form live đã đồng bộ thông tin v18.1" -ForegroundColor Green

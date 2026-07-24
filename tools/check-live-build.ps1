param(
  [string]$Url = "https://xuan2261.github.io/wedding-xuan-phuong/",
  [string]$ExpectedBuild = "v19.4-20260724"
)

$ErrorActionPreference = "Stop"
$base = $Url.TrimEnd('/') + '/'
$headers = @{ "Cache-Control" = "no-cache"; "Pragma" = "no-cache" }

$response = Invoke-WebRequest -Uri ($base + "?build=" + $ExpectedBuild) -UseBasicParsing -Headers $headers
$pattern = '<meta\s+name=["'']wedding-build["'']\s+content=["'']([^"'']+)["'']'
$match = [regex]::Match($response.Content, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
if (-not $match.Success) { throw "Không tìm thấy wedding-build marker trên trang live." }
$actual = $match.Groups[1].Value
Write-Host "Live build: $actual"
if ($actual -ne $ExpectedBuild) { throw "Sai build. Mong đợi $ExpectedBuild nhưng live là $actual." }

$release = Invoke-RestMethod -Uri ($base + "release.json?build=" + $ExpectedBuild) -Headers $headers
if ($release.buildId -ne $ExpectedBuild) { throw "release.json sai build: $($release.buildId)" }

foreach ($eventId in @("bride", "groom", "nhatrang", "saigon")) {
  $eventPage = Invoke-WebRequest -Uri ($base + "events/$eventId/?build=" + $ExpectedBuild) -UseBasicParsing -Headers $headers
  if ($eventPage.Content -notmatch [regex]::Escape("data-event-id=`"$eventId`"")) {
    throw "Trang chia sẻ sự kiện $eventId không hợp lệ."
  }
  if ($eventPage.Content -notmatch [regex]::Escape($ExpectedBuild)) {
    throw "Trang chia sẻ sự kiện $eventId chưa đúng build."
  }
}

Write-Host "PASS: GitHub Pages đang chạy đúng $ExpectedBuild và đủ 4 trang chia sẻ sự kiện."

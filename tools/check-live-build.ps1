param(
  [string]$Url = "https://xuan2261.github.io/wedding-xuan-phuong/",
  [string]$ExpectedBuild = "v18-20260722"
)

$ErrorActionPreference = "Stop"
$response = Invoke-WebRequest -Uri $Url -UseBasicParsing -Headers @{ "Cache-Control" = "no-cache" }
$pattern = '<meta\s+name=["'']wedding-build["'']\s+content=["'']([^"'']+)["'']'
$match = [regex]::Match($response.Content, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

if (-not $match.Success) {
  throw "Không tìm thấy wedding-build marker trên trang live."
}

$actual = $match.Groups[1].Value
Write-Host "Live build: $actual"

if ($actual -ne $ExpectedBuild) {
  throw "Sai build. Mong đợi $ExpectedBuild nhưng live là $actual."
}

Write-Host "PASS: GitHub Pages đang chạy đúng build $ExpectedBuild."

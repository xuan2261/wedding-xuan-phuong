[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$ZipPath = "$HOME\Downloads\wedding-image-pack-v20-q72.zip",

    [Parameter(Mandatory = $false)]
    [string]$RepoDir = "$HOME\Downloads\wedding-xuan-phuong",

    [Parameter(Mandatory = $false)]
    [switch]$KeepBranches,

    [Parameter(Mandatory = $false)]
    [switch]$NoMerge
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$Repository = 'xuan2261/wedding-xuan-phuong'
$ImageBranch = 'images/refresh-photoshop-v20'
$PullRequest = 13
$ExpectedSha256 = 'afca17358afe24cd9f199a68da4332cc2cef42520fede19ccbea294dcb7387c0'
$ExpectedBytes = 1241783
$PublicBaseUrl = 'https://xuan2261.github.io/wedding-xuan-phuong/'

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Invoke-Native {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments
    )

    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed ($LASTEXITCODE): $FilePath $($Arguments -join ' ')"
    }
}

function Get-GhRuns {
    param([string]$Branch)

    $json = & gh run list `
        --repo $Repository `
        --branch $Branch `
        --limit 30 `
        --json databaseId,name,headSha,status,conclusion,createdAt 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($json)) {
        return @()
    }
    return @($json | ConvertFrom-Json)
}

function Wait-GhRun {
    param(
        [Parameter(Mandatory = $true)][string]$Branch,
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][datetime]$NotBefore,
        [int]$AppearTimeoutSeconds = 180,
        [int]$CompleteTimeoutSeconds = 2400
    )

    $deadline = (Get-Date).AddSeconds($AppearTimeoutSeconds)
    $run = $null
    do {
        $run = Get-GhRuns -Branch $Branch |
            Where-Object {
                $_.name -eq $Name -and
                ([datetime]$_.createdAt).ToUniversalTime() -ge $NotBefore.ToUniversalTime().AddMinutes(-1)
            } |
            Sort-Object { [datetime]$_.createdAt } -Descending |
            Select-Object -First 1

        if ($null -eq $run) {
            Start-Sleep -Seconds 5
        }
    } while ($null -eq $run -and (Get-Date) -lt $deadline)

    if ($null -eq $run) {
        throw "Timed out waiting for workflow '$Name' on '$Branch'."
    }

    Write-Host "Watching workflow '$Name' (run $($run.databaseId))..."
    $watch = Start-Job -ScriptBlock {
        param($Repo, $RunId)
        gh run watch $RunId --repo $Repo --exit-status
        exit $LASTEXITCODE
    } -ArgumentList $Repository, ([string]$run.databaseId)

    if (-not (Wait-Job -Job $watch -Timeout $CompleteTimeoutSeconds)) {
        Stop-Job -Job $watch -ErrorAction SilentlyContinue
        Remove-Job -Job $watch -Force -ErrorAction SilentlyContinue
        throw "Timed out waiting for workflow '$Name' to complete."
    }

    Receive-Job -Job $watch
    $exitCode = $watch.ChildJobs[0].JobStateInfo.Reason
    $state = $watch.State
    Remove-Job -Job $watch -Force

    $completed = Get-GhRuns -Branch $Branch |
        Where-Object { $_.databaseId -eq $run.databaseId } |
        Select-Object -First 1
    if ($null -eq $completed -or $completed.conclusion -ne 'success') {
        throw "Workflow '$Name' did not succeed. State=$state Conclusion=$($completed.conclusion)"
    }
    return $completed
}

function Wait-PrChecks {
    param([int]$TimeoutSeconds = 2400)

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        $json = & gh pr checks $PullRequest --repo $Repository --json name,state,link 2>$null
        if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($json)) {
            $checks = @($json | ConvertFrom-Json)
            $failed = @($checks | Where-Object { $_.state -in @('FAILURE', 'ERROR', 'CANCELLED', 'TIMED_OUT') })
            if ($failed.Count -gt 0) {
                $names = $failed.name -join ', '
                throw "PR checks failed: $names"
            }
            $pending = @($checks | Where-Object { $_.state -notin @('SUCCESS', 'SKIPPED', 'NEUTRAL') })
            if ($checks.Count -gt 0 -and $pending.Count -eq 0) {
                return $checks
            }
        }
        Start-Sleep -Seconds 10
    } while ((Get-Date) -lt $deadline)

    throw 'Timed out waiting for all PR checks.'
}

Write-Step 'Validate required tools'
foreach ($tool in @('git', 'gh')) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        throw "Missing required command '$tool'. Install Git for Windows and GitHub CLI, then rerun this script."
    }
}
Invoke-Native gh auth status

Write-Step 'Validate the exact q72 image package'
$resolvedZip = (Resolve-Path -LiteralPath $ZipPath).Path
$item = Get-Item -LiteralPath $resolvedZip
if ($item.Length -ne $ExpectedBytes) {
    throw "Wrong package size: observed=$($item.Length), expected=$ExpectedBytes bytes."
}
$observedSha = (Get-FileHash -LiteralPath $resolvedZip -Algorithm SHA256).Hash.ToLowerInvariant()
if ($observedSha -ne $ExpectedSha256) {
    throw "Wrong package SHA-256: observed=$observedSha, expected=$ExpectedSha256"
}
Write-Host "PASS package SHA-256: $observedSha" -ForegroundColor Green

Write-Step 'Clone or refresh the repository'
if (-not (Test-Path -LiteralPath (Join-Path $RepoDir '.git'))) {
    $parent = Split-Path -Parent $RepoDir
    if ($parent) {
        New-Item -ItemType Directory -Force -Path $parent | Out-Null
    }
    Invoke-Native git clone "https://github.com/$Repository.git" $RepoDir
}

Invoke-Native git -C $RepoDir fetch --prune origin
Invoke-Native git -C $RepoDir switch -C $ImageBranch "origin/$ImageBranch"

$dirty = & git -C $RepoDir status --porcelain
if (-not [string]::IsNullOrWhiteSpace(($dirty -join "`n"))) {
    throw "Repository has local changes. Clean them before continuing:`n$($dirty -join "`n")"
}

Write-Step 'Push the verified binary package directly to the PR branch'
$stagingDir = Join-Path $RepoDir '.image-pack-v20'
New-Item -ItemType Directory -Force -Path $stagingDir | Out-Null
$destination = Join-Path $stagingDir 'wedding-image-pack-v20-q72.zip'
Copy-Item -LiteralPath $resolvedZip -Destination $destination -Force

$copiedSha = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash.ToLowerInvariant()
if ($copiedSha -ne $ExpectedSha256) {
    throw "Copied package checksum changed unexpectedly: $copiedSha"
}

Invoke-Native git -C $RepoDir add -f '.image-pack-v20/wedding-image-pack-v20-q72.zip'
Invoke-Native git -C $RepoDir commit -m 'chore(images): stage verified Photoshop image pack v20'
$uploadCommit = (& git -C $RepoDir rev-parse HEAD).Trim()
$workflowStart = (Get-Date).ToUniversalTime()
Invoke-Native git -C $RepoDir push origin "HEAD:$ImageBranch"
Write-Host "Uploaded commit: $uploadCommit" -ForegroundColor Green

Write-Step 'Wait for materialization and cleanup'
Wait-GhRun `
    -Branch $ImageBranch `
    -Name 'Materialize Photoshop image pack v20' `
    -NotBefore $workflowStart | Out-Null

Invoke-Native git -C $RepoDir fetch origin $ImageBranch
Invoke-Native git -C $RepoDir reset --hard "origin/$ImageBranch"

if (Test-Path -LiteralPath (Join-Path $RepoDir '.image-pack-v20')) {
    throw 'Materializer finished but the staging directory still exists.'
}
if (-not (Test-Path -LiteralPath (Join-Path $RepoDir 'assets/images/meta-v4.jpg'))) {
    throw 'Materializer finished but meta-v4.jpg is missing.'
}
if (-not (Select-String -LiteralPath (Join-Path $RepoDir 'index.html') -Pattern '\?v=20' -Quiet)) {
    throw 'Materializer finished but index.html does not reference image cache version v20.'
}

Write-Step 'Wait for source, browser, and Lighthouse PR checks'
Wait-PrChecks | Out-Null
Write-Host 'PASS: all PR checks succeeded.' -ForegroundColor Green

if ($NoMerge) {
    Write-Host 'NoMerge was requested. PR #13 is verified and ready, but was not merged.' -ForegroundColor Yellow
    exit 0
}

Write-Step 'Mark PR ready and merge it'
$prState = & gh pr view $PullRequest --repo $Repository --json isDraft,state,headRefOid --jq '{isDraft:.isDraft,state:.state,headRefOid:.headRefOid}' | ConvertFrom-Json
if ($prState.state -ne 'OPEN') {
    throw "PR #$PullRequest is not open. Current state: $($prState.state)"
}
if ($prState.isDraft) {
    Invoke-Native gh pr ready $PullRequest --repo $Repository
}

Invoke-Native gh pr merge $PullRequest `
    --repo $Repository `
    --squash `
    --delete-branch `
    --match-head-commit $prState.headRefOid

$mergeSha = (& gh pr view $PullRequest --repo $Repository --json mergeCommit --jq '.mergeCommit.oid').Trim()
if ([string]::IsNullOrWhiteSpace($mergeSha)) {
    throw 'Could not resolve the merge commit SHA.'
}
Write-Host "Merged PR #$PullRequest at $mergeSha" -ForegroundColor Green

Write-Step 'Wait for main deployment and Lighthouse gates'
$mainStart = (Get-Date).ToUniversalTime().AddMinutes(-2)
Wait-GhRun `
    -Branch 'main' `
    -Name 'Verify and deploy wedding site' `
    -NotBefore $mainStart | Out-Null
Wait-GhRun `
    -Branch 'main' `
    -Name 'Lighthouse budgets' `
    -NotBefore $mainStart | Out-Null

Write-Step 'Verify the public website serves v20 image references'
$headers = @{
    'Cache-Control' = 'no-cache, no-store, max-age=0'
    'Pragma' = 'no-cache'
}
$rootUrl = "$PublicBaseUrl?build=$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
$response = Invoke-WebRequest -Uri $rootUrl -Headers $headers -UseBasicParsing
if ($response.StatusCode -ne 200) {
    throw "Public root returned HTTP $($response.StatusCode)."
}
if ($response.Content -notmatch '\?v=20' -or $response.Content -notmatch 'meta-v4\.jpg') {
    throw 'Public HTML is reachable but does not yet expose the v20 image release.'
}

foreach ($eventId in @('bride', 'groom', 'nhatrang', 'saigon')) {
    $eventUrl = "${PublicBaseUrl}events/$eventId/?build=$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
    $eventResponse = Invoke-WebRequest -Uri $eventUrl -Headers $headers -UseBasicParsing
    if ($eventResponse.StatusCode -ne 200) {
        throw "Public event '$eventId' returned HTTP $($eventResponse.StatusCode)."
    }
}

foreach ($asset in @('bride', 'groom', 'hero', 'couple-studio')) {
    $assetUrl = "${PublicBaseUrl}assets/images/$asset-1280.webp?v=20"
    $assetResponse = Invoke-WebRequest -Uri $assetUrl -Method Head -Headers $headers -UseBasicParsing
    if ($assetResponse.StatusCode -ne 200) {
        throw "Public image '$asset' returned HTTP $($assetResponse.StatusCode)."
    }
}

if (-not $KeepBranches) {
    Write-Step 'Remove temporary recovery branches when present'
    & git -C $RepoDir push origin --delete staging/v20-binary-upload 2>$null
    & git -C $RepoDir push origin --delete images/refresh-photoshop-v20-final 2>$null
}

Write-Host "`nCOMPLETE: v20 images are merged, deployed, and publicly verified." -ForegroundColor Green

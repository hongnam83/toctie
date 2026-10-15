param (
    [string]$Message = ""
)

$ErrorActionPreference = "Stop"

# Navigate to project directory
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectDir

Write-Host "[Toc Tie] Dang kiem tra thay doi..." -ForegroundColor Cyan

# Check for modified or untracked files
$changes = git status --porcelain
if (-not $changes) {
    Write-Host "[Toc Tie] Khong co thay doi nao can day len." -ForegroundColor Green
    exit 0
}

Write-Host "[Toc Tie] Phat hien thay doi, dang stage toan bo files..." -ForegroundColor Yellow
git add -A

# Determine commit message
if ([string]::IsNullOrWhiteSpace($Message)) {
    $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $Message = "update: auto-sync $now"
}

Write-Host "[Toc Tie] Dang commit: '$Message'..." -ForegroundColor Yellow
git commit -m "$Message"

# Check current branch
$currentBranch = git branch --show-current
if ([string]::IsNullOrWhiteSpace($currentBranch)) {
    $currentBranch = "main"
}

Write-Host "[Toc Tie] Dang push len GitHub ($currentBranch)..." -ForegroundColor Yellow
git push origin $currentBranch

Write-Host "[Toc Tie] Hoan tat! Da dong bo thanh cong len https://github.com/hongnam83/toctie" -ForegroundColor Green

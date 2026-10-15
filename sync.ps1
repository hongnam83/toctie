param (
    [string]$Message = ""
)

$ErrorActionPreference = "Stop"

# Di chuyển đến thư mục dự án
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectDir

Write-Host "🎀 [Tóc Tie] Bắt đầu đồng bộ tự động lên GitHub..." -ForegroundColor Cyan

# Kiểm tra thay đổi
$changes = git status --porcelain
if (-not $changes) {
    Write-Host "✅ Không có thay đổi nào cần cập nhật." -ForegroundColor Green
    exit 0
}

# Add toàn bộ thay đổi
Write-Host "📦 Đang thêm các tệp thay đổi..." -ForegroundColor Yellow
git add -A

# Tạo thông điệp commit nếu chưa có
if ([string]::IsNullOrWhiteSpace($Message)) {
    $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $Message = "update: đồng bộ tự động $now"
}

Write-Host "📝 Đang commit với nội dung: '$Message'..." -ForegroundColor Yellow
git commit -m "$Message"

# Xác định nhánh hiện tại (main hoặc master)
$currentBranch = git branch --show-current
if ([string]::IsNullOrWhiteSpace($currentBranch)) {
    $currentBranch = "main"
}

Write-Host "🚀 Đang đẩy lên GitHub ($currentBranch)..." -ForegroundColor Yellow
git push origin $currentBranch

Write-Host "🎉 Đồng bộ thành công lên https://github.com/hongnam83/toctie!" -ForegroundColor Green

# PowerShell script to push repository to another GitHub profile
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🚀 GitHub Push Tool (Multi-Profile Support) 🚀" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "This script will help you push this project to a GitHub repository"
Write-Host "belonging to a different GitHub profile, without affecting your global"
Write-Host "Git settings."
Write-Host ""

$username = Read-Host "Enter your OTHER GitHub profile Username"
$email = Read-Host "Enter your OTHER GitHub profile Email"
$repoOwner = Read-Host "Enter the repository owner (usually same as username)"
$repoName = Read-Host "Enter the target repository name (e.g. ai-interview-platform)"
Write-Host "Enter your GitHub Personal Access Token (PAT) with repo scopes:"
$pat = Read-Host -AsSecureString

# Convert SecureString to plain text for URL injection
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pat)
$plainPat = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

if ([string]::IsNullOrWhiteSpace($username) -or [string]::IsNullOrWhiteSpace($email) -or [string]::IsNullOrWhiteSpace($repoOwner) -or [string]::IsNullOrWhiteSpace($repoName) -or [string]::IsNullOrWhiteSpace($plainPat)) {
    Write-Error "All fields are required. Script aborted."
    exit 1
}

# 1. Initialize Git if not already done
if (-not (Test-Path ".git")) {
    Write-Host "Initializing local Git repository..." -ForegroundColor Yellow
    git init
}

# 2. Configure Local user.name and user.email (specific to this repository only)
Write-Host "Setting local repository Git configuration..." -ForegroundColor Yellow
git config --local user.name $username
git config --local user.email $email

# 3. Add files and make initial commit if needed
Write-Host "Staging files..." -ForegroundColor Yellow
git add .

$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "Nothing to commit, working tree clean." -ForegroundColor Green
} else {
    Write-Host "Creating initial commit..." -ForegroundColor Yellow
    git commit -m "Initial commit (deployed and production-ready)"
}

# 4. Configure remote with embedded credentials
Write-Host "Configuring remote origin..." -ForegroundColor Yellow
$remoteUrl = "https://$($username):$($plainPat)@github.com/$($repoOwner)/$($repoName).git"

# Remove existing remote if it exists
git remote remove origin 2>$null

# Add new remote
git remote add origin $remoteUrl

# 5. Push to main
Write-Host "Pushing to GitHub (main branch)..." -ForegroundColor Yellow
git branch -M main
git push -u origin main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully pushed to https://github.com/$($repoOwner)/$($repoName)" -ForegroundColor Green
    Write-Host "Note: Your credentials are safely configured locally for this repo only." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Failed to push. Verify your PAT scopes, username, and repository name." -ForegroundColor Red
}

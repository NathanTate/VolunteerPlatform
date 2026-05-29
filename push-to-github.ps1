# VolunteerUA — init git repo and push to GitHub
# Run this once from the project root:
#   cd C:\Users\Natha\source\VolunteerPlatform
#   .\push-to-github.ps1
#
# Prerequisites:
#   - Git installed
#   - GitHub repo already created at https://github.com/NathanTate/VolunteerPlatform
#     (create it empty, no README/gitignore, then come back here)
#   - Either SSH key configured OR you'll be prompted for a PAT

param(
    [string]$RepoUrl = "https://github.com/NathanTate/VolunteerPlatform.git"
)

Set-Location $PSScriptRoot

# Remove stale lock files if present
if (Test-Path ".git\index.lock")  { Remove-Item ".git\index.lock"  -Force }
if (Test-Path ".git\config.lock") { Remove-Item ".git\config.lock" -Force }

# Init if not already a repo (or if .git/objects is empty from a failed init)
if (-not (git rev-parse --git-dir 2>$null)) {
    git init -b main
} else {
    # Make sure we're on main
    git checkout -b main 2>$null
}

git config user.name  "NathanTate"
git config user.email "nathankhomych@gmail.com"

git add -A

git commit -m "Initial commit: VolunteerUA platform

- Angular 18 frontend (Material UI, Mapbox)
- ASP.NET Core 9 API with MediatR / CQRS
- SQL Server + EF Core migrations
- SignalR real-time notifications
- Role-based access: Guest -> Volunteer -> Coordinator -> OrganizationAdmin -> SuperAdmin
- Task board, applications workflow, emergency banner, dashboard
- Docker + docker-compose for one-command startup"

git remote remove origin 2>$null
git remote add origin $RepoUrl

Write-Host ""
Write-Host "Pushing to $RepoUrl ..." -ForegroundColor Cyan
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Done! Repo is live at: $($RepoUrl -replace '\.git$','')" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Push failed. If using HTTPS, create a Personal Access Token at:" -ForegroundColor Yellow
    Write-Host "  https://github.com/settings/tokens  (scope: repo)" -ForegroundColor Yellow
    Write-Host "Then re-run with:" -ForegroundColor Yellow
    Write-Host "  git push -u origin main" -ForegroundColor Yellow
}

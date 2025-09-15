# Pre-Deploy Validation Script for Windows
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Pre-Deploy Validation Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if TypeScript compiles
Write-Host "1. Checking TypeScript compilation..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ TypeScript compilation successful" -ForegroundColor Green
} else {
    Write-Host "✗ TypeScript compilation failed" -ForegroundColor Red
    Write-Host "Fix the errors above before pushing to Git" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "2. Checking for required environment variables..." -ForegroundColor Yellow

# Check if .env file exists
if (Test-Path .env) {
    Write-Host "✓ .env file found" -ForegroundColor Green
    
    $envContent = Get-Content .env
    
    if ($envContent -match "EVOLUTION_API_URL") {
        Write-Host "  ✓ EVOLUTION_API_URL is set" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ EVOLUTION_API_URL not found in .env" -ForegroundColor Yellow
    }
    
    if ($envContent -match "EVOLUTION_API_KEY") {
        Write-Host "  ✓ EVOLUTION_API_KEY is set" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ EVOLUTION_API_KEY not found in .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ .env file not found (OK for production)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "3. Checking Git status..." -ForegroundColor Yellow
git status --short
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Git repository is valid" -ForegroundColor Green
} else {
    Write-Host "✗ Not a Git repository" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All checks passed! Ready to deploy." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To deploy, run:" -ForegroundColor Yellow
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'your message'" -ForegroundColor White
Write-Host "  git push origin master" -ForegroundColor White

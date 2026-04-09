# MeterItPro Sync — New Machine Setup Script
# Run as Administrator. No prompts — copies one file and runs.
#
# Usage:
#   Right-click → "Run with PowerShell"  (as Administrator)
#   OR in an admin terminal: powershell -ExecutionPolicy Bypass -File install.ps1

Set-StrictMode -Off
$ErrorActionPreference = "Stop"

$installDir = "C:\MeterItPro\sync"
$githubRaw  = "https://raw.githubusercontent.com/emil-guirguis/MeterItPro/main/sync"

# ── Configuration ─────────────────────────────────────────────────────────────
$config = @{
    GITHUB_OWNER            = "emil-guirguis"
    POSTGRES_SYNC_DB        = "postgres"
    POSTGRES_SYNC_USER      = "postgres"
    POSTGRES_SYNC_PASSWORD  = "ZfyUDh!_x4bSYXm"
    JWT_SECRET              = "your-super-secret-jwt-key-change-this-in-production"
    CLIENT_API_URL          = "https://meteritpro.com/api"
    CLIENT_API_KEY          = ""
    MCP_HTTP_PORT           = "3003"
    BACNET_DEBUG_POST_READ_CHECK = "false"
}

# ── Banner ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  MeterItPro Sync - New Machine Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Check Docker ───────────────────────────────────────────────────────────
Write-Host "Checking Docker..." -ForegroundColor Yellow
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host ""
    Write-Host "Docker Desktop is not installed." -ForegroundColor Red
    Write-Host "Download and install it from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Write-Host "Then re-run this script." -ForegroundColor Yellow
    pause
    exit 1
}

docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker is installed but not running. Start Docker Desktop and re-run this script." -ForegroundColor Red
    pause
    exit 1
}
Write-Host "Docker is running." -ForegroundColor Green

# ── 2. Create directories ─────────────────────────────────────────────────────
Write-Host "Creating $installDir..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "$installDir\docker\init" | Out-Null

# ── 3. Download files from GitHub ─────────────────────────────────────────────
Write-Host "Downloading docker-compose.yml..." -ForegroundColor Yellow
Invoke-WebRequest -Uri "$githubRaw/docker-compose.yml" -OutFile "$installDir\docker-compose.yml"

Write-Host "Downloading database schema..." -ForegroundColor Yellow
Invoke-WebRequest -Uri "$githubRaw/docker/init/00-schema.sql" -OutFile "$installDir\docker\init\00-schema.sql"

# ── 4. Write .env ─────────────────────────────────────────────────────────────
Write-Host "Writing .env..." -ForegroundColor Yellow
$envContent = $config.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }
$envContent | Set-Content "$installDir\.env" -Encoding UTF8

# ── 5. Start services ─────────────────────────────────────────────────────────
Write-Host "Starting MeterItPro sync services..." -ForegroundColor Yellow
Set-Location $installDir
docker compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "docker compose failed. Check the output above." -ForegroundColor Red
    pause
    exit 1
}

# ── 6. Done ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend : http://localhost:8080" -ForegroundColor White
Write-Host "  API      : http://localhost:3002" -ForegroundColor White
Write-Host "  Database : localhost:5432"        -ForegroundColor White
Write-Host ""
Write-Host "Services auto-update within 5 minutes of a new build." -ForegroundColor DarkGray
Write-Host ""
pause

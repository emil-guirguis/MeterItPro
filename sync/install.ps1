# MeterItPro Sync — New Machine Setup Script
# Run this as Administrator on a fresh Windows machine.
#
# Usage:
#   1. Copy this file to the new machine (USB, network share, email, etc.)
#   2. Right-click → "Run with PowerShell" (as Administrator)
#      OR in an admin terminal: powershell -ExecutionPolicy Bypass -File install.ps1

Set-StrictMode -Off
$ErrorActionPreference = "Stop"

$installDir = "C:\MeterItPro\sync"
$githubRaw  = "https://raw.githubusercontent.com/emil-guirguis/MeterItPro/main/sync"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  MeterItPro Sync — New Machine Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Create install directory ───────────────────────────────────────────────
Write-Host "Creating $installDir ..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "$installDir\docker\init" | Out-Null

# ── 2. Download docker-compose.yml and schema ─────────────────────────────────
Write-Host "Downloading docker-compose.yml ..." -ForegroundColor Yellow
Invoke-WebRequest -Uri "$githubRaw/docker-compose.yml" -OutFile "$installDir\docker-compose.yml"

Write-Host "Downloading database schema ..." -ForegroundColor Yellow
Invoke-WebRequest -Uri "$githubRaw/docker/init/00-schema.sql" -OutFile "$installDir\docker\init\00-schema.sql"

# ── 3. Collect configuration ──────────────────────────────────────────────────
Write-Host ""
Write-Host "Enter configuration for this machine:" -ForegroundColor Cyan
Write-Host "(Press Enter to accept the default shown in brackets)" -ForegroundColor DarkGray
Write-Host ""

function Prompt-Value($label, $default = "", $secret = $false) {
    if ($default) { $prompt = "$label [$default]" } else { $prompt = $label }
    if ($secret) {
        $val = Read-Host -AsSecureString $prompt
        $val = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($val))
    } else {
        $val = Read-Host $prompt
    }
    if (-not $val -and $default) { return $default }
    return $val
}

$githubOwner = Prompt-Value "GitHub username (image owner)" "emil-guirguis"
$githubUser  = Prompt-Value "GitHub username (for login)" $githubOwner
$githubToken = Prompt-Value "GitHub token (read:packages)" "" $true
$dbName      = Prompt-Value "Database name" "postgres"
$dbUser      = Prompt-Value "Database user" "postgres"
$dbPassword  = Prompt-Value "Database password" "" $true
$jwtSecret   = Prompt-Value "JWT secret" "" $true
$clientApi   = Prompt-Value "Client API URL" "https://meteritpro.com/api"
$clientKey   = Prompt-Value "Client API key (leave blank if none)" ""
$mcpPort     = Prompt-Value "MCP HTTP port" "3003"

# ── 4. Write .env ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Writing .env ..." -ForegroundColor Yellow

@"
GITHUB_OWNER=$githubOwner
GITHUB_USER=$githubUser
GITHUB_TOKEN=$githubToken
POSTGRES_SYNC_DB=$dbName
POSTGRES_SYNC_USER=$dbUser
POSTGRES_SYNC_PASSWORD=$dbPassword
JWT_SECRET=$jwtSecret
CLIENT_API_URL=$clientApi
CLIENT_API_KEY=$clientKey
MCP_HTTP_PORT=$mcpPort
BACNET_DEBUG_POST_READ_CHECK=false
"@ | Set-Content "$installDir\.env" -Encoding UTF8

# ── 5. Check Docker ───────────────────────────────────────────────────────────
Write-Host "Checking Docker ..." -ForegroundColor Yellow
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue

if (-not $dockerInstalled) {
    Write-Host ""
    Write-Host "Docker Desktop is not installed." -ForegroundColor Red
    Write-Host "Download and install it from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Write-Host "Then re-run this script." -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Docker is installed but not running. Please start Docker Desktop and re-run this script." -ForegroundColor Red
    Write-Host ""
    pause
    exit 1
}

Write-Host "Docker is running." -ForegroundColor Green

# ── 6. Log in to GHCR ────────────────────────────────────────────────────────
Write-Host "Logging in to GitHub Container Registry ..." -ForegroundColor Yellow
echo $githubToken | docker login ghcr.io -u $githubUser --password-stdin
if ($LASTEXITCODE -ne 0) {
    Write-Host "Login failed. Check your GitHub token has 'read:packages' scope." -ForegroundColor Red
    pause
    exit 1
}

# ── 7. Start services ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Starting MeterItPro sync services ..." -ForegroundColor Yellow
Set-Location $installDir
docker compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "docker compose failed. Check the output above." -ForegroundColor Red
    pause
    exit 1
}

# ── 8. Done ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend : http://localhost:8080"   -ForegroundColor White
Write-Host "  API      : http://localhost:3002"   -ForegroundColor White
Write-Host "  Database : localhost:5432"          -ForegroundColor White
Write-Host ""
Write-Host "Services will auto-update within 5 minutes of a new build." -ForegroundColor DarkGray
Write-Host ""
pause

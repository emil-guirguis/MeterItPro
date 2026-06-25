# MeterItPro - Prepare Ubuntu USB for automated sync server install
# Run as Administrator after flashing USB with Rufus.
#
# Usage:
#   .\prepare-usb.ps1 -UsbDrive D:

param(
    [Parameter(Mandatory=$true)]
    [string]$UsbDrive
)

$ErrorActionPreference = "Stop"
$scriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceDir  = Split-Path -Parent $scriptDir   # sync/installer
$goExe      = "C:\Go\bin\go.exe"
$outputBin  = "$scriptDir\MeterItPro-SyncSetup-linux"

Write-Host ""
Write-Host "MeterItPro USB Preparation"
Write-Host "--------------------------"
Write-Host ""

# Validate USB drive
if (-not (Test-Path $UsbDrive)) {
    Write-Error "Drive $UsbDrive not found. Check the drive letter."
    exit 1
}

# Build binary with version timestamp
if (-not (Test-Path $goExe)) {
    Write-Error "Go not found at $goExe. Install Go first."
    exit 1
}

$version = Get-Date -Format "yyyyMMdd.HHmm"
Write-Host "Building installer v$version..."
$env:GOOS        = "linux"
$env:GOARCH      = "amd64"
$env:CGO_ENABLED = "0"
& $goExe build -C $sourceDir -ldflags "-X main.buildVersion=$version" -o $outputBin .
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed."
    exit 1
}
$sizeMB = [math]::Round((Get-Item $outputBin).Length / 1MB, 1)
Write-Host "  Built: v$version  ($sizeMB MB)"
Write-Host ""

# Copy autoinstall files
Write-Host "Copying autoinstall files to $UsbDrive\autoinstall..."
$dest = "$UsbDrive\autoinstall"
if (-not (Test-Path $dest)) { New-Item -ItemType Directory -Path $dest | Out-Null }

Copy-Item "$scriptDir\user-data"                   "$dest\user-data"                   -Force
Copy-Item "$scriptDir\meta-data"                   "$dest\meta-data"                   -Force
Copy-Item "$scriptDir\firstboot.sh"                "$dest\firstboot.sh"                -Force
Copy-Item "$scriptDir\meteritpro-setup.service"    "$dest\meteritpro-setup.service"    -Force
Copy-Item $outputBin                               "$dest\MeterItPro-SyncSetup-linux"  -Force
Write-Host "  Files copied."

# Patch all grub.cfg files on USB
Write-Host "Patching grub.cfg..."
$grubFiles = Get-ChildItem -Path $UsbDrive -Filter "grub.cfg" -Recurse -ErrorAction SilentlyContinue

if ($grubFiles.Count -eq 0) {
    Write-Warning "No grub.cfg found on $UsbDrive"
    Write-Warning "USB may not have been flashed correctly with Rufus. Patch manually:"
    Write-Warning "  Add 'autoinstall ds=nocloud\;s=/cdrom/autoinstall/' before '---' on the linux /casper/vmlinuz line."
    exit 1
}

$bannerTitle = "Install MeterItPro Sync Server  -  v$version  (WiFi)"
$patchedCount = 0
foreach ($grubFile in $grubFiles) {
    $content = Get-Content $grubFile.FullName -Raw

    # 1. Append autoinstall arg. Negative lookahead skips already-patched lines
    #    so re-running on the same media does not stack duplicates.
    $patched = $content -replace '(linux\s+/casper/vmlinuz(?![^\n]*autoinstall)[^\n]*)( ---)', '$1 autoinstall ds=nocloud\;s=/cdrom/autoinstall/$2'

    # 2. Banner: rebrand the install menu entry title (matches the original
    #    Ubuntu title OR a previously-stamped MeterItPro one, so the version
    #    re-stamps cleanly on every run).
    $patched = $patched -replace 'menuentry "(?:Try or Install Ubuntu Server|Install MeterItPro Sync Server)[^"]*"', "menuentry `"$bannerTitle`""

    if ($content -ne $patched) {
        [System.IO.File]::WriteAllText($grubFile.FullName, $patched, [System.Text.Encoding]::UTF8)
        Write-Host "  Patched: $($grubFile.FullName)"
        $patchedCount++
    }
}

if ($patchedCount -eq 0) {
    Write-Warning "grub.cfg already up to date (autoinstall arg + banner present)."
} else {
    Write-Host "  $patchedCount grub.cfg file(s) patched (autoinstall + MeterItPro banner)."
}

Write-Host ""
Write-Host "USB is ready.  Installer version: v$version"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Safely eject the USB"
Write-Host "  2. Plug USB into the server"
Write-Host "  3. Boot from USB (press F12/F9/F8 at startup for boot menu)"
Write-Host "  4. Ubuntu installs automatically (~10-15 min)"
Write-Host "  5. Server reboots - MeterItPro setup runs on screen"
Write-Host "  6. Confirm version matches v$version on screen"
Write-Host "  7. Enter Sync Server ID and Bootstrap Key when prompted"
Write-Host ""

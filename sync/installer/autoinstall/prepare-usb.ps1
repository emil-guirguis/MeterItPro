# MeterItPro — Prepare Ubuntu USB for automated sync server install
# Run as Administrator after flashing USB with Rufus.
#
# Usage:
#   .\prepare-usb.ps1 -UsbDrive E: -InstallerBin ..\MeterItPro-SyncSetup-linux

param(
    [Parameter(Mandatory=$true)]
    [string]$UsbDrive,

    [Parameter(Mandatory=$true)]
    [string]$InstallerBin
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Validate inputs
if (-not (Test-Path $UsbDrive)) {
    Write-Error "Drive $UsbDrive not found. Check the drive letter."
    exit 1
}
if (-not (Test-Path $InstallerBin)) {
    Write-Error "Installer binary not found: $InstallerBin"
    exit 1
}

Write-Host ""
Write-Host "MeterItPro USB Preparation"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""

# Copy autoinstall files
Write-Host "Copying autoinstall files to $UsbDrive\autoinstall..."
$dest = "$UsbDrive\autoinstall"
if (-not (Test-Path $dest)) { New-Item -ItemType Directory -Path $dest | Out-Null }

Copy-Item "$scriptDir\user-data"                   "$dest\user-data"                   -Force
Copy-Item "$scriptDir\meta-data"                   "$dest\meta-data"                   -Force
Copy-Item "$scriptDir\firstboot.sh"                "$dest\firstboot.sh"                -Force
Copy-Item "$scriptDir\meteritpro-setup.service"    "$dest\meteritpro-setup.service"    -Force
Copy-Item $InstallerBin                            "$dest\MeterItPro-SyncSetup-linux"  -Force
Write-Host "  Files copied."

# Patch grub.cfg to enable autoinstall on boot
$grubPath = "$UsbDrive\boot\grub\grub.cfg"
if (-not (Test-Path $grubPath)) {
    Write-Warning "grub.cfg not found at $grubPath"
    Write-Warning "USB may not have been flashed correctly with Rufus. Patch manually:"
    Write-Warning "  Add 'autoinstall ds=nocloud\;s=/cdrom/autoinstall/' before '---' on the linux /casper/vmlinuz line."
    exit 1
}

Write-Host "Patching grub.cfg..."
$content = Get-Content $grubPath -Raw

# Add autoinstall params before the --- separator on the vmlinuz line
$patched = $content -replace '(linux /casper/vmlinuz[^\n]*)( ---)', '$1 autoinstall ds=nocloud\;s=/cdrom/autoinstall/$2'

if ($content -eq $patched) {
    Write-Warning "Could not find 'linux /casper/vmlinuz ... ---' in grub.cfg."
    Write-Warning "Patch manually: add 'autoinstall ds=nocloud\;s=/cdrom/autoinstall/' before '---' on the vmlinuz line."
} else {
    [System.IO.File]::WriteAllText($grubPath, $patched, [System.Text.Encoding]::UTF8)
    Write-Host "  grub.cfg patched."
}

Write-Host ""
Write-Host "USB is ready."
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Safely eject the USB"
Write-Host "  2. Plug USB into the server"
Write-Host "  3. Boot from USB (press F12/F9/F8 at startup for boot menu)"
Write-Host "  4. Ubuntu installs automatically (~10-15 min)"
Write-Host "  5. Server reboots — MeterItPro setup runs on screen"
Write-Host "  6. Enter Sync Server ID and Bootstrap Key when prompted"
Write-Host ""

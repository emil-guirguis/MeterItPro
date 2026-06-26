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
Copy-Item "$scriptDir\install-existing.sh"         "$dest\install-existing.sh"         -Force
Copy-Item $outputBin                               "$dest\MeterItPro-SyncSetup-linux"  -Force

# Extra datasources for the 2nd/3rd grub entries: ubuntu-only and docker-only.
foreach ($sub in @('ubuntu', 'existing')) {
    $subSrc = "$scriptDir\$sub"
    $subDst = "$dest\$sub"
    if (Test-Path $subSrc) {
        if (-not (Test-Path $subDst)) { New-Item -ItemType Directory -Path $subDst | Out-Null }
        Copy-Item "$subSrc\user-data" "$subDst\user-data" -Force
        Copy-Item "$subSrc\meta-data" "$subDst\meta-data" -Force
    }
}
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

$bannerTitle = "Install MeterItPro Sync Server  -  Ubuntu + Docker  -  v$version"
$ubuntuTitle = "Install Ubuntu only - no MeterItPro  -  v$version"
$dockerTitle = "Install MeterItPro Docker  -  existing Linux, keep data  -  v$version"

# Builds a casper menuentry that boots an autoinstall datasource at $dsPath,
# starting from a CLEAN casper line ($cleanLinux must have no autoinstall arg).
function New-CasperEntry($title, $dsPath, $cleanLinux, $initrd) {
    $ln = $cleanLinux.Replace(' ---', " autoinstall ds=nocloud\;s=$dsPath ---")
    if ($ln -eq $cleanLinux) { $ln = "$($cleanLinux.TrimEnd()) autoinstall ds=nocloud\;s=$dsPath" }
    return "menuentry `"$title`" {`n`tset gfxpayload=keep`n`t$($ln.Trim())`n`t$($initrd.Trim())`n}`n"
}

$patchedCount = 0
foreach ($grubFile in $grubFiles) {
    $content = Get-Content $grubFile.FullName -Raw

    # Original casper boot lines (before we inject autoinstall). On a re-run the
    # first casper line may already carry autoinstall — we strip it below.
    $origLinux  = [regex]::Match($content, '(?m)^\s*linux\s+/casper/vmlinuz[^\r\n]*').Value
    $origInitrd = [regex]::Match($content, '(?m)^\s*initrd\s+/casper/initrd[^\r\n]*').Value
    $cleanLinux = $origLinux -replace '\s*autoinstall\s+ds=nocloud[^\s]*', ''

    # 1. Full install entry: point the existing Ubuntu install entry at the main
    #    /cdrom/autoinstall/ datasource. Negative lookahead skips already-patched
    #    lines so re-running does not stack duplicates.
    $patched = $content -replace '(linux\s+/casper/vmlinuz(?![^\n]*autoinstall)[^\n]*)( ---)', '$1 autoinstall ds=nocloud\;s=/cdrom/autoinstall/$2'

    # 2. Banner: rebrand the install menu entry title (matches the original Ubuntu
    #    title OR a previously-stamped MeterItPro one, so it re-stamps cleanly).
    $patched = $patched -replace 'menuentry "(?:Try or Install Ubuntu Server|Install MeterItPro Sync Server)[^"]*"', "menuentry `"$bannerTitle`""

    # 3. Remove any previously-inserted extra entries, then re-insert them fresh
    #    right AFTER the full-install block. Stripping first means each run
    #    re-stamps the version and self-heals ordering — no duplicates, no stale
    #    version labels. Menu reads: (1) Ubuntu+Docker, (2) Ubuntu only, (3) Docker.
    $patched = $patched -replace '(?s)\r?\n?menuentry "Install Ubuntu only[^"]*"\s*\{.*?\r?\n\}', ''
    $patched = $patched -replace '(?s)\r?\n?menuentry "Install MeterItPro Docker[^"]*"\s*\{.*?\r?\n\}', ''

    if ($origLinux -and $origInitrd) {
        $fullRe = [regex]::new('(?s)' + [regex]::Escape("menuentry `"$bannerTitle`"") + '\s*\{.*?\r?\n\}')
        $m = $fullRe.Match($patched)
        if ($m.Success) {
            $extras  = "`n" + (New-CasperEntry $ubuntuTitle '/cdrom/autoinstall/ubuntu/'   $cleanLinux $origInitrd)
            $extras += "`n" + (New-CasperEntry $dockerTitle '/cdrom/autoinstall/existing/' $cleanLinux $origInitrd)
            $patched = $patched.Insert($m.Index + $m.Length, $extras)
        }
    }

    if ($content -ne $patched) {
        [System.IO.File]::WriteAllText($grubFile.FullName, $patched, [System.Text.Encoding]::UTF8)
        Write-Host "  Patched: $($grubFile.FullName)"
        $patchedCount++
    }
}

if ($patchedCount -eq 0) {
    Write-Warning "grub.cfg already up to date (3 entries present)."
} else {
    Write-Host "  $patchedCount grub.cfg file(s) patched (3 entries: full / ubuntu-only / docker-existing)."
}

Write-Host ""
Write-Host "USB is ready.  Installer version: v$version"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Safely eject the USB"
Write-Host "  2. Plug USB into the server"
Write-Host "  3. Boot from USB (press F12/F9/F8 at startup for boot menu)"
Write-Host "  4. In the grub menu pick one of 3 options:"
Write-Host "       1) Install MeterItPro Sync Server (Ubuntu + Docker) -> fresh server, WIPES disk"
Write-Host "       2) Install Ubuntu only (no MeterItPro)              -> plain OS, WIPES disk"
Write-Host "       3) Install MeterItPro Docker (existing Linux)       -> keep data, Docker only"
Write-Host "  5. It runs automatically, then the machine POWERS OFF when done"
Write-Host "  6. Remove the USB, power the machine back on"
Write-Host "  7. MeterItPro setup runs on screen - confirm version v$version"
Write-Host "  8. (If server.conf was not pre-seeded) enter Sync Server ID + Bootstrap Key"
Write-Host ""

# MeterItPro Sync Server — Setup Guide

## Quick checklist

- [ ] Step 1 — Provision tunnel on client site
- [ ] Step 2 — Download ISO, Rufus, and MeterItPro files
- [ ] Step 3 — Flash USB with Rufus
- [ ] Step 4 — Run `prepare-usb.ps1` to patch USB
- [ ] Step 5 — Boot server from USB
- [ ] Step 6 — Wait for automated Ubuntu install (~10–15 min)
- [ ] Step 7 — Enter Sync Server ID + Bootstrap Key when prompted
- [ ] Step 8 — Confirm Online status on client site

---

## What gets installed

- Ubuntu Server 24.04 LTS
- Docker Engine + Compose plugin
- PostgreSQL, Sync API, Sync Frontend, Sync MCP, Sync Provisioner containers
- Cloudflare Tunnel (activates automatically — no port forwarding needed)
- Watchtower (auto-updates containers when new versions are published)

---

## Requirements

### Hardware
- x86-64 computer (any desktop/mini PC/server)
- Minimum **4 GB RAM**, **20 GB** free disk space
- Ethernet connection (Wi-Fi not recommended for BACnet reliability)

### Network
- Server must be on the **same local network as the BACnet meters** it will read
- Static IP or DHCP reservation recommended (see Post-install)
- Outbound internet access required (for Cloudflare Tunnel and Docker image pulls)
- No inbound port forwarding needed — Cloudflare Tunnel handles remote access

### Other
- USB stick (8 GB+)
- A Windows PC to prepare the USB
- A sync server entry added and provisioned on the MeterItPro client site (Step 1)

---

## Step 1 — Provision the tunnel on the MeterItPro client site

> **Do this FIRST.** The installer will fail if the tunnel is not provisioned.

1. Log into the MeterItPro client site
2. Go to **Settings → Sync Servers**
3. Click **Add Sync Server** — give it a name (e.g. "Building A")
4. Click **Provision Tunnel** and wait until status shows **Provisioned** (~30 seconds)
5. Click **Setup Instructions** — keep this page open, you will need the values in Step 7

---

## Step 2 — Download required files (on your Windows PC)

1. **Ubuntu Server 24.04 LTS ISO**
   - https://ubuntu.com/download/server
   - File: `ubuntu-24.04-live-server-amd64.iso`

2. **Rufus** (USB flash tool, free, no install needed)
   - https://rufus.ie

3. **MeterItPro installer files** from GitHub Actions
   - Open: `https://github.com/emil-guirguis/MeterItPro/actions`
   - Click the **Actions** tab if not already there
   - In the left sidebar click **Build Sync Installer**
   - Click the latest successful run (green checkmark)
   - Scroll to the bottom of the run page — you'll see an **Artifacts** section
   - **You must be logged into GitHub** for the artifact names to be clickable download links
   - Download both:
     - `MeterItPro-SyncSetup-Linux` → extracts to `MeterItPro-SyncSetup-linux` (the installer binary)
     - `MeterItPro-autoinstall` → extracts to `MeterItPro-autoinstall.zip` → extract again → you get an `autoinstall/` folder

   > **Note:** GitHub wraps each artifact in an outer zip. You may need to extract twice to get the actual files.

---

## Step 3 — Flash USB with Rufus

1. Plug in USB stick (contents will be wiped)
2. Open Rufus
3. **Device**: select your USB stick
4. **Boot selection**: click SELECT → pick the Ubuntu ISO
5. When Rufus asks about write mode — choose **ISO Image mode (Recommended)**
6. Leave all other settings as default
7. Click **START** → click OK on any warnings
8. Wait ~5 minutes until complete

> **Important:** Use ISO Image mode, not DD Image mode. DD mode writes a raw image that won't have a readable `boot\grub\grub.cfg` for Step 4 to patch.

---

## Step 4 — Prepare USB for automated install

After Step 2, you should have:
```
autoinstall\
  firstboot.sh
  meta-data
  meteritpro-setup.service
  prepare-usb.ps1
  user-data
MeterItPro-SyncSetup-linux        ← the installer binary
```

Copy `MeterItPro-SyncSetup-linux` into the `autoinstall\` folder so it sits alongside the other files.

First, find your USB drive letter:
- Open **File Explorer** → look under **This PC** for the USB drive (e.g. `D:`, `E:`, `F:`)
- It will appear as a removable drive, often labeled `UBUNTU-SERVER` after flashing

Then open **PowerShell as Administrator** and run:

```powershell
cd C:\path\to\autoinstall
powershell -ExecutionPolicy Bypass -File .\prepare-usb.ps1 -UsbDrive E: -InstallerBin .\MeterItPro-SyncSetup-linux
```

Replace `C:\path\to\autoinstall` with where your `autoinstall\` folder is, and `E:` with the actual USB drive letter you found above.

> **Why `-ExecutionPolicy Bypass`?** Windows blocks unsigned PowerShell scripts by default. This flag allows the script to run for this one command without changing your system settings.

This script:
- Creates `autoinstall\` on the USB and copies all config files + binary
- Patches `grub.cfg` on the USB boot partition to trigger automated install on next boot

Expected output:
```
MeterItPro USB Preparation
--------------------------

Copying autoinstall files to E:\autoinstall...
  Files copied.
Patching grub.cfg...
  grub.cfg patched.

USB is ready.
```

> If you see `Drive X: not found` — wrong drive letter. Check File Explorer and use the correct one.

> If you see `grub.cfg not found` — the USB was not flashed correctly with Rufus. Redo Step 3.

---

## Step 5 — Boot the server from USB

1. Plug USB into the server
2. Power on — press the boot menu key immediately:
   - Dell: `F12` · HP: `F9` · ASUS/Gigabyte: `F8` or `F12` · Lenovo: `F12`
3. Select the USB from the boot menu

> **If USB doesn't appear or won't boot:** Enter BIOS setup (usually `Del` or `F2` at startup)
> and disable **Secure Boot**. Save and reboot, then try again.

---

## Step 6 — Automated Ubuntu install (no action needed)

In the grub menu pick one of **three** options:

1. **Install MeterItPro Sync Server (Ubuntu + Docker)** — fresh server. **Wipes the disk**, installs Ubuntu + MeterItPro. Use this normally.
2. **Install Ubuntu only (no MeterItPro)** — **wipes the disk** and installs a plain Ubuntu Server with no MeterItPro. For staging a machine to add MeterItPro later (via option 3).
3. **Install MeterItPro Docker — existing Linux, keep data** — the server already runs Ubuntu and you only want to (re)install MeterItPro. **Does not reinstall Ubuntu or wipe the disk.** See [Docker-only install](#docker-only-install-existing-ubuntu).

Ubuntu installs silently. You will see installation progress on screen with no prompts.

Duration: ~10–15 minutes depending on hardware.

When the install finishes, the machine **powers off** (it does not reboot — that avoids re-entering the installer with the USB still in). **Remove the USB, then power the machine back on.** It boots the installed disk and the MeterItPro setup runs.

---

## Step 7 — MeterItPro setup (first boot)

After you remove the USB and power the machine back on, the MeterItPro setup runs automatically on screen — be at the keyboard:

```
╔════════════════════════════════════════════════════════╗
║       MeterItPro — Sync Server Setup                   ║
╠════════════════════════════════════════════════════════╣
║  Ubuntu installed. Configuring MeterItPro now...       ║
╚════════════════════════════════════════════════════════╝

[Step 1] Server Configuration
  Open the MeterItPro client site → Settings → Sync Servers,
  click the setup instructions for this server, then enter the values below.

  Sync Server ID  : ____
  Bootstrap Key   : ____
```

Enter the **Sync Server ID** and **Bootstrap Key** from the client site page you opened in Step 1.

Everything else is automatic (~10 minutes — Docker installs, images pull, containers start).

When complete:
```
╔════════════════════════════════════════════════════════╗
║  ✓  Setup complete!                                    ║
║  Cloudflare tunnel activates within ~60 seconds.       ║
╚════════════════════════════════════════════════════════╝
```

---

## Step 8 — Verify on the client site

1. Go back to **Settings → Sync Servers** on the MeterItPro client site
2. The server status should change to **Online** within 60 seconds
3. If still **Offline** after 2 minutes, SSH into the server and check logs:
   ```bash
   # Check all containers are running
   docker compose -f /opt/meteritpro/docker-compose.yml ps

   # Check tunnel logs specifically
   docker compose -f /opt/meteritpro/docker-compose.yml logs sync-provisioner

   # Check all logs
   docker compose -f /opt/meteritpro/docker-compose.yml logs -f
   ```

### Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| USB not in boot menu | Secure Boot blocking | Enter BIOS → disable Secure Boot |
| Ubuntu install not automated (shows interactive prompts) | grub.cfg not patched | Re-run `prepare-usb.ps1` or patch manually |
| Setup hangs at Docker install | No internet | Check ethernet cable; confirm DHCP assigned IP |
| Server stays Offline | Wrong Sync Server ID or Bootstrap Key | Re-run `/usr/local/bin/meteritpro-install` with correct values |
| `grub.cfg not found` in Step 4 | Rufus used DD mode | Re-flash USB with ISO Image mode |

---

## Docker-only install (existing Ubuntu)

Use this when the server **already runs Ubuntu** and you only want to install (or
re-install) MeterItPro — without wiping the disk or reinstalling the OS.

1. Boot the server from the prepared USB (Step 5).
2. In the grub menu choose **Install MeterItPro Docker — existing Linux, keep data**.
3. It automatically finds the installed Ubuntu, drops the MeterItPro installer +
   first-boot service onto it, and **powers the machine off**. The disk is never
   wiped — partitioning never runs.
4. Remove the USB, power the machine back on.
5. The MeterItPro setup runs on screen exactly like Step 7 (uses the pre-seeded
   `server.conf` if present, otherwise prompts for Sync Server ID + Bootstrap Key).

> Under the hood this boots the Ubuntu live environment and runs
> `autoinstall/install-existing.sh`, which mounts the installed root and enables
> the first-boot service. Docker itself installs on the next real boot (it can't
> run inside the live session). If no installed Ubuntu is found, it powers off
> without changing anything — use the full install option instead.

---

## Post-install

### Login credentials

| Field    | Value          |
|----------|----------------|
| Username | `meteritpro`   |
| Password | `MeterItPro1!` |

**Change the password immediately after setup:**
```bash
passwd
```

### SSH access (from your Windows PC)

Find the server IP on the server:
```bash
ip addr show | grep "inet "
```

Then from Windows Terminal:
```bash
ssh meteritpro@192.168.1.x
```

### Set a static IP (recommended)

A static IP keeps SSH access and BACnet routing stable if the router restarts.

Option A — DHCP reservation (easier): log into your router, find the server's MAC address, and assign it a fixed IP.

Option B — Static IP on the server:
```bash
sudo nano /etc/netplan/00-installer-config.yaml
```
Replace the DHCP config with:
```yaml
network:
  version: 2
  ethernets:
    enp3s0:                    # replace with your interface name (run: ip link show)
      addresses:
        - 192.168.1.50/24      # replace with desired IP
      routes:
        - to: default
          via: 192.168.1.1     # replace with your gateway
      nameservers:
        addresses: [8.8.8.8, 1.1.1.1]
```
Apply:
```bash
sudo netplan apply
```

### Check container status
```bash
docker compose -f /opt/meteritpro/docker-compose.yml ps
```

### View logs
```bash
docker compose -f /opt/meteritpro/docker-compose.yml logs -f
```

### Manual re-run (if setup failed)
```bash
sudo /usr/local/bin/meteritpro-install
```

---

## Automatic updates

Watchtower checks for new container images every 5 minutes. When code is pushed to `main` on GitHub:

1. GitHub Actions builds new Docker images → pushes to GHCR
2. Watchtower detects new images → pulls and restarts containers automatically

No manual action needed on the server.

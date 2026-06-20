# MeterItPro Sync Server — Setup Guide

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

3. **MeterItPro-SyncSetup-Linux** and **MeterItPro-autoinstall.zip** from GitHub Actions
   - Go to the repo → **Actions** → latest `Build Sync Installer` run → **Artifacts**
   - Download both `MeterItPro-SyncSetup-Linux` and `MeterItPro-autoinstall`
   - Extract `MeterItPro-autoinstall.zip` — you'll get an `autoinstall/` folder

---

## Step 3 — Flash USB with Rufus

1. Plug in USB stick (contents will be wiped)
2. Open Rufus
3. **Device**: select your USB stick
4. **Boot selection**: click SELECT → pick the Ubuntu ISO
5. Leave all other settings as default
6. Click **START** → click OK on any warnings
7. Wait ~5 minutes until complete

---

## Step 4 — Prepare USB for automated install

Copy the downloaded `MeterItPro-SyncSetup-linux` binary into the extracted `autoinstall/` folder.

Then open **PowerShell as Administrator** and run:

```powershell
cd C:\path\to\autoinstall
.\prepare-usb.ps1 -UsbDrive E: -InstallerBin .\MeterItPro-SyncSetup-linux
```

Replace `C:\path\to\autoinstall` with where you extracted the zip, and `E:` with your USB drive letter.

This script:
- Copies the autoinstall config and installer binary onto the USB
- Patches the USB boot menu to trigger automated install on next boot

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

Ubuntu installs silently. You will see installation progress on screen with no prompts.

Duration: ~10–15 minutes depending on hardware.

When install finishes, the server reboots automatically. **Remove the USB when the screen goes black for reboot.**

---

## Step 7 — MeterItPro setup (first boot)

After reboot, the MeterItPro setup runs automatically on screen — be at the keyboard:

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
3. If still **Offline** after 2 minutes, check logs on the server:
   ```bash
   docker compose -f /opt/meteritpro/docker-compose.yml logs sync-provisioner
   ```

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

#!/bin/bash
# MeterItPro — install onto an ALREADY-installed Ubuntu without wiping the disk.
#
# Driven by the grub entry "Install MeterItPro Docker (existing Linux)". That
# entry boots an autoinstall datasource whose ONLY job is to run this script as
# an `early-command` and power off — so subiquity's storage/curtin step never
# runs and the existing disk is never touched.
#
# This script ALWAYS powers the machine off when it finishes (success OR
# failure). That is deliberate: control must never return to subiquity, or it
# could proceed to wipe the disk. Find/mount the installed root, drop the
# MeterItPro installer + first-boot service onto it, enable the service, done.
# The real Docker install happens on the next boot of the installed system
# (Docker cannot run reliably inside a live-session chroot).

set -uo pipefail

CDROM=/cdrom/autoinstall
[ -d "$CDROM" ] || CDROM="$(cd "$(dirname "$0")" && pwd)"
MNT=/mnt/meteritpro-target

finish() {
    echo ""
    echo "  $1"
    echo "  Powering off in 8 seconds — remove the USB, then power the machine on."
    sleep 8
    poweroff
    exit 0
}

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   MeterItPro — Install onto existing Linux             ║"
echo "║   (Docker only — Ubuntu is NOT reinstalled)            ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

[ "$(id -u)" -eq 0 ] || finish "✗ Must run as root."
[ -f "$CDROM/MeterItPro-SyncSetup-linux" ] || finish "✗ Installer files not found at $CDROM (USB not mounted?)."

# ── Find the installed root partition ───────────────────────────────────────────
# Skip the live media (squashfs/iso9660/loop). Pick the partition that carries a
# real installed system: has /etc/os-release AND an init. Prefer the largest.
echo "  Scanning disks for an installed Ubuntu..."
ROOT_DEV=""
ROOT_SIZE=0
while read -r dev fstype; do
    case "$fstype" in
        ext4|xfs|btrfs) ;;
        *) continue ;;
    esac
    probe=$(mktemp -d)
    if mount -o ro "/dev/$dev" "$probe" 2>/dev/null; then
        if [ -f "$probe/etc/os-release" ] && { [ -e "$probe/usr/sbin/init" ] || [ -e "$probe/sbin/init" ]; }; then
            size=$(blockdev --getsize64 "/dev/$dev" 2>/dev/null || echo 0)
            if [ "$size" -gt "$ROOT_SIZE" ]; then
                ROOT_SIZE=$size
                ROOT_DEV="/dev/$dev"
            fi
        fi
        umount "$probe" 2>/dev/null
    fi
    rmdir "$probe" 2>/dev/null
done < <(lsblk -ln -o NAME,FSTYPE | awk '{print $1, $2}')

[ -n "$ROOT_DEV" ] || finish "✗ No installed Ubuntu found. Use the full 'Install MeterItPro Sync Server' option instead."
echo "  ✓ Found installed system on $ROOT_DEV"

# ── Mount it and bind kernel filesystems for chroot ─────────────────────────────
mkdir -p "$MNT"
mount "$ROOT_DEV" "$MNT" || finish "✗ Failed to mount $ROOT_DEV."
for d in dev dev/pts proc sys run; do mount --bind "/$d" "$MNT/$d" 2>/dev/null; done

# ── Drop MeterItPro files onto the installed system ─────────────────────────────
echo "  Installing MeterItPro setup files..."
mkdir -p "$MNT/usr/local/bin" "$MNT/etc/meteritpro" "$MNT/etc/systemd/system"

install -m 0755 "$CDROM/MeterItPro-SyncSetup-linux" "$MNT/usr/local/bin/meteritpro-install"
install -m 0755 "$CDROM/firstboot.sh"               "$MNT/usr/local/bin/meteritpro-firstboot.sh"
install -m 0644 "$CDROM/meteritpro-setup.service"   "$MNT/etc/systemd/system/meteritpro-setup.service"

if [ -f "$CDROM/server.conf" ]; then
    install -m 0644 "$CDROM/server.conf" "$MNT/etc/meteritpro/server.conf"
    echo "  ✓ Pre-seeded server config copied (name + ID + key from USB)"
fi

# Force the first-boot wizard to run again even if a previous attempt wrote .env.
rm -f "$MNT/opt/meteritpro/.env" 2>/dev/null

chroot "$MNT" systemctl enable meteritpro-setup.service >/dev/null 2>&1 \
    && echo "  ✓ MeterItPro setup enabled for next boot" \
    || echo "  ⚠ Could not enable service via chroot — unit is in place, will run if present"

for d in dev/pts dev proc sys run; do umount -l "$MNT/$d" 2>/dev/null; done
umount -l "$MNT" 2>/dev/null

finish "✓ Done. MeterItPro Docker setup will run on the next boot."

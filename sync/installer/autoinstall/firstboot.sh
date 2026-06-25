#!/bin/bash
LOG=/var/log/meteritpro-install.log

# Stop the login prompt on tty1 so it doesn't fight our wizard output
systemctl stop getty@tty1.service 2>/dev/null || true

# Tee all output to log file AND the console. Service sets StandardOutput=tty
# (tty1), so tee's passthrough lands on screen; the file copy survives clears.
exec > >(tee -a "$LOG") 2>&1

clear
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║       MeterItPro — Sync Server Setup                   ║"
echo "╠════════════════════════════════════════════════════════╣"
echo "║  Ubuntu installed. Configuring MeterItPro now...       ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

/usr/local/bin/meteritpro-install

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "  Setup finished successfully."
else
    echo "  Setup exited with code $EXIT_CODE."
    echo "  Full log: $LOG"
    echo ""
    echo "  Press Enter to see log..."
    read
    cat "$LOG"
fi

echo ""
echo "  Press Enter to exit..."
read

# Disable so it doesn't run again after successful install
systemctl disable meteritpro-setup.service

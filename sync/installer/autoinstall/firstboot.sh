#!/bin/bash
clear
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║       MeterItPro — Sync Server Setup                   ║"
echo "╠════════════════════════════════════════════════════════╣"
echo "║  Ubuntu installed. Configuring MeterItPro now...       ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

/usr/local/bin/meteritpro-install

# Disable so it doesn't run again after successful install
systemctl disable meteritpro-setup.service

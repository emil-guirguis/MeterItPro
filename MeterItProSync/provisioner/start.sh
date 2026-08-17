#!/bin/sh
set -e

echo "[provisioner] Starting. Server ID: ${SYNC_SERVER_ID}"
echo "[provisioner] Polling ${CLIENT_API_URL} for tunnel token..."

while true; do
  RESPONSE=$(curl -sf \
    "${CLIENT_API_URL}/sync-servers/${SYNC_SERVER_ID}/bootstrap?key=${SYNC_SERVER_BOOTSTRAP_KEY}" \
    2>/dev/null) || true

  if [ -n "$RESPONSE" ]; then
    STATUS=$(echo "$RESPONSE" | grep -o '"provision_status":"[^"]*"' | cut -d'"' -f4)
    TOKEN=$(echo "$RESPONSE"  | grep -o '"tunnel_token":"[^"]*"'    | cut -d'"' -f4)

    if [ "$STATUS" = "active" ] && [ -n "$TOKEN" ]; then
      echo "[provisioner] Token received. Starting cloudflared..."
      exec cloudflared tunnel --no-autoupdate run --token "$TOKEN"
    elif [ "$STATUS" = "error" ]; then
      echo "[provisioner] Provision error reported by server. Retrying in 60s..."
    else
      echo "[provisioner] Status: ${STATUS:-unknown}. Retrying in 30s..."
    fi
  else
    echo "[provisioner] Could not reach client API. Retrying in 30s..."
  fi

  sleep 30
done

# Kill ALL TBWC wrangler/workerd processes and free ports 8788 (API) + 5174 (frontend).
# Windows orphans workerd children after a debug stop; killing only the port listener
# leaves siblings that respawn and wedge 8788 — so match by command line first.

# 1. Kill TBWC wrangler/workerd by command line (catches orphaned siblings)
Get-CimInstance Win32_Process |
  Where-Object { $_.CommandLine -match 'TBWC' -and $_.CommandLine -match 'wrangler|workerd' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

# 2. Free the API + frontend ports (any lingering listener)
foreach ($port in 8788, 5174) {
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

Start-Sleep -Milliseconds 400
exit 0

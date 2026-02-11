param(
  # [int[]]$Ports = @(3001, 5173, 5174, 5175, 5176, 4173)
  [int[]]$Ports = @()
)

Write-Host "[stop-dev] Attempting to stop dev servers on ports: $($Ports -join ', ')" -ForegroundColor Cyan

function Stop-PortProcess {
  param([int]$Port)
  try {
    $conns = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if (-not $conns) {
      Write-Host "[stop-dev] No process found on port $Port" -ForegroundColor DarkGray
      return
    }

    $procIds = $conns | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique
    foreach ($procId in $procIds) {
      try {
        $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if ($null -ne $proc) {
          Write-Host ("[stop-dev] Stopping PID {0} ({1}) for port {2}" -f $procId, $proc.ProcessName, $Port) -ForegroundColor Yellow
          Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        } else {
          Write-Host ("[stop-dev] PID {0} not found (already exited) for port {1}" -f $procId, $Port) -ForegroundColor DarkGray
        }
      } catch {
        Write-Warning ("[stop-dev] Failed to stop PID {0} for port {1}: {2}" -f $procId, $Port, $_)
      }
    }
  } catch {
    Write-Warning ("[stop-dev] Error querying port {0}: {1}" -f $Port, $_)
  }
}

foreach ($port in $Ports) {
  Stop-PortProcess -Port $port
}

# Optional cleanup: terminate known dev tools if still running (vite, rolldown-vite)
foreach ($name in @('vite', 'rolldown-vite')) {
  try {
    $procs = Get-Process -Name $name -ErrorAction SilentlyContinue
    foreach ($p in $procs) {
      Write-Host ("[stop-dev] Forcing stop of lingering process {0} (PID {1})" -f $p.ProcessName, $p.Id) -ForegroundColor Yellow
      Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
    }
  } catch {}
}

Write-Host "[stop-dev] Done." -ForegroundColor Green

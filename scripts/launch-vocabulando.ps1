$ErrorActionPreference = 'SilentlyContinue'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

function Test-LocalPort($port) {
  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $async = $client.BeginConnect('127.0.0.1', $port, $null, $null)
    $ok = $async.AsyncWaitHandle.WaitOne(350)
    if ($ok) { $client.EndConnect($async); return $true }
    return $false
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

function Stop-PortProcess($port) {
  $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  foreach ($conn in $conns) {
    if ($conn.OwningProcess -and $conn.OwningProcess -gt 0) {
      Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
  }
}

Stop-PortProcess 4180
Stop-PortProcess 5180
Stop-PortProcess 8081
Start-Sleep -Milliseconds 400

# 1. API Local
Start-Process -FilePath 'node' -ArgumentList 'apps/api/src/server.mjs' -WorkingDirectory $projectRoot -WindowStyle Minimized

# 2. Web App (Vite)
Start-Process -FilePath 'npm.cmd' -ArgumentList 'run', 'dev:web' -WorkingDirectory $projectRoot -WindowStyle Minimized

# 3. Mobile (Expo Metro com --clear e abertura automática no Android Emulator)
$mobileDir = Join-Path $projectRoot 'apps\mobile'
Start-Process -FilePath 'npx.cmd' -ArgumentList 'expo', 'start', '--clear', '--android' -WorkingDirectory $mobileDir

for ($i = 0; $i -lt 30; $i++) {
  if ((Test-LocalPort 4180) -and (Test-LocalPort 5180)) { break }
  Start-Sleep -Milliseconds 500
}

$lanIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1).IPAddress

Clear-Host
Write-Host ''
Write-Host '  ============================================================' -ForegroundColor DarkGreen
Write-Host '                   VOCABULANDO - AMBIENTE ATIVO               ' -ForegroundColor White
Write-Host '  ============================================================' -ForegroundColor DarkGreen
Write-Host '  Web App        : http://127.0.0.1:5180' -ForegroundColor Cyan
Write-Host '  API Local      : http://127.0.0.1:4180/api/health' -ForegroundColor Green
if ($lanIp) {
  Write-Host "  Expo (Celular) : exp://$lanIp:8081  (ou aperte 'a' no Metro)" -ForegroundColor Yellow
}
Write-Host '  ============================================================' -ForegroundColor DarkGreen
Write-Host ''

Start-Process 'http://127.0.0.1:5180'
Read-Host '  Pressione Enter para fechar este painel (os servidores continuam rodando)'

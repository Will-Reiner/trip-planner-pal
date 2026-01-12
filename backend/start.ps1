# Script de inicialização rápida do backend
# Execute com: .\start.ps1

Write-Host "🚀 Iniciando Trip Planner Backend..." -ForegroundColor Green
Write-Host ""

# Verificar se o Docker está rodando
Write-Host "📦 Verificando Docker..." -ForegroundColor Cyan
$dockerRunning = docker info 2>&1 | Select-String "Server Version"
if (-not $dockerRunning) {
    Write-Host "❌ Docker não está rodando! Abra o Docker Desktop e tente novamente." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker está rodando" -ForegroundColor Green
Write-Host ""

# Iniciar PostgreSQL
Write-Host "🐘 Iniciando PostgreSQL..." -ForegroundColor Cyan
docker-compose up -d
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ PostgreSQL iniciado" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao iniciar PostgreSQL" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Aguardar banco ficar pronto
Write-Host "⏳ Aguardando banco de dados ficar pronto..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

$healthy = $false
$attempts = 0
while (-not $healthy -and $attempts -lt 30) {
    $healthCheck = docker inspect --format='{{.State.Health.Status}}' trip-planner-db 2>$null
    if ($healthCheck -eq "healthy") {
        $healthy = $true
    } else {
        Start-Sleep -Seconds 1
        $attempts++
    }
}

if ($healthy) {
    Write-Host "✅ Banco de dados pronto!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Banco pode não estar totalmente pronto, mas continuando..." -ForegroundColor Yellow
}
Write-Host ""

# Verificar se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Cyan
    npm install
    Write-Host ""
}

# Iniciar servidor
Write-Host "🚀 Iniciando servidor..." -ForegroundColor Cyan
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "   Backend: http://localhost:3001" -ForegroundColor White
Write-Host "   Health:  http://localhost:3001/health" -ForegroundColor White
Write-Host "   API:     http://localhost:3001/api" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "Pressione Ctrl+C para parar" -ForegroundColor Yellow
Write-Host ""

npm run dev

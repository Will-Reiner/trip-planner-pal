# Script para parar todos os serviços
# Execute com: .\stop.ps1

Write-Host "🛑 Parando serviços..." -ForegroundColor Yellow
Write-Host ""

# Parar PostgreSQL
Write-Host "🐘 Parando PostgreSQL..." -ForegroundColor Cyan
docker-compose stop

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ PostgreSQL parado" -ForegroundColor Green
} else {
    Write-Host "⚠️  Erro ao parar PostgreSQL" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ Serviços parados! Os dados foram preservados." -ForegroundColor Green
Write-Host "   Para iniciar novamente, execute: .\start.ps1" -ForegroundColor Cyan

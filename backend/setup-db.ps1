# Script para setup do banco de dados
# Execute: .\setup-db.ps1

Write-Host "🚀 Iniciando setup do banco de dados..." -ForegroundColor Cyan

# 1. Subir o container
Write-Host "`n📦 Iniciando container PostgreSQL..." -ForegroundColor Yellow
docker-compose up -d

# 2. Aguardar banco ficar pronto
Write-Host "`n⏳ Aguardando PostgreSQL ficar pronto..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 3. Executar schema
Write-Host "`n🗄️ Executando schema.sql..." -ForegroundColor Yellow
docker exec -i trip-planner-db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/02-schema.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Banco de dados criado com sucesso!" -ForegroundColor Green
    Write-Host "`n📊 Informações de conexão:" -ForegroundColor Cyan
    Write-Host "  Host: localhost" -ForegroundColor White
    Write-Host "  Porta: 5433" -ForegroundColor White
    Write-Host "  Usuário: postgres" -ForegroundColor White
    Write-Host "  Senha: postgres" -ForegroundColor White
    Write-Host "  Database: trip_planner" -ForegroundColor White
} else {
    Write-Host "`n❌ Erro ao criar banco de dados!" -ForegroundColor Red
    exit 1
}

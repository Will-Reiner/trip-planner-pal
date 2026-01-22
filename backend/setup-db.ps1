#!/usr/bin/env pwsh
# Script simplificado de setup do banco de dados
# Trip Planner Pal

Write-Host "Iniciando setup do banco de dados..." -ForegroundColor Cyan

# Executar o script SQL
Write-Host "Criando estrutura do banco..." -ForegroundColor Cyan
Get-Content init-database.sql | docker exec -i trip-planner-db psql -U postgres

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[SUCESSO] Banco criado!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Criando usuario admin..." -ForegroundColor Cyan
    npx tsx create-admin.ts
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "[SUCESSO] Setup completo!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Credenciais do admin:" -ForegroundColor Cyan
        Write-Host "  Usuario: Will" -ForegroundColor White
        Write-Host "  Senha: ultramegasuperpassword123" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "[ERRO] Falha ao criar admin" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[ERRO] Falha ao criar banco" -ForegroundColor Red
    exit 1
}

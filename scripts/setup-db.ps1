# Script para ejecutar las migraciones de BD en local (PowerShell)
# Uso: .\scripts\setup-db.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Iniciando setup de BD..." -ForegroundColor Green

# Esperar a que PostgreSQL esté listo
Write-Host "⏳ Esperando a que PostgreSQL esté disponible..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
while ($attempt -lt $maxAttempts) {
    try {
        $Env:PGPASSWORD = "postgres"
        $null = & pg_isready -h localhost -U postgres
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ PostgreSQL está disponible" -ForegroundColor Green
            break
        }
    } catch {
        # Ignorar errores
    }
    $attempt++
    Start-Sleep -Seconds 1
}

if ($attempt -eq $maxAttempts) {
    Write-Host "❌ PostgreSQL no está disponible después de 30 segundos" -ForegroundColor Red
    exit 1
}

# Crear base de datos si no existe
Write-Host "📦 Verificando base de datos..." -ForegroundColor Yellow
$Env:PGPASSWORD = "postgres"
$dbExists = & psql -h localhost -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'seekops'" 2>$null | Select-String "1" -Quiet
if (-not $dbExists) {
    & psql -h localhost -U postgres -c "CREATE DATABASE seekops;"
}
Write-Host "✅ Base de datos lista" -ForegroundColor Green

# Ejecutar migraciones en orden
Write-Host "🔄 Ejecutando migraciones..." -ForegroundColor Yellow

Get-Content ".ai/db/migrations/001_initial_config_tables.sql" | & psql -h localhost -U postgres -d seekops > $null
Write-Host "✅ Migración 001 completada" -ForegroundColor Green

Get-Content ".ai/db/migrations/002_core_tables.sql" | & psql -h localhost -U postgres -d seekops > $null
Write-Host "✅ Migración 002 completada" -ForegroundColor Green

Get-Content ".ai/db/migrations/003_relationships_and_timeentries.sql" | & psql -h localhost -U postgres -d seekops > $null
Write-Host "✅ Migración 003 completada" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Setup completado exitosamente" -ForegroundColor Green
Write-Host "📊 Base de datos: seekops" -ForegroundColor Cyan
Write-Host "👤 Usuario: postgres" -ForegroundColor Cyan
Write-Host "🔑 Password: postgres" -ForegroundColor Cyan
Write-Host "🌐 Host: localhost:5432" -ForegroundColor Cyan

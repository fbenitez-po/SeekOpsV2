#!/bin/bash

# Script para ejecutar las migraciones de BD en local
# Uso: ./scripts/setup-db.sh

set -e

echo "🚀 Iniciando setup de BD..."

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando a que PostgreSQL esté disponible..."
until pg_isready -h localhost -U postgres > /dev/null 2>&1; do
  sleep 1
done
echo "✅ PostgreSQL está disponible"

# Crear base de datos si no existe
echo "📦 Verificando base de datos..."
PGPASSWORD=postgres psql -h localhost -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'seekops'" | grep -q 1 || \
  PGPASSWORD=postgres psql -h localhost -U postgres -c "CREATE DATABASE seekops;"
echo "✅ Base de datos lista"

# Ejecutar migraciones en orden
echo "🔄 Ejecutando migraciones..."
PGPASSWORD=postgres psql -h localhost -U postgres -d seekops < .ai/db/migrations/001_initial_config_tables.sql
echo "✅ Migración 001 completada"

PGPASSWORD=postgres psql -h localhost -U postgres -d seekops < .ai/db/migrations/002_core_tables.sql
echo "✅ Migración 002 completada"

PGPASSWORD=postgres psql -h localhost -U postgres -d seekops < .ai/db/migrations/003_relationships_and_timeentries.sql
echo "✅ Migración 003 completada"

echo ""
echo "🎉 Setup completado exitosamente"
echo "📊 Base de datos: seekops | Host: localhost:5432"
echo ""
echo "🔐 Admin seed:"
echo "   Email:    admin@seekglobal.co"
echo "   Password: password"
echo "   ⚠️  Cambiar la contraseña del admin antes de ir a producción"

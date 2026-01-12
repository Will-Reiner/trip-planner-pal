#!/bin/sh
set -e

# Criar usuário e banco
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    ALTER USER trip_admin WITH PASSWORD 'trip_password_123';
    GRANT ALL PRIVILEGES ON DATABASE trip_planner TO trip_admin;
EOSQL

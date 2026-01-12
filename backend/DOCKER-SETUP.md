# 🐳 Configuração do PostgreSQL com Docker

Este guia mostra como configurar o PostgreSQL usando Docker para o backend da aplicação.

## 📋 Pré-requisitos

- Docker Desktop instalado e rodando
- Docker Compose (já vem com Docker Desktop)

## 🚀 Passo a Passo

### 1. Iniciar o PostgreSQL

No diretório `backend`, execute:

```powershell
docker-compose up -d
```

Este comando irá:
- ✅ Baixar a imagem PostgreSQL 15 (se não existir)
- ✅ Criar o container `trip-planner-db`
- ✅ Criar o banco de dados `trip_planner`
- ✅ Executar automaticamente o `schema.sql` (criar tabelas e dados de exemplo)
- ✅ Expor a porta 5432

### 2. Verificar se está rodando

```powershell
docker ps
```

Você deve ver o container `trip-planner-db` com status "Up".

### 3. Verificar saúde do banco

```powershell
docker-compose ps
```

O status de health deve aparecer como "healthy" após alguns segundos.

### 4. Testar conexão

```powershell
# Conectar ao PostgreSQL dentro do container
docker exec -it trip-planner-db psql -U trip_admin -d trip_planner

# Listar tabelas
\dt

# Ver usuários cadastrados
SELECT * FROM users;

# Sair
\q
```

## 📊 Credenciais do Banco

As credenciais já estão configuradas no `.env`:

```
Usuário: trip_admin
Senha: trip_password_123
Banco: trip_planner
Host: localhost
Porta: 5432
```

**URL completa:** `postgresql://trip_admin:trip_password_123@localhost:5432/trip_planner`

## 🛠️ Comandos Úteis

### Parar o banco (mantém os dados)
```powershell
docker-compose stop
```

### Iniciar novamente
```powershell
docker-compose start
```

### Parar e remover (APAGA OS DADOS!)
```powershell
docker-compose down
```

### Parar, remover e apagar volumes (reset completo)
```powershell
docker-compose down -v
```

### Ver logs do banco
```powershell
docker-compose logs -f postgres
```

### Resetar banco de dados (recriar tabelas)
```powershell
# Conectar ao banco
docker exec -it trip-planner-db psql -U trip_admin -d trip_planner

# Dentro do psql, dropar e recriar
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
\q

# Executar schema novamente
docker exec -i trip-planner-db psql -U trip_admin -d trip_planner < schema.sql
```

## 🔍 Acessar com Cliente GUI

Se preferir usar um cliente visual, conecte com estas configurações:

- **Host:** localhost
- **Port:** 5432
- **Database:** trip_planner
- **Username:** trip_admin
- **Password:** trip_password_123

Clientes recomendados:
- [DBeaver](https://dbeaver.io/) (gratuito, multi-plataforma)
- [pgAdmin](https://www.pgadmin.org/) (gratuito, oficial)
- [TablePlus](https://tableplus.com/) (pago, bonito)

## 📝 Estrutura do docker-compose.yml

```yaml
services:
  postgres:
    image: postgres:15-alpine      # Imagem leve do PostgreSQL
    ports:
      - "5432:5432"                # Porta exposta
    volumes:
      - postgres_data:/var/lib/postgresql/data          # Persistência
      - ./schema.sql:/docker-entrypoint-initdb.d/       # Auto-inicialização
```

## ⚠️ Troubleshooting

### Erro: "porta 5432 já em uso"

Você já tem PostgreSQL instalado localmente. Opções:

1. **Parar o PostgreSQL local:**
```powershell
Stop-Service postgresql-x64-14  # Ajuste a versão
```

2. **Ou mudar a porta no docker-compose.yml:**
```yaml
ports:
  - "5433:5432"  # Porta externa diferente
```
E atualizar o `.env`:
```
DATABASE_URL=postgresql://trip_admin:trip_password_123@localhost:5433/trip_planner
```

### Erro: "Docker não está rodando"

Abra o Docker Desktop e aguarde iniciar.

### Container não inicia

```powershell
# Ver logs de erro
docker-compose logs postgres

# Remover e recriar
docker-compose down -v
docker-compose up -d
```

## 🎯 Próximo Passo

Depois que o PostgreSQL estiver rodando, inicie o backend:

```powershell
npm run dev
```

Acesse `http://localhost:3001/health` para verificar se está tudo OK!

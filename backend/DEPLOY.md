# Deploy - Trip Planner Pal

## 🚀 Setup Rápido

### 1. Requisitos
- Docker e Docker Compose
- Node.js 18+
- PostgreSQL 15 (via Docker)

### 2. Configurar Banco de Dados

```powershell
# Iniciar container PostgreSQL
cd backend
docker-compose up -d

# Executar setup completo (cria tabelas + admin)
.\setup-db.ps1
```

**Credenciais padrão do admin:**
- Email: will@tripplanner.com
- Senha: senha_segura_aqui

⚠️ **IMPORTANTE:** Altere a senha do admin no arquivo `create-admin.ts` antes de rodar em produção!

### 3. Variáveis de Ambiente

Crie `.env` no diretório `backend/`:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5433
DB_USER=trip_planner_user
DB_PASSWORD=trip_planner_pass
DB_NAME=trip_planner
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
```

Crie `.env` na raiz do projeto:

```env
VITE_API_URL=http://localhost:3001/api
```

### 4. Instalar Dependências

```powershell
# Backend
cd backend
npm install

# Frontend
cd ..
npm install
```

### 5. Executar em Desenvolvimento

```powershell
# Backend (porta 3001)
cd backend
npm run dev

# Frontend (porta 5173)
npm run dev
```

## 📦 Build para Produção

### Frontend

```powershell
npm run build
```

Os arquivos estarão em `dist/`. Sirva com nginx ou qualquer servidor estático.

### Backend

```powershell
cd backend
npm run build
npm start
```

## 🔧 Estrutura do Banco

Todo o schema está em `backend/init-database.sql`:
- 18 tabelas (users, meals, market_items, rides, drinks, expenses, etc)
- Sistema de autenticação (JWT + bcrypt)
- Triggers e views
- Seed data inicial

## 🛠️ Scripts Úteis

- `setup-db.ps1` - Setup completo do banco (tabelas + admin)
- `create-admin.ts` - Criar/resetar senha do admin
- `start.ps1` - Iniciar containers Docker
- `stop.ps1` - Parar containers Docker
- `test-db.js` - Testar conexão com banco

## 📝 Configuração Nginx (Exemplo)

```nginx
server {
    listen 80;
    server_name seudominio.com;

    # Frontend
    location / {
        root /var/www/trip-planner/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔐 Segurança

1. **Altere as senhas padrão** em `create-admin.ts`
2. **Gere JWT_SECRET seguro**: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. **Configure CORS** no backend para seu domínio
4. **Use HTTPS** em produção
5. **Firewall**: Apenas portas 80/443 abertas, PostgreSQL apenas localhost

## 📊 Monitoramento

Logs do backend vão para stdout. Para persistir:

```powershell
npm start 2>&1 | tee -a logs/backend.log
```

## 🆘 Troubleshooting

**Erro de conexão com banco:**
```powershell
docker ps  # Verificar se container está rodando
npm run test:db  # Testar conexão
```

**Porta já em uso:**
```powershell
# Alterar PORT no .env do backend
# Alterar VITE_API_URL no .env da raiz
```

**Migrations não aplicadas:**
```powershell
# Re-executar setup
.\setup-db.ps1
```

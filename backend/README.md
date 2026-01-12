# Trip Planner Backend API

Backend Node.js com PostgreSQL para aplicação de planejamento de viagem colaborativa.

## 🚀 Tecnologias

- Node.js + TypeScript
- Express.js
- PostgreSQL
- pg (node-postgres)

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

## ⚙️ Instalação

1. **Instale as dependências:**
```bash
cd backend
npm install
```

2. **Configure o banco de dados:**

Crie um arquivo `.env` baseado no `.env.example`:
```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais do PostgreSQL:
```
PORT=3001
DATABASE_URL=postgresql://seu_usuario:sua_senha@localhost:5432/trip_planner
NODE_ENV=development
```

3. **Crie o banco de dados e tabelas:**
```bash
psql -U postgres -f schema.sql
```

4. **Inicie o servidor:**
```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm run build
npm start
```

## 📚 API Endpoints

### Users
- `GET /api/users` - Listar todos os usuários
- `GET /api/users/:id` - Buscar usuário por ID
- `POST /api/users` - Criar novo usuário
- `PATCH /api/users/:id` - Atualizar usuário

### Meals (Refeições)
- `GET /api/meals` - Listar todas as refeições
- `GET /api/meals/:id` - Buscar refeição por ID
- `POST /api/meals` - Criar nova refeição
- `PATCH /api/meals/claim-role` - Reivindicar vaga em refeição

**Exemplo de reivindicação de vaga:**
```json
POST /api/meals/claim-role
{
  "meal_id": 1,
  "role": "cook",
  "user_id": 3
}
```
Roles disponíveis: `cook`, `dishwasher1`, `dishwasher2`

### Drinks (Votação de Bebidas)
- `GET /api/drinks` - Listar todas as bebidas
- `GET /api/drinks/category/:category` - Buscar por categoria (alc/non-alc)
- `POST /api/drinks` - Criar nova bebida
- `POST /api/drinks/vote` - Votar em bebida

**Exemplo de votação:**
```json
POST /api/drinks/vote
{
  "drink_id": 5
}
```

### Checklist
- `GET /api/checklist` - Listar todos os itens
- `GET /api/checklist/category/:category` - Buscar por categoria
- `POST /api/checklist` - Criar novo item
- `PATCH /api/checklist/:id` - Atualizar item
- `PATCH /api/checklist/:id/claim` - Reivindicar responsabilidade
- `DELETE /api/checklist/:id` - Deletar item

**Exemplo de reivindicação:**
```json
PATCH /api/checklist/3/claim
{
  "user_id": 2
}
```

### Experience (Frases e Temas)
- `GET /api/experience` - Listar todas as experiências
- `GET /api/experience/type/:type` - Buscar por tipo (frase/tema_festa)
- `POST /api/experience` - Criar nova experiência
- `POST /api/experience/vote` - Votar em tema de festa

**Exemplo de votação:**
```json
POST /api/experience/vote
{
  "experience_id": 2
}
```

## 🗄️ Estrutura do Banco de Dados

### Tabela `users`
```sql
id (SERIAL PRIMARY KEY)
nome (VARCHAR)
avatar_url (TEXT)
titulo_engracado (VARCHAR)
```

### Tabela `meals`
```sql
id (SERIAL PRIMARY KEY)
data (DATE)
tipo_refeicao (cafe/almoco/jantar)
ingredientes (TEXT[])
cook_id (FK users)
dishwasher1_id (FK users)
dishwasher2_id (FK users)
```

### Tabela `drinks_poll`
```sql
id (SERIAL PRIMARY KEY)
categoria (alc/non-alc)
nome_bebida (VARCHAR)
votos (INTEGER)
```

### Tabela `checklist`
```sql
id (SERIAL PRIMARY KEY)
categoria (item/tarefa/nao_esqueca)
descricao (TEXT)
owner_id (FK users, nullable)
completed (BOOLEAN)
```

### Tabela `experience`
```sql
id (SERIAL PRIMARY KEY)
tipo (frase/tema_festa)
conteudo (TEXT)
autor_id (FK users)
votos (INTEGER)
```

## 🔒 Lógica de Negócio

### Claim Role (Refeições)
- Usa transações para garantir atomicidade
- Verifica se a vaga está disponível antes de atribuir
- Impede sobreposição de papéis (lock pessimista com FOR UPDATE)

### Sistema de Votação
- Incrementa contadores atomicamente
- Suporta votação em bebidas e temas de festa
- Previne votos negativos com constraint CHECK

### Checklist
- Permite atribuir responsáveis a tarefas
- Sistema de reivindicação thread-safe
- Suporta múltiplas categorias

## 🧪 Testando a API

Use o arquivo `schema.sql` que já inclui dados de exemplo. Teste com curl, Postman ou Insomnia:

```bash
# Health check
curl http://localhost:3001/health

# Listar usuários
curl http://localhost:3001/api/users

# Votar em bebida
curl -X POST http://localhost:3001/api/drinks/vote \
  -H "Content-Type: application/json" \
  -d '{"drink_id": 1}'
```

## 📝 Formato de Resposta

Todas as respostas seguem o padrão:
```json
{
  "success": true,
  "data": { ... },
  "message": "Mensagem opcional"
}
```

Erros:
```json
{
  "success": false,
  "error": "Descrição do erro"
}
```

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia em modo desenvolvimento
- `npm run build` - Compila TypeScript para JavaScript
- `npm start` - Inicia servidor em produção

## 📱 Integração com Frontend

O backend está configurado para aceitar requisições do frontend React (porta 5173 por padrão). Configure a variável `FRONTEND_URL` no `.env` se necessário.

## 🛡️ Segurança

- Helmet.js para headers de segurança
- CORS configurado
- Validação de entrada em todos endpoints
- Prepared statements (proteção contra SQL injection)
- Transações para operações críticas

## 📄 Licença

ISC

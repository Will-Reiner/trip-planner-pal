-- ========================================
-- SCRIPT DE INICIALIZAÇÃO COMPLETA DO BANCO
-- Trip Planner Pal - Database Setup
-- ========================================
-- Execute: psql -U postgres -f init-database.sql
-- Ou através do Docker: docker exec -i trip-planner-db psql -U postgres < init-database.sql

-- Dropar e recriar o banco de dados
DROP DATABASE IF EXISTS trip_planner;
CREATE DATABASE trip_planner;

\c trip_planner;

-- ========================================
-- 1. SCHEMA BASE (Tabelas principais)
-- ========================================

-- Tabela de Usuários
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    titulo_engracado VARCHAR(255),
    senha VARCHAR(255),
    role VARCHAR(20) DEFAULT 'membro' CHECK (role IN ('admin', 'membro')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Refeições
CREATE TABLE meals (
    id SERIAL PRIMARY KEY,
    data DATE NOT NULL,
    tipo_refeicao VARCHAR(50) NOT NULL CHECK (tipo_refeicao IN ('cafe', 'almoco', 'jantar')),
    nome_refeicao VARCHAR(255),
    ingredientes TEXT[],
    cook_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    helper_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    dishwasher1_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    dishwasher2_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(data, tipo_refeicao)
);

-- Tabela de Bebidas (Sistema de Racha)
CREATE TABLE drinks_poll (
    id SERIAL PRIMARY KEY,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('alc', 'non-alc')),
    nome_bebida VARCHAR(255) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(categoria, nome_bebida)
);

-- Tabela de Participantes no Racha de Bebidas
CREATE TABLE user_drink_participants (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    drink_id INTEGER NOT NULL REFERENCES drinks_poll(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, drink_id)
);

-- Tabela de Checklist
CREATE TABLE checklist (
    id SERIAL PRIMARY KEY,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('item', 'tarefa', 'nao_esqueca')),
    descricao TEXT NOT NULL,
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Sistema de Riscar Individual (Essenciais)
CREATE TABLE user_checklist_checked (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    checklist_id INTEGER NOT NULL REFERENCES checklist(id) ON DELETE CASCADE,
    checked BOOLEAN DEFAULT TRUE,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, checklist_id)
);

-- Tabela de Experiências
CREATE TABLE experience (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('frase', 'tema_festa')),
    conteudo TEXT NOT NULL,
    autor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    votos INTEGER DEFAULT 0 CHECK (votos >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Lista de Mercado
CREATE TABLE market_items (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('acougue', 'hortifruti', 'bebidas', 'limpeza', 'mercearia', 'congelados', 'padaria', 'outros')),
    quantidade DECIMAL(10, 2) NOT NULL,
    unidade VARCHAR(50) NOT NULL CHECK (unidade IN ('kg', 'g', 'litro', 'ml', 'unidade', 'pacote', 'caixa', 'lata', 'garrafa')),
    valor_por_porcao DECIMAL(10, 2),
    tamanho_porcao VARCHAR(100),
    comprado BOOLEAN DEFAULT FALSE,
    responsavel_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    adicionado_por_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de relação entre refeições e ingredientes do mercado
CREATE TABLE meal_ingredients (
    id SERIAL PRIMARY KEY,
    meal_id INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    ingredient_id INTEGER NOT NULL REFERENCES market_items(id) ON DELETE CASCADE,
    quantidade_necessaria DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(meal_id, ingredient_id)
);

-- Tabela de Categorias de Despesas
CREATE TABLE expense_categories (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    icone VARCHAR(50),
    cor VARCHAR(20),
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Estimativas de Gastos (pré-viagem)
CREATE TABLE expense_estimates (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES expense_categories(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    valor_estimado DECIMAL(10, 2) NOT NULL,
    valor_calculado DECIMAL(10, 2),
    criado_por_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Participantes de cada estimativa
CREATE TABLE expense_estimate_participants (
    id SERIAL PRIMARY KEY,
    estimate_id INTEGER NOT NULL REFERENCES expense_estimates(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(estimate_id, user_id)
);

-- Despesas reais (durante/pós-viagem)
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    estimate_id INTEGER REFERENCES expense_estimates(id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES expense_categories(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    valor_total DECIMAL(10, 2) NOT NULL,
    pagador_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data_despesa TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Participantes de cada despesa real
CREATE TABLE expense_participants (
    id SERIAL PRIMARY KEY,
    expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    valor_individual DECIMAL(10, 2),
    pagamento_confirmado BOOLEAN DEFAULT FALSE,
    data_pagamento TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(expense_id, user_id)
);

-- Sistema de Caronas
CREATE TABLE rides (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    motorista_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    origem VARCHAR(255),
    destino VARCHAR(255),
    data_viagem TIMESTAMP,
    valor_gasolina DECIMAL(10, 2),
    distancia_km DECIMAL(10, 2),
    expense_id INTEGER REFERENCES expenses(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Passageiros de cada carona
CREATE TABLE ride_passengers (
    id SERIAL PRIMARY KEY,
    ride_id INTEGER NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contribuicao DECIMAL(10, 2),
    pagamento_confirmado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ride_id, user_id)
);

-- ========================================
-- 2. ÍNDICES PARA PERFORMANCE
-- ========================================

-- Users
CREATE INDEX idx_users_role ON users(role);

-- Meals
CREATE INDEX idx_meals_data ON meals(data);
CREATE INDEX idx_meals_cook ON meals(cook_id);

-- Drinks
CREATE INDEX idx_drinks_categoria ON drinks_poll(categoria);
CREATE INDEX idx_drinks_created_by ON drinks_poll(created_by);
CREATE INDEX idx_user_drink_participants_user ON user_drink_participants(user_id);
CREATE INDEX idx_user_drink_participants_drink ON user_drink_participants(drink_id);

-- Checklist
CREATE INDEX idx_checklist_categoria ON checklist(categoria);
CREATE INDEX idx_checklist_owner ON checklist(owner_id);
CREATE INDEX idx_user_checklist_checked_user ON user_checklist_checked(user_id);
CREATE INDEX idx_user_checklist_checked_checklist ON user_checklist_checked(checklist_id);

-- Experience
CREATE INDEX idx_experience_tipo ON experience(tipo);
CREATE INDEX idx_experience_autor ON experience(autor_id);

-- Market Items
CREATE INDEX idx_market_items_categoria ON market_items(categoria);
CREATE INDEX idx_market_items_responsavel ON market_items(responsavel_id);
CREATE INDEX idx_market_items_comprado ON market_items(comprado);

-- Meal Ingredients
CREATE INDEX idx_meal_ingredients_meal ON meal_ingredients(meal_id);
CREATE INDEX idx_meal_ingredients_ingredient ON meal_ingredients(ingredient_id);

-- Expenses
CREATE INDEX idx_expense_estimates_category ON expense_estimates(category_id);
CREATE INDEX idx_expense_estimate_participants_estimate ON expense_estimate_participants(estimate_id);
CREATE INDEX idx_expense_estimate_participants_user ON expense_estimate_participants(user_id);
CREATE INDEX idx_expenses_estimate ON expenses(estimate_id);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_pagador ON expenses(pagador_id);
CREATE INDEX idx_expenses_data ON expenses(data_despesa);
CREATE INDEX idx_expense_participants_expense ON expense_participants(expense_id);
CREATE INDEX idx_expense_participants_user ON expense_participants(user_id);
CREATE INDEX idx_expense_participants_pagamento ON expense_participants(pagamento_confirmado);

-- Rides
CREATE INDEX idx_rides_motorista ON rides(motorista_id);
CREATE INDEX idx_rides_data ON rides(data_viagem);
CREATE INDEX idx_rides_expense ON rides(expense_id);
CREATE INDEX idx_ride_passengers_ride ON ride_passengers(ride_id);
CREATE INDEX idx_ride_passengers_user ON ride_passengers(user_id);

-- ========================================
-- 3. TRIGGERS E FUNÇÕES
-- ========================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON meals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drinks_poll_updated_at BEFORE UPDATE ON drinks_poll
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checklist_updated_at BEFORE UPDATE ON checklist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experience_updated_at BEFORE UPDATE ON experience
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_market_items_updated_at BEFORE UPDATE ON market_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_estimates_updated_at BEFORE UPDATE ON expense_estimates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON rides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 4. VIEWS
-- ========================================

-- View para estatísticas de refeições
CREATE VIEW meal_statistics AS
SELECT 
    data,
    tipo_refeicao,
    CASE WHEN cook_id IS NULL THEN 'Vago' ELSE 'Preenchido' END as cook_status,
    CASE WHEN helper_id IS NULL THEN 'Vago' ELSE 'Preenchido' END as helper_status,
    CASE WHEN dishwasher1_id IS NULL THEN 'Vago' ELSE 'Preenchido' END as dishwasher1_status,
    CASE WHEN dishwasher2_id IS NULL THEN 'Vago' ELSE 'Preenchido' END as dishwasher2_status
FROM meals
ORDER BY data, 
    CASE tipo_refeicao 
        WHEN 'cafe' THEN 1 
        WHEN 'almoco' THEN 2 
        WHEN 'jantar' THEN 3 
    END;

-- View para resumo de dívidas
CREATE VIEW debts_summary AS
SELECT 
    ep.user_id as devedor_id,
    u1.nome as devedor_nome,
    e.pagador_id as credor_id,
    u2.nome as credor_nome,
    SUM(
        CASE 
            WHEN ep.valor_individual IS NOT NULL THEN ep.valor_individual
            ELSE (e.valor_total - COALESCE(
                (SELECT SUM(valor_individual) FROM expense_participants WHERE expense_id = e.id AND valor_individual IS NOT NULL), 
                0
            )) / (
                SELECT COUNT(*) FROM expense_participants WHERE expense_id = e.id AND valor_individual IS NULL
            )
        END
    ) as valor_devido
FROM expense_participants ep
JOIN expenses e ON ep.expense_id = e.id
JOIN users u1 ON ep.user_id = u1.id
JOIN users u2 ON e.pagador_id = u2.id
WHERE ep.pagamento_confirmado = FALSE 
  AND ep.user_id != e.pagador_id
GROUP BY ep.user_id, u1.nome, e.pagador_id, u2.nome
HAVING SUM(
    CASE 
        WHEN ep.valor_individual IS NOT NULL THEN ep.valor_individual
        ELSE (e.valor_total - COALESCE(
            (SELECT SUM(valor_individual) FROM expense_participants WHERE expense_id = e.id AND valor_individual IS NOT NULL), 
            0
        )) / (
            SELECT COUNT(*) FROM expense_participants WHERE expense_id = e.id AND valor_individual IS NULL
        )
    END
) > 0
ORDER BY devedor_nome, credor_nome;

-- ========================================
-- 5. COMENTÁRIOS
-- ========================================

COMMENT ON TABLE users IS 'Usuários do sistema (participantes da viagem)';
COMMENT ON COLUMN users.role IS 'Papel do usuário: admin (gerencia tudo) ou membro (usuário comum)';
COMMENT ON COLUMN users.senha IS 'Hash bcrypt da senha do usuário';

COMMENT ON TABLE meals IS 'Refeições planejadas com responsáveis';
COMMENT ON TABLE drinks_poll IS 'Bebidas com sistema de racha compartilhado';
COMMENT ON TABLE user_drink_participants IS 'Participantes que entraram no racha de cada bebida';
COMMENT ON TABLE checklist IS 'Lista de tarefas e itens para não esquecer';
COMMENT ON TABLE user_checklist_checked IS 'Sistema de riscar individual: cada usuário pode riscar itens essenciais';
COMMENT ON TABLE experience IS 'Frases e temas de festa sugeridos pelos usuários';
COMMENT ON TABLE market_items IS 'Lista de compras do mercado';
COMMENT ON TABLE meal_ingredients IS 'Relacionamento entre refeições e ingredientes';
COMMENT ON TABLE expense_categories IS 'Categorias de despesas customizáveis';
COMMENT ON TABLE expense_estimates IS 'Estimativas de gastos pré-viagem';
COMMENT ON TABLE expenses IS 'Despesas reais durante/após viagem';
COMMENT ON TABLE rides IS 'Caronas com divisão de gasolina';

-- ========================================
-- 6. DADOS INICIAIS (SEED)
-- ========================================

-- Usuário Admin
-- NOTA: Execute o script TypeScript run_auth_migration.ts para criar com senha hasheada
-- Ou use o comando abaixo e substitua o hash:
INSERT INTO users (nome, senha, role, titulo_engracado) 
VALUES (
  'Will',
  '$2b$10$YourGeneratedHashHere',
  'admin',
  'O Mestre da Viagem 🎮'
);

-- NOTA: Não criamos usuários extras aqui.
-- O admin Will poderá criar novos membros através do painel de administração.

-- Nenhuma bebida inicial - usuários criarão suas próprias bebidas com racha

-- Categorias de despesas padrão
INSERT INTO expense_categories (nome, icone, cor, is_system) VALUES
('Aluguel', NULL, '#3b82f6', true),
('Mercado', NULL, '#10b981', true),
('Passeios', NULL, '#f59e0b', true),
('Gasolina', NULL, '#ef4444', true),
('Restaurante', NULL, '#8b5cf6', true);

-- ========================================
-- FINALIZAÇÃO
-- ========================================

\echo '✅ Database inicializado com sucesso!'
\echo '⚠️  IMPORTANTE: Execute o script run_auth_migration.ts para criar o hash da senha do admin'
\echo '    Comando: cd backend && npx tsx migrations/run_auth_migration.ts'

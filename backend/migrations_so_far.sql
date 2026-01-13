-- Adiciona coluna de senha na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS senha VARCHAR(255);

-- Atualiza usuários existentes com senha padrão (opcional)
UPDATE users SET senha = '123456' WHERE senha IS NULL;

-- Migration: Adiciona lista de mercado e atualiza refeições

-- 1. Criar tabela de ingredientes/itens de mercado
CREATE TABLE IF NOT EXISTS market_items (
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

-- 2. Criar índices para market_items
CREATE INDEX IF NOT EXISTS idx_market_items_categoria ON market_items(categoria);
CREATE INDEX IF NOT EXISTS idx_market_items_responsavel ON market_items(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_market_items_comprado ON market_items(comprado);

-- 3. Adicionar colunas na tabela meals
ALTER TABLE meals ADD COLUMN IF NOT EXISTS nome_refeicao VARCHAR(255);
ALTER TABLE meals ADD COLUMN IF NOT EXISTS helper_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- 4. Criar tabela de relação entre meals e market_items
CREATE TABLE IF NOT EXISTS meal_ingredients (
    id SERIAL PRIMARY KEY,
    meal_id INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    ingredient_id INTEGER NOT NULL REFERENCES market_items(id) ON DELETE CASCADE,
    quantidade_necessaria DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(meal_id, ingredient_id)
);

CREATE INDEX IF NOT EXISTS idx_meal_ingredients_meal ON meal_ingredients(meal_id);
CREATE INDEX IF NOT EXISTS idx_meal_ingredients_ingredient ON meal_ingredients(ingredient_id);

-- 5. Trigger para atualizar updated_at em market_items
CREATE TRIGGER update_market_items_updated_at BEFORE UPDATE ON market_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Migrar dados existentes (converter ingredientes array para itens individuais)
-- Isso será feito manualmente ou via script depois

-- Mensagem de sucesso
SELECT 'Migration concluída com sucesso! Tabela market_items criada.' as status;

-- Migration: Sistema de Despesas e Caronas

-- 1. Tabela de categorias de despesas (customizáveis)
CREATE TABLE IF NOT EXISTS expense_categories (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    icone VARCHAR(50),
    cor VARCHAR(20),
    is_system BOOLEAN DEFAULT FALSE, -- categorias do sistema (não podem ser deletadas)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir categorias padrão
INSERT INTO expense_categories (nome, icone, cor, is_system) VALUES
    ('Aluguel', '🏠', '#3b82f6', true),
    ('Mercado', '🛒', '#10b981', true),
    ('Passeios', '🎢', '#f59e0b', true),
    ('Gasolina', '⛽', '#ef4444', true),
    ('Restaurante', '🍽️', '#8b5cf6', true)
ON CONFLICT (nome) DO NOTHING;

-- 2. Tabela de estimativas de gastos (pré-viagem)
CREATE TABLE IF NOT EXISTS expense_estimates (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES expense_categories(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    valor_estimado DECIMAL(10, 2) NOT NULL,
    valor_calculado DECIMAL(10, 2), -- para categoria "Mercado", calculado da market_items
    criado_por_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Participantes de cada estimativa (quem vai dividir)
CREATE TABLE IF NOT EXISTS expense_estimate_participants (
    id SERIAL PRIMARY KEY,
    estimate_id INTEGER NOT NULL REFERENCES expense_estimates(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(estimate_id, user_id)
);

-- 4. Despesas reais (durante/pós-viagem)
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    estimate_id INTEGER REFERENCES expense_estimates(id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES expense_categories(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    valor_total DECIMAL(10, 2) NOT NULL,
    pagador_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- quem pagou de fato
    data_despesa TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Participantes de cada despesa real (quem vai dividir + quanto + se já pagou)
CREATE TABLE IF NOT EXISTS expense_participants (
    id SERIAL PRIMARY KEY,
    expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    valor_individual DECIMAL(10, 2), -- null = divide igualmente o restante
    pagamento_confirmado BOOLEAN DEFAULT FALSE, -- se já acertou com o pagador
    data_pagamento TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(expense_id, user_id)
);

-- 6. Sistema de Caronas - Carros/Viagens
CREATE TABLE IF NOT EXISTS rides (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL, -- ex: "Ida para a praia", "Volta"
    motorista_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    origem VARCHAR(255),
    destino VARCHAR(255),
    data_viagem TIMESTAMP,
    valor_gasolina DECIMAL(10, 2),
    distancia_km DECIMAL(10, 2),
    expense_id INTEGER REFERENCES expenses(id) ON DELETE SET NULL, -- vincula com despesa de gasolina
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Passageiros de cada carona
CREATE TABLE IF NOT EXISTS ride_passengers (
    id SERIAL PRIMARY KEY,
    ride_id INTEGER NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contribuicao DECIMAL(10, 2), -- quanto vai pagar (null = divide igualmente)
    pagamento_confirmado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ride_id, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_expense_estimates_category ON expense_estimates(category_id);
CREATE INDEX IF NOT EXISTS idx_expense_estimate_participants_estimate ON expense_estimate_participants(estimate_id);
CREATE INDEX IF NOT EXISTS idx_expense_estimate_participants_user ON expense_estimate_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_expenses_estimate ON expenses(estimate_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_pagador ON expenses(pagador_id);
CREATE INDEX IF NOT EXISTS idx_expenses_data ON expenses(data_despesa);

CREATE INDEX IF NOT EXISTS idx_expense_participants_expense ON expense_participants(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_participants_user ON expense_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_participants_pagamento ON expense_participants(pagamento_confirmado);

CREATE INDEX IF NOT EXISTS idx_rides_motorista ON rides(motorista_id);
CREATE INDEX IF NOT EXISTS idx_rides_data ON rides(data_viagem);
CREATE INDEX IF NOT EXISTS idx_rides_expense ON rides(expense_id);

CREATE INDEX IF NOT EXISTS idx_ride_passengers_ride ON ride_passengers(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_passengers_user ON ride_passengers(user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_expense_estimates_updated_at BEFORE UPDATE ON expense_estimates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON rides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View útil: Resumo de quem deve para quem
CREATE OR REPLACE VIEW debts_summary AS
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

COMMENT ON TABLE expense_categories IS 'Categorias de despesas (customizáveis pelos usuários)';
COMMENT ON TABLE expense_estimates IS 'Estimativas de gastos antes da viagem';
COMMENT ON TABLE expense_estimate_participants IS 'Quem vai dividir cada estimativa';
COMMENT ON TABLE expenses IS 'Despesas reais durante/após a viagem';
COMMENT ON TABLE expense_participants IS 'Participantes de cada despesa com valores e status de pagamento';
COMMENT ON TABLE rides IS 'Caronas/viagens de carro com divisão de gasolina';
COMMENT ON TABLE ride_passengers IS 'Passageiros de cada carona';
COMMENT ON VIEW debts_summary IS 'View calculada: quem deve quanto para quem (apenas pendentes)';

SELECT 'Migration concluída! Sistema de despesas e caronas criado.' as resultado;

-- ========================================
-- DADOS INICIAIS PARA PRODUÇÃO
-- ========================================

-- Limpar dados de exemplo antigos (se existirem)
DELETE FROM ride_passengers;
DELETE FROM rides;
DELETE FROM expense_participants;
DELETE FROM expenses;
DELETE FROM expense_estimate_participants;
DELETE FROM expense_estimates;
DELETE FROM expense_categories WHERE is_system = false;
DELETE FROM meal_ingredients;
DELETE FROM market_items;
DELETE FROM experience;
DELETE FROM checklist;
DELETE FROM drinks_poll;
DELETE FROM meals;
DELETE FROM users;

-- 1. USUÁRIOS DA GALERA
INSERT INTO users (nome, titulo_engracado) VALUES
('Will', 'Sommelier de Aluguel'),
('Lumi', 'Fiscal de Louça'),
('Dlima', 'Mestre do Braseiro'),
('Volpi', 'DJ Oficial do Rolê'),
('Cams', 'Rainha do Open Bar'),
('Rafa', 'Inimigo do Fim'),
('Kau', 'Vegetariana da Galera'),
('Jamal', 'Segurança do Cooler'),
('Juliana', 'Crítica Gastronômica'),
('Paula', 'Expert em Caipirinha'),
('Flores', 'Vibe Positiva'),
('Yuri', 'O Cara dos Shots'),
('Ana', 'Gerente de Entretenimento'),
('Bia', 'Dorminhoca do Grupo'),
('Luana', 'Primeira a Chegar');

-- 2. CATEGORIAS DE DESPESAS (inserção já está acima, mantém as system categories)
-- Categorias: Aluguel 🏠, Mercado 🛒, Passeios 🎢, Gasolina ⛽, Restaurante 🍽️

-- 3. CADASTRO DE BEBIDAS (DRINKS POLL)
INSERT INTO drinks_poll (categoria, nome_bebida) VALUES
('alc', 'Cerveja'),
('alc', 'Vinho'),
('alc', 'Caipirinha'),
('alc', 'Shots'),
('non-alc', 'Suco'),
('non-alc', 'Refri Zero'),
('non-alc', 'Refri Normal'),
('non-alc', 'Água com Gás');

SELECT 'Dados iniciais inseridos com sucesso!' as resultado;

-- Criação do banco de dados e schema
-- Execute: psql -U postgres -f schema.sql

DROP DATABASE IF EXISTS trip_planner;
CREATE DATABASE trip_planner;

\c trip_planner;

-- Tabela de Usuários
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    titulo_engracado VARCHAR(255),
    senha VARCHAR(255),
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

-- Índices para melhor performance
CREATE INDEX idx_meals_data ON meals(data);
CREATE INDEX idx_meals_cook ON meals(cook_id);

-- Tabela de Votação de Bebidas
CREATE TABLE drinks_poll (
    id SERIAL PRIMARY KEY,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('alc', 'non-alc')),
    nome_bebida VARCHAR(255) NOT NULL,
    votos INTEGER DEFAULT 0 CHECK (votos >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(categoria, nome_bebida)
);

-- Índice para busca por categoria
CREATE INDEX idx_drinks_categoria ON drinks_poll(categoria);

-- Tabela de Checklist
CREATE TABLE checklist (
    id SERIAL PRIMARY KEY,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('item', 'tarefa', 'nao_esqueca')),
    descricao TEXT NOT NULL,
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para busca por categoria e status
CREATE INDEX idx_checklist_categoria ON checklist(categoria);
CREATE INDEX idx_checklist_owner ON checklist(owner_id);

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

-- Índice para busca por tipo
CREATE INDEX idx_experience_tipo ON experience(tipo);
CREATE INDEX idx_experience_autor ON experience(autor_id);

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

-- Índices para market_items
CREATE INDEX idx_market_items_categoria ON market_items(categoria);
CREATE INDEX idx_market_items_responsavel ON market_items(responsavel_id);
CREATE INDEX idx_market_items_comprado ON market_items(comprado);

-- Tabela de relação entre refeições e ingredientes do mercado
CREATE TABLE meal_ingredients (
    id SERIAL PRIMARY KEY,
    meal_id INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    ingredient_id INTEGER NOT NULL REFERENCES market_items(id) ON DELETE CASCADE,
    quantidade_necessaria DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(meal_id, ingredient_id)
);

CREATE INDEX idx_meal_ingredients_meal ON meal_ingredients(meal_id);
CREATE INDEX idx_meal_ingredients_ingredient ON meal_ingredients(ingredient_id);

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

-- Índices para expense system
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

-- Índices para ride system
CREATE INDEX idx_rides_motorista ON rides(motorista_id);
CREATE INDEX idx_rides_data ON rides(data_viagem);
CREATE INDEX idx_rides_expense ON rides(expense_id);
CREATE INDEX idx_ride_passengers_ride ON ride_passengers(ride_id);
CREATE INDEX idx_ride_passengers_user ON ride_passengers(user_id);

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

-- Dados de exemplo para teste
INSERT INTO users (nome, avatar_url, titulo_engracado, senha) VALUES
    ('João Silva', 'https://i.pravatar.cc/150?img=1', 'Chef Confusão', '123456'),
    ('Maria Santos', 'https://i.pravatar.cc/150?img=2', 'Rainha da Louça', '123456'),
    ('Pedro Oliveira', 'https://i.pravatar.cc/150?img=3', 'Mestre das Compras', '123456'),
    ('Ana Costa', 'https://i.pravatar.cc/150?img=4', 'DJ da Viagem', '123456'),
    ('Carlos Souza', 'https://i.pravatar.cc/150?img=5', 'Motorista Oficial', '123456');

INSERT INTO drinks_poll (categoria, nome_bebida, votos) VALUES
    ('alc', 'Cerveja', 5),
    ('alc', 'Vinho', 8),
    ('alc', 'Caipirinha', 12),
    ('non-alc', 'Refrigerante', 7),
    ('non-alc', 'Suco Natural', 10),
    ('non-alc', 'Água com Gás', 3);

INSERT INTO checklist (categoria, descricao, owner_id, completed) VALUES
    ('item', 'Protetor solar', NULL, FALSE),
    ('item', 'Repelente', NULL, FALSE),
    ('tarefa', 'Comprar mantimentos', 3, FALSE),
    ('tarefa', 'Verificar pneus do carro', 5, TRUE),
    ('nao_esqueca', 'Levar carregador de celular', NULL, FALSE);

INSERT INTO experience (tipo, conteudo, autor_id, votos) VALUES
    ('frase', 'A vida é uma viagem, aproveite cada parada!', 1, 15),
    ('tema_festa', 'Festa Tropical', 4, 8),
    ('tema_festa', 'Anos 80', 2, 12),
    ('frase', 'Viajar é a única coisa que você compra e te torna mais rico', 3, 20);

INSERT INTO market_items (nome, categoria, quantidade, unidade, valor_por_porcao, tamanho_porcao, adicionado_por_id, observacoes) VALUES
    ('Picanha', 'acougue', 3.0, 'kg', 89.90, '1kg', 1, 'Corte especial'),
    ('Alface', 'hortifruti', 2.0, 'unidade', 3.50, '1 unidade', 1, 'Americana'),
    ('Tomate', 'hortifruti', 1.5, 'kg', 6.90, '1kg', 1, NULL),
    ('Cerveja', 'bebidas', 24.0, 'lata', 2.50, '350ml', 1, 'Gelada'),
    ('Arroz', 'mercearia', 5.0, 'kg', 4.50, '1kg', 1, 'Tipo 1'),
    ('Feijão', 'mercearia', 2.0, 'kg', 7.90, '1kg', 1, 'Preto'),
    ('Papel Toalha', 'limpeza', 6.0, 'unidade', 3.20, '1 rolo', 1, NULL);

INSERT INTO expense_categories (nome, icone, cor, is_system) VALUES
    ('Aluguel', '🏠', '#3b82f6', true),
    ('Mercado', '🛒', '#10b981', true),
    ('Passeios', '🎢', '#f59e0b', true),
    ('Gasolina', '⛽', '#ef4444', true),
    ('Restaurante', '🍽️', '#8b5cf6', true);

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

-- View para resumo de dívidas (quem deve para quem)
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

-- Comentários sobre as tabelas
COMMENT ON TABLE users IS 'Usuários do sistema (participantes da viagem)';
COMMENT ON TABLE meals IS 'Refeições planejadas com responsáveis (cook, helper, dishwashers)';
COMMENT ON TABLE drinks_poll IS 'Votação de bebidas para a viagem';
COMMENT ON TABLE checklist IS 'Lista de tarefas e itens para não esquecer';
COMMENT ON TABLE experience IS 'Frases e temas de festa sugeridos pelos usuários';
COMMENT ON TABLE market_items IS 'Lista de compras do mercado com categorias e preços';
COMMENT ON TABLE meal_ingredients IS 'Relacionamento entre refeições e ingredientes do mercado';
COMMENT ON TABLE expense_categories IS 'Categorias de despesas (customizáveis)';
COMMENT ON TABLE expense_estimates IS 'Estimativas de gastos antes da viagem';
COMMENT ON TABLE expense_estimate_participants IS 'Participantes de cada estimativa de gasto';
COMMENT ON TABLE expenses IS 'Despesas reais durante/após a viagem';
COMMENT ON TABLE expense_participants IS 'Participantes de cada despesa com valores e status de pagamento';
COMMENT ON TABLE rides IS 'Caronas/viagens de carro com divisão de gasolina';
COMMENT ON TABLE ride_passengers IS 'Passageiros de cada carona com contribuição';
COMMENT ON VIEW meal_statistics IS 'Estatísticas de preenchimento das refeições';
COMMENT ON VIEW debts_summary IS 'Resumo calculado: quem deve quanto para quem (apenas pendentes)';

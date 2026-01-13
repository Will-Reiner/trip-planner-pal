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
    ingredientes TEXT[],
    cook_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
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

-- Dados de exemplo para teste
INSERT INTO users (nome, avatar_url, titulo_engracado) VALUES
    ('João Silva', 'https://i.pravatar.cc/150?img=1', 'Chef Confusão'),
    ('Maria Santos', 'https://i.pravatar.cc/150?img=2', 'Rainha da Louça'),
    ('Pedro Oliveira', 'https://i.pravatar.cc/150?img=3', 'Mestre das Compras'),
    ('Ana Costa', 'https://i.pravatar.cc/150?img=4', 'DJ da Viagem'),
    ('Carlos Souza', 'https://i.pravatar.cc/150?img=5', 'Motorista Oficial');

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

-- View para estatísticas úteis
CREATE VIEW meal_statistics AS
SELECT 
    data,
    tipo_refeicao,
    CASE WHEN cook_id IS NULL THEN 'Vago' ELSE 'Preenchido' END as cook_status,
    CASE WHEN dishwasher1_id IS NULL THEN 'Vago' ELSE 'Preenchido' END as dishwasher1_status,
    CASE WHEN dishwasher2_id IS NULL THEN 'Vago' ELSE 'Preenchido' END as dishwasher2_status
FROM meals
ORDER BY data, 
    CASE tipo_refeicao 
        WHEN 'cafe' THEN 1 
        WHEN 'almoco' THEN 2 
        WHEN 'jantar' THEN 3 
    END;

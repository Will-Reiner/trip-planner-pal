-- Script para inicializar banco no Coolify
-- Execute este arquivo no PostgreSQL do Coolify

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    titulo_engracado VARCHAR(255),
    senha VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Refeições
CREATE TABLE IF NOT EXISTS meals (
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

CREATE INDEX IF NOT EXISTS idx_meals_data ON meals(data);
CREATE INDEX IF NOT EXISTS idx_meals_cook ON meals(cook_id);

-- Tabela de Votação de Bebidas
CREATE TABLE IF NOT EXISTS drinks_poll (
    id SERIAL PRIMARY KEY,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('alc', 'non-alc')),
    nome_bebida VARCHAR(255) NOT NULL,
    votos INTEGER DEFAULT 0 CHECK (votos >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(categoria, nome_bebida)
);

CREATE INDEX IF NOT EXISTS idx_drinks_categoria ON drinks_poll(categoria);

-- Tabela de Checklist
CREATE TABLE IF NOT EXISTS checklist (
    id SERIAL PRIMARY KEY,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('item', 'tarefa', 'nao_esqueca')),
    descricao TEXT NOT NULL,
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_checklist_categoria ON checklist(categoria);
CREATE INDEX IF NOT EXISTS idx_checklist_owner ON checklist(owner_id);

-- Tabela de Experiências
CREATE TABLE IF NOT EXISTS experience (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('frase', 'tema_festa')),
    conteudo TEXT NOT NULL,
    autor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    votos INTEGER DEFAULT 0 CHECK (votos >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_experience_tipo ON experience(tipo);
CREATE INDEX IF NOT EXISTS idx_experience_autor ON experience(autor_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meals_updated_at ON meals;
CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON meals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_drinks_poll_updated_at ON drinks_poll;
CREATE TRIGGER update_drinks_poll_updated_at BEFORE UPDATE ON drinks_poll
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_checklist_updated_at ON checklist;
CREATE TRIGGER update_checklist_updated_at BEFORE UPDATE ON checklist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_experience_updated_at ON experience;
CREATE TRIGGER update_experience_updated_at BEFORE UPDATE ON experience
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Dados iniciais de exemplo
INSERT INTO users (nome, titulo_engracado) VALUES
    ('Ana', 'Chef Suprema'),
    ('Bruno', 'Mestre Grill'),
    ('Carla', 'Rainha da Cozinha'),
    ('Diego', 'Sommelier de Cerveja'),
    ('Elena', 'Organizadora Master')
ON CONFLICT DO NOTHING;

INSERT INTO drinks_poll (categoria, nome_bebida, votos) VALUES
    ('alc', 'Cerveja', 0),
    ('alc', 'Vinho', 0),
    ('alc', 'Caipirinha', 0),
    ('non-alc', 'Refrigerante', 0),
    ('non-alc', 'Suco Natural', 0),
    ('non-alc', 'Água com Gás', 0)
ON CONFLICT DO NOTHING;

INSERT INTO meals (data, tipo_refeicao, ingredientes) VALUES
    ('2026-01-14', 'cafe', ARRAY['Pão', 'Manteiga', 'Café', 'Leite']),
    ('2026-01-14', 'almoco', ARRAY['Arroz', 'Feijão', 'Carne', 'Salada']),
    ('2026-01-14', 'jantar', ARRAY['Pizza', 'Refrigerante']),
    ('2026-01-15', 'cafe', ARRAY['Tapioca', 'Queijo', 'Presunto']),
    ('2026-01-15', 'almoco', ARRAY['Macarrão', 'Molho', 'Frango']),
    ('2026-01-15', 'jantar', ARRAY['Sanduíche', 'Batata frita'])
ON CONFLICT (data, tipo_refeicao) DO NOTHING;

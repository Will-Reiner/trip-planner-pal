-- ========================================
-- MIGRAÇÃO: Novo Sistema de Temas de Festa
-- ========================================
-- Este script migra o sistema antigo de temas para o novo
-- Execute: psql -U postgres -d trip_planner -f migrate-party-themes.sql

BEGIN;

-- Criar novas tabelas
CREATE TABLE IF NOT EXISTS party_themes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    cor_card VARCHAR(20) NOT NULL DEFAULT '#8b5cf6',
    autor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS party_theme_votes (
    id SERIAL PRIMARY KEY,
    theme_id INTEGER NOT NULL REFERENCES party_themes(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('positive', 'negative')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(theme_id, user_id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_party_themes_autor ON party_themes(autor_id);
CREATE INDEX IF NOT EXISTS idx_party_theme_votes_theme ON party_theme_votes(theme_id);
CREATE INDEX IF NOT EXISTS idx_party_theme_votes_user ON party_theme_votes(user_id);

-- Criar trigger
CREATE TRIGGER update_party_themes_updated_at BEFORE UPDATE ON party_themes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Atualizar comentários
COMMENT ON TABLE experience IS 'Frases e pérolas dos usuários';
COMMENT ON TABLE party_themes IS 'Temas de festa sugeridos com votação';
COMMENT ON TABLE party_theme_votes IS 'Votos positivos/negativos nos temas de festa';

COMMIT;

\echo '✅ Migração de temas de festa concluída!'

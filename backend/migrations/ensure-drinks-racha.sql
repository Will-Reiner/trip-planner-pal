-- ========================================
-- MIGRATION: Garantir colunas do sistema de racha
-- ========================================
-- Este script adiciona colunas/estrutura necessárias
-- sem apagar dados existentes

-- 1. Garantir colunas em drinks_poll
ALTER TABLE drinks_poll 
  ADD COLUMN IF NOT EXISTS emoji VARCHAR(10),
  ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- 2. Preencher emoji ausente antes de NOT NULL
UPDATE drinks_poll SET emoji = '🍻' WHERE emoji IS NULL;

-- 3. Tornar emoji obrigatório
ALTER TABLE drinks_poll 
  ALTER COLUMN emoji SET NOT NULL;

-- 4. Garantir tabela de participantes do racha
CREATE TABLE IF NOT EXISTS user_drink_participants (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    drink_id INTEGER NOT NULL REFERENCES drinks_poll(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, drink_id)
);

-- 5. Garantir índices para performance
CREATE INDEX IF NOT EXISTS idx_drinks_created_by ON drinks_poll(created_by);
CREATE INDEX IF NOT EXISTS idx_user_drink_participants_user ON user_drink_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_drink_participants_drink ON user_drink_participants(drink_id);

-- 6. Atualizar comentários das tabelas
COMMENT ON TABLE drinks_poll IS 'Bebidas com sistema de racha compartilhado';
COMMENT ON TABLE user_drink_participants IS 'Participantes que entraram no racha de cada bebida';

-- ========================================
-- FINALIZAÇÃO
-- ========================================

\echo ' Migração aplicada com sucesso (sem apagar dados)'

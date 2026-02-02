-- ========================================
-- MIGRATION: Sistema de Votação → Sistema de Racha
-- ========================================
-- Este script migra o sistema de bebidas de votação simples
-- para um sistema de racha compartilhado

-- 1. Deletar todas as bebidas existentes (conforme acordado)
DELETE FROM drinks_poll;

-- 2. Adicionar novas colunas à tabela drinks_poll
ALTER TABLE drinks_poll 
  ADD COLUMN IF NOT EXISTS emoji VARCHAR(10),
  ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  DROP COLUMN IF EXISTS votos;

-- 3. Tornar emoji obrigatório
ALTER TABLE drinks_poll 
  ALTER COLUMN emoji SET NOT NULL;

-- 4. Criar tabela de participantes do racha
CREATE TABLE IF NOT EXISTS user_drink_participants (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    drink_id INTEGER NOT NULL REFERENCES drinks_poll(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, drink_id)
);

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_drinks_created_by ON drinks_poll(created_by);
CREATE INDEX IF NOT EXISTS idx_user_drink_participants_user ON user_drink_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_drink_participants_drink ON user_drink_participants(drink_id);

-- 6. Atualizar comentários das tabelas
COMMENT ON TABLE drinks_poll IS 'Bebidas com sistema de racha compartilhado';
COMMENT ON TABLE user_drink_participants IS 'Participantes que entraram no racha de cada bebida';

-- ========================================
-- FINALIZAÇÃO
-- ========================================

\echo ' Migração concluída com sucesso!'
\echo '   - Bebidas antigas deletadas'
\echo '   - Estrutura atualizada para sistema de racha'
\echo '   - Tabela user_drink_participants criada'
\echo ''
\echo ' Usuários podem agora criar suas próprias bebidas com racha!'

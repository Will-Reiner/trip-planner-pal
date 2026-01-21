-- Migration: Sistema de riscar individual para essenciais
-- Cada usuário pode riscar/desriscar itens do checklist individualmente

-- Tabela para armazenar quais usuários riscaram quais itens
CREATE TABLE IF NOT EXISTS user_checklist_checked (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    checklist_id INTEGER NOT NULL REFERENCES checklist(id) ON DELETE CASCADE,
    checked BOOLEAN DEFAULT TRUE,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, checklist_id)
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_user_checklist_checked_user ON user_checklist_checked(user_id);
CREATE INDEX IF NOT EXISTS idx_user_checklist_checked_checklist ON user_checklist_checked(checklist_id);

-- Adicionar coluna created_by no checklist para saber quem criou
ALTER TABLE checklist ADD COLUMN IF NOT EXISTS created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

COMMENT ON TABLE user_checklist_checked IS 'Armazena quais usuários riscaram cada item do checklist (essenciais)';
COMMENT ON COLUMN user_checklist_checked.checked IS 'Se TRUE, o usuário riscou este item';
COMMENT ON COLUMN checklist.created_by_id IS 'ID do usuário que criou este item do checklist';

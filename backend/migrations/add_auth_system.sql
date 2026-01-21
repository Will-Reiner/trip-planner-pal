-- Migration: Sistema de autenticação com roles e senhas
-- Adiciona role (admin/membro) e hash de senha aos usuários

-- Adicionar coluna role (padrão: membro)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'membro' CHECK (role IN ('admin', 'membro'));

-- Modificar coluna senha para armazenar hash bcrypt
-- A coluna já existe, apenas vamos garantir que está configurada corretamente
ALTER TABLE users ALTER COLUMN senha TYPE VARCHAR(255);
ALTER TABLE users ALTER COLUMN senha DROP NOT NULL;

-- Criar índice para busca por role
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Comentários
COMMENT ON COLUMN users.role IS 'Papel do usuário: admin (pode gerenciar usuários e tudo) ou membro (usa o sistema)';
COMMENT ON COLUMN users.senha IS 'Hash bcrypt da senha do usuário';

-- Limpar dados de teste (conforme solicitado)
-- Usar CASCADE para deletar em cascata, respeitando foreign keys
DELETE FROM user_checklist_checked;
DELETE FROM meal_ingredients;
DELETE FROM checklist;
DELETE FROM market_items;
DELETE FROM meals;
DELETE FROM drinks_poll;
DELETE FROM experience;
DELETE FROM expense_participants;
DELETE FROM expenses;
DELETE FROM expense_categories;
DELETE FROM rides;
DELETE FROM users;

-- Seed: Criar usuário admin Will
INSERT INTO users (nome, senha, role, avatar_url, titulo_engracado) 
VALUES (
  'Will',
  '$2b$10$YourHashedPasswordWillGoHere', -- Será substituído pelo hash real
  'admin',
  null,
  'O Mestre da Viagem 🎮'
) RETURNING id, nome, role;

-- Nota: O hash da senha "ultramegasuperpassword123" será gerado no código
-- usando bcrypt.hash('ultramegasuperpassword123', 10)

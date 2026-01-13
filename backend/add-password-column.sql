-- Adiciona coluna de senha na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS senha VARCHAR(255);

-- Atualiza usuários existentes com senha padrão (opcional)
UPDATE users SET senha = '123456' WHERE senha IS NULL;

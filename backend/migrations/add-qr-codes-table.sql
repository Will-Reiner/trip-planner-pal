-- ========================================
-- MIGRATION: Adicionar tabela de QR codes válidos
-- ========================================
-- Esta migração adiciona segurança ao sistema de QR codes
-- Apenas tokens pré-cadastrados por Lumi serão válidos

\c trip_planner;

-- 1. Criar tabela de QR codes válidos
CREATE TABLE IF NOT EXISTS qr_codes (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    descricao VARCHAR(255),
    ativo BOOLEAN DEFAULT TRUE,
    criado_por_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usado_count INTEGER DEFAULT 0
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_qr_codes_token ON qr_codes(token);
CREATE INDEX IF NOT EXISTS idx_qr_codes_ativo ON qr_codes(ativo);

-- 3. Adicionar comentários
COMMENT ON TABLE qr_codes IS 'QR codes válidos criados pela Lumi';
COMMENT ON COLUMN qr_codes.token IS 'Token único do QR code';
COMMENT ON COLUMN qr_codes.ativo IS 'Se FALSE, o QR code não pode mais ser resgatado';
COMMENT ON COLUMN qr_codes.usado_count IS 'Quantos usuários diferentes já resgataram este QR';

-- ========================================
-- FINALIZAÇÃO
-- ========================================

\echo '✅ Migração concluída com sucesso!'
\echo '   - Tabela qr_codes criada'
\echo '   - Índices criados'
\echo ''
\echo '🔒 Segurança aprimorada:'
\echo '   - Apenas QR codes criados por Lumi serão válidos'
\echo '   - Tokens podem ser desativados sem deletar histórico'

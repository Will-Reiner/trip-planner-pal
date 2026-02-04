-- ========================================
-- MIGRATION: Sistema de Jogo com Pontuação
-- ========================================
-- Este script adiciona o sistema de pontuação do jogo
-- com QR codes e pontos manuais

\c trip_planner;

-- 1. Criar tabela de pontuações do jogo
CREATE TABLE IF NOT EXISTS game_scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pontos_ganhos INTEGER NOT NULL DEFAULT 1,
    qr_token VARCHAR(255),
    awarded_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Constraint para prevenir escaneamento duplicado do mesmo QR code
    CONSTRAINT unique_user_qr UNIQUE (user_id, qr_token)
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_qr_token ON game_scores(qr_token);
CREATE INDEX IF NOT EXISTS idx_game_scores_awarded_by ON game_scores(awarded_by_id);

-- 3. Criar view para leaderboard do jogo
CREATE OR REPLACE VIEW game_leaderboard AS
SELECT 
    u.id,
    u.nome,
    u.avatar_url,
    COALESCE(SUM(gs.pontos_ganhos), 0) as total_pontos,
    COUNT(gs.id) as total_acoes
FROM users u
LEFT JOIN game_scores gs ON u.id = gs.user_id
GROUP BY u.id, u.nome, u.avatar_url
ORDER BY total_pontos DESC, u.nome ASC;

-- 4. Adicionar comentários
COMMENT ON TABLE game_scores IS 'Pontuações do jogo - QR codes e pontos manuais da Lumi';
COMMENT ON COLUMN game_scores.qr_token IS 'Token único do QR code escaneado (NULL se for ponto manual)';
COMMENT ON COLUMN game_scores.awarded_by_id IS 'ID do admin que concedeu o ponto manualmente (NULL se for QR code)';
COMMENT ON VIEW game_leaderboard IS 'Ranking de pontuação do jogo ordenado por total de pontos';

-- ========================================
-- FINALIZAÇÃO
-- ========================================

\echo '✅ Migração concluída com sucesso!'
\echo '   - Tabela game_scores criada'
\echo '   - Índices para performance criados'
\echo '   - View game_leaderboard criada'
\echo ''
\echo '📝 Sistema de jogo pronto para uso:'
\echo '   - QR codes: https://rebolahub.astraflow.io/game/qr/TOKEN'
\echo '   - Apenas Lumi pode adicionar pontos manuais'
\echo '   - Cada usuário pode escanear cada QR code apenas 1 vez'

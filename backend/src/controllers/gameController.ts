import { Request, Response } from 'express';
import pool from '../config/database';

interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
    nome?: string;
  };
}

// Obter o leaderboard completo do jogo
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        nome,
        avatar_url,
        total_pontos,
        total_acoes
      FROM game_leaderboard
    `);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar leaderboard:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar leaderboard' });
  }
};

// Obter pontuação do usuário atual
export const getUserScore = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Não autorizado' });
    }

    const result = await pool.query(`
      SELECT 
        id,
        nome,
        avatar_url,
        total_pontos,
        total_acoes
      FROM game_leaderboard
      WHERE id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.json({ 
        success: true, 
        data: { 
          id: userId, 
          total_pontos: 0, 
          total_acoes: 0 
        } 
      });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar pontuação do usuário:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar pontuação' });
  }
};

// Adicionar ponto manualmente (apenas Lumi)
export const addPointManual = async (req: AuthRequest, res: Response) => {
  try {
    const adminUserId = req.user?.userId;
    const targetUserId = parseInt(req.params.userId);

    if (!adminUserId) {
      return res.status(401).json({ success: false, error: 'Não autorizado' });
    }

    // Verificar se o usuário logado é Lumi
    const adminCheck = await pool.query(
      'SELECT nome FROM users WHERE id = $1',
      [adminUserId]
    );

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].nome !== 'Lumi') {
      return res.status(403).json({ 
        success: false, 
        error: 'Apenas Lumi pode adicionar pontos manualmente' 
      });
    }

    // Verificar se o usuário alvo existe
    const targetUser = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [targetUserId]
    );

    if (targetUser.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      });
    }

    // Adicionar ponto
    const result = await pool.query(`
      INSERT INTO game_scores (user_id, pontos_ganhos, awarded_by_id)
      VALUES ($1, 1, $2)
      RETURNING *
    `, [targetUserId, adminUserId]);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erro ao adicionar ponto manual:', error);
    res.status(500).json({ success: false, error: 'Erro ao adicionar ponto' });
  }
};

// Criar novo QR code (apenas Lumi)
export const createQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const adminUserId = req.user?.userId;
    const { token, descricao } = req.body;

    if (!adminUserId) {
      return res.status(401).json({ success: false, error: 'Não autorizado' });
    }

    // Verificar se o usuário logado é Lumi
    const adminCheck = await pool.query(
      'SELECT nome FROM users WHERE id = $1',
      [adminUserId]
    );

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].nome !== 'Lumi') {
      return res.status(403).json({ 
        success: false, 
        error: 'Apenas Lumi pode criar QR codes' 
      });
    }

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token é obrigatório' 
      });
    }

    // Criar QR code
    try {
      const result = await pool.query(`
        INSERT INTO qr_codes (token, descricao, criado_por_id)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [token, descricao || null, adminUserId]);
      
      res.json({ success: true, data: result.rows[0] });
    } catch (insertError: any) {
      if (insertError.code === '23505') {
        return res.status(400).json({ 
          success: false, 
          error: 'Este token já existe!' 
        });
      }
      throw insertError;
    }
  } catch (error) {
    console.error('Erro ao criar QR code:', error);
    res.status(500).json({ success: false, error: 'Erro ao criar QR code' });
  }
};

// Listar QR codes criados (apenas Lumi)
export const getQRCodes = async (req: AuthRequest, res: Response) => {
  try {
    const adminUserId = req.user?.userId;

    if (!adminUserId) {
      return res.status(401).json({ success: false, error: 'Não autorizado' });
    }

    // Verificar se o usuário logado é Lumi
    const adminCheck = await pool.query(
      'SELECT nome FROM users WHERE id = $1',
      [adminUserId]
    );

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].nome !== 'Lumi') {
      return res.status(403).json({ 
        success: false, 
        error: 'Apenas Lumi pode ver QR codes' 
      });
    }

    const result = await pool.query(`
      SELECT 
        id,
        token,
        descricao,
        ativo,
        usado_count,
        criado_em
      FROM qr_codes
      ORDER BY criado_em DESC
    `);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erro ao listar QR codes:', error);
    res.status(500).json({ success: false, error: 'Erro ao listar QR codes' });
  }
};

// Resgatar QR code (usuário logado escaneia QR)
export const redeemQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { token } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Não autorizado' });
    }

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token do QR code é obrigatório' 
      });
    }

    // Verificar se o QR code é válido e está ativo
    const qrCodeCheck = await pool.query(
      'SELECT id, ativo, usado_count FROM qr_codes WHERE token = $1',
      [token]
    );

    if (qrCodeCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'QR code inválido!' 
      });
    }

    const qrCode = qrCodeCheck.rows[0];

    if (!qrCode.ativo) {
      return res.status(400).json({ 
        success: false, 
        error: 'Este QR code já foi resgatado!' 
      });
    }

    // Verificar se já foi usado (segurança extra)
    if (qrCode.usado_count > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Este QR code já foi resgatado por outra pessoa!' 
      });
    }

    // Inserir o ponto e desativar o QR code atomicamente
    try {
      // Iniciar transação
      await pool.query('BEGIN');

      // Inserir pontuação
      const result = await pool.query(`
        INSERT INTO game_scores (user_id, pontos_ganhos, qr_token)
        VALUES ($1, 1, $2)
        RETURNING *
      `, [userId, token]);
      
      // Desativar QR code e incrementar contador
      await pool.query(`
        UPDATE qr_codes 
        SET ativo = FALSE, usado_count = usado_count + 1 
        WHERE token = $1
      `, [token]);

      // Commit da transação
      await pool.query('COMMIT');
      
      res.json({ 
        success: true, 
        message: '+1 ponto! 🎉 Você foi o primeiro!',
        data: result.rows[0] 
      });
    } catch (insertError: any) {
      // Rollback em caso de erro
      await pool.query('ROLLBACK');
      
      // Verificar se é erro de constraint de duplicata
      if (insertError.code === '23505') {
        return res.status(400).json({ 
          success: false, 
          error: 'Você já tentou escanear este QR code!' 
        });
      }
      throw insertError;
    }
  } catch (error) {
    console.error('Erro ao resgatar QR code:', error);
    res.status(500).json({ success: false, error: 'Erro ao resgatar QR code' });
  }
};

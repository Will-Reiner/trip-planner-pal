import { Request, Response } from 'express';
import pool from '../config/database';

interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
  };
}

export const getAllPartyThemes = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        pt.*,
        u.nome as autor_nome,
        u.avatar_url as autor_avatar,
        COUNT(CASE WHEN ptv.vote_type = 'positive' THEN 1 END)::int as positive_votes,
        COUNT(CASE WHEN ptv.vote_type = 'negative' THEN 1 END)::int as negative_votes
      FROM party_themes pt
      LEFT JOIN users u ON pt.autor_id = u.id
      LEFT JOIN party_theme_votes ptv ON pt.id = ptv.theme_id
      GROUP BY pt.id, u.nome, u.avatar_url
      ORDER BY pt.created_at DESC
    `);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar temas de festa:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar temas de festa' });
  }
};

export const createPartyTheme = async (req: AuthRequest, res: Response) => {
  try {
    const { nome, descricao, cor_card } = req.body;
    const autor_id = req.user?.userId;

    if (!nome) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nome é obrigatório' 
      });
    }

    const result = await pool.query(`
      INSERT INTO party_themes (nome, descricao, cor_card, autor_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [nome, descricao || null, cor_card || '#8b5cf6', autor_id]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erro ao criar tema de festa:', error);
    res.status(500).json({ success: false, error: 'Erro ao criar tema de festa' });
  }
};

export const deletePartyTheme = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Verificar se o tema existe e se o usuário pode deletar
    const themeResult = await pool.query(
      'SELECT autor_id FROM party_themes WHERE id = $1',
      [id]
    );

    if (themeResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tema não encontrado' 
      });
    }

    // Apenas o autor ou admin pode deletar
    if (themeResult.rows[0].autor_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Você não tem permissão para deletar este tema' 
      });
    }

    await pool.query('DELETE FROM party_themes WHERE id = $1', [id]);

    res.json({ success: true, message: 'Tema deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar tema de festa:', error);
    res.status(500).json({ success: false, error: 'Erro ao deletar tema de festa' });
  }
};

export const votePartyTheme = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { vote_type } = req.body;
    const user_id = req.user?.userId;

    if (!['positive', 'negative'].includes(vote_type)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tipo de voto inválido. Use: positive ou negative' 
      });
    }

    // Verificar se o tema existe
    const themeResult = await pool.query(
      'SELECT id FROM party_themes WHERE id = $1',
      [id]
    );

    if (themeResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tema não encontrado' 
      });
    }

    // Inserir ou atualizar voto
    await pool.query(`
      INSERT INTO party_theme_votes (theme_id, user_id, vote_type)
      VALUES ($1, $2, $3)
      ON CONFLICT (theme_id, user_id) 
      DO UPDATE SET vote_type = $3, created_at = CURRENT_TIMESTAMP
    `, [id, user_id, vote_type]);

    // Retornar dados atualizados do tema
    const result = await pool.query(`
      SELECT 
        pt.*,
        u.nome as autor_nome,
        u.avatar_url as autor_avatar,
        COUNT(CASE WHEN ptv.vote_type = 'positive' THEN 1 END)::int as positive_votes,
        COUNT(CASE WHEN ptv.vote_type = 'negative' THEN 1 END)::int as negative_votes
      FROM party_themes pt
      LEFT JOIN users u ON pt.autor_id = u.id
      LEFT JOIN party_theme_votes ptv ON pt.id = ptv.theme_id
      WHERE pt.id = $1
      GROUP BY pt.id, u.nome, u.avatar_url
    `, [id]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erro ao votar no tema:', error);
    res.status(500).json({ success: false, error: 'Erro ao votar no tema' });
  }
};

export const removeVotePartyTheme = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user_id = req.user?.userId;

    await pool.query(
      'DELETE FROM party_theme_votes WHERE theme_id = $1 AND user_id = $2',
      [id, user_id]
    );

    // Retornar dados atualizados do tema
    const result = await pool.query(`
      SELECT 
        pt.*,
        u.nome as autor_nome,
        u.avatar_url as autor_avatar,
        COUNT(CASE WHEN ptv.vote_type = 'positive' THEN 1 END)::int as positive_votes,
        COUNT(CASE WHEN ptv.vote_type = 'negative' THEN 1 END)::int as negative_votes
      FROM party_themes pt
      LEFT JOIN users u ON pt.autor_id = u.id
      LEFT JOIN party_theme_votes ptv ON pt.id = ptv.theme_id
      WHERE pt.id = $1
      GROUP BY pt.id, u.nome, u.avatar_url
    `, [id]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erro ao remover voto:', error);
    res.status(500).json({ success: false, error: 'Erro ao remover voto' });
  }
};

export const getUserVotes = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.userId;

    const result = await pool.query(
      'SELECT theme_id, vote_type FROM party_theme_votes WHERE user_id = $1',
      [user_id]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar votos do usuário:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar votos' });
  }
};

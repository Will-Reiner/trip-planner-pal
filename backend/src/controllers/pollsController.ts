import { Request, Response } from 'express';
import pool from '../config/database';

interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
  };
}

export const getAllPolls = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT id, titulo, tipo, created_at
      FROM polls
      ORDER BY id ASC
    `);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar polls:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar polls' });
  }
};

export const getMyVotes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Não autenticado' });
    }

    const result = await pool.query(`
      SELECT poll_id, resposta
      FROM poll_votes
      WHERE user_id = $1
    `, [userId]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar votos do usuário:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar votos' });
  }
};

export const voteOnPoll = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { resposta } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Não autenticado' });
    }

    if (!resposta) {
      return res.status(400).json({ 
        success: false, 
        error: 'Resposta é obrigatória' 
      });
    }

    // Verify poll exists
    const pollCheck = await pool.query('SELECT id FROM polls WHERE id = $1', [id]);
    if (pollCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Poll não encontrada' });
    }

    // Upsert vote
    const result = await pool.query(`
      INSERT INTO poll_votes (poll_id, user_id, resposta)
      VALUES ($1, $2, $3)
      ON CONFLICT (poll_id, user_id) 
      DO UPDATE SET resposta = $3, created_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [id, userId, resposta]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erro ao votar na poll:', error);
    res.status(500).json({ success: false, error: 'Erro ao votar' });
  }
};

export const removeVote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Não autenticado' });
    }

    await pool.query(`
      DELETE FROM poll_votes
      WHERE poll_id = $1 AND user_id = $2
    `, [id, userId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover voto:', error);
    res.status(500).json({ success: false, error: 'Erro ao remover voto' });
  }
};

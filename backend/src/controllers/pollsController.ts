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

export const getAdminResults = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Acesso negado. Apenas administradores.' });
    }

    // Get all polls with their votes
    const result = await pool.query(`
      SELECT 
        p.id as poll_id,
        p.titulo,
        p.tipo,
        pv.resposta,
        COUNT(pv.id)::int as vote_count,
        json_agg(
          json_build_object(
            'user_id', u.id,
            'user_nome', u.nome,
            'created_at', pv.created_at
          ) ORDER BY pv.created_at DESC
        ) as voters
      FROM polls p
      LEFT JOIN poll_votes pv ON p.id = pv.poll_id
      LEFT JOIN users u ON pv.user_id = u.id
      GROUP BY p.id, p.titulo, p.tipo, pv.resposta
      ORDER BY p.id, pv.resposta
    `);

    // Transform data into structured format
    const pollsMap = new Map();
    
    result.rows.forEach(row => {
      if (!pollsMap.has(row.poll_id)) {
        pollsMap.set(row.poll_id, {
          id: row.poll_id,
          titulo: row.titulo,
          tipo: row.tipo,
          results: []
        });
      }
      
      if (row.resposta) {
        pollsMap.get(row.poll_id).results.push({
          resposta: row.resposta,
          vote_count: row.vote_count,
          voters: row.voters
        });
      }
    });

    const polls = Array.from(pollsMap.values());
    
    res.json({ success: true, data: polls });
  } catch (error) {
    console.error('Erro ao buscar resultados admin:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar resultados' });
  }
};

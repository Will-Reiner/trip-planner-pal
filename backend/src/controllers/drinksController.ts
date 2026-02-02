import { Request, Response } from 'express';
import pool from '../config/database';

// GET /drinks - Buscar todas as bebidas com criador e participantes
export const getAllDrinks = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        d.*,
        u.nome as created_by_nome,
        COALESCE(
          json_agg(
            json_build_object(
              'user_id', udp.user_id,
              'user_nome', participant.nome
            ) ORDER BY udp.joined_at
          ) FILTER (WHERE udp.user_id IS NOT NULL),
          '[]'
        ) as participants
      FROM drinks_poll d
      LEFT JOIN users u ON d.created_by = u.id
      LEFT JOIN user_drink_participants udp ON d.id = udp.drink_id
      LEFT JOIN users participant ON udp.user_id = participant.id
      GROUP BY d.id, u.nome
      ORDER BY 
        d.categoria,
        (SELECT COUNT(*) FROM user_drink_participants WHERE drink_id = d.id) DESC,
        d.created_at DESC
    `);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar bebidas:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar bebidas' });
  }
};

// GET /drinks/category/:category - Buscar bebidas por categoria
export const getDrinksByCategory = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    
    if (!['alc', 'non-alc'].includes(category)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Categoria inválida. Use: alc ou non-alc' 
      });
    }
    
    const result = await pool.query(`
      SELECT 
        d.*,
        u.nome as created_by_nome,
        COALESCE(
          json_agg(
            json_build_object(
              'user_id', udp.user_id,
              'user_nome', participant.nome
            ) ORDER BY udp.joined_at
          ) FILTER (WHERE udp.user_id IS NOT NULL),
          '[]'
        ) as participants
      FROM drinks_poll d
      LEFT JOIN users u ON d.created_by = u.id
      LEFT JOIN user_drink_participants udp ON d.id = udp.drink_id
      LEFT JOIN users participant ON udp.user_id = participant.id
      WHERE d.categoria = $1
      GROUP BY d.id, u.nome
      ORDER BY 
        (SELECT COUNT(*) FROM user_drink_participants WHERE drink_id = d.id) DESC,
        d.created_at DESC
    `, [category]);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar bebidas por categoria:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar bebidas' });
  }
};

// POST /drinks - Criar nova bebida
export const createDrink = async (req: Request, res: Response) => {
  try {
    const { categoria, nome_bebida, emoji, created_by } = req.body;
    
    if (!categoria || !nome_bebida || !emoji || !created_by) {
      return res.status(400).json({ 
        success: false, 
        error: 'Categoria, nome da bebida, emoji e criador são obrigatórios' 
      });
    }
    
    if (!['alc', 'non-alc'].includes(categoria)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Categoria inválida. Use: alc ou non-alc' 
      });
    }
    
    const result = await pool.query(
      'INSERT INTO drinks_poll (categoria, nome_bebida, emoji, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [categoria, nome_bebida, emoji, created_by]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Erro ao criar bebida:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({ 
        success: false, 
        error: 'Esta bebida já existe nesta categoria' 
      });
    }
    
    res.status(500).json({ success: false, error: 'Erro ao criar bebida' });
  }
};

// POST /drinks/:id/join - Entrar no racha de uma bebida
export const joinDrink = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'user_id é obrigatório' 
      });
    }
    
    // Verificar se a bebida existe
    const drinkCheck = await pool.query('SELECT id FROM drinks_poll WHERE id = $1', [id]);
    if (drinkCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Bebida não encontrada' });
    }
    
    // Tentar adicionar participante (se já existe, o UNIQUE vai ignorar)
    await pool.query(
      'INSERT INTO user_drink_participants (user_id, drink_id) VALUES ($1, $2) ON CONFLICT (user_id, drink_id) DO NOTHING',
      [user_id, id]
    );
    
    res.json({ 
      success: true, 
      message: 'Você entrou no racha desta bebida!'
    });
  } catch (error) {
    console.error('Erro ao entrar no racha:', error);
    res.status(500).json({ success: false, error: 'Erro ao entrar no racha' });
  }
};

// DELETE /drinks/:id/leave - Sair do racha de uma bebida
export const leaveDrink = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'user_id é obrigatório' 
      });
    }
    
    const result = await pool.query(
      'DELETE FROM user_drink_participants WHERE user_id = $1 AND drink_id = $2 RETURNING *',
      [user_id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Você não está no racha desta bebida' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Você saiu do racha desta bebida'
    });
  } catch (error) {
    console.error('Erro ao sair do racha:', error);
    res.status(500).json({ success: false, error: 'Erro ao sair do racha' });
  }
};

// DELETE /drinks/:id - Deletar bebida (apenas criador ou admin)
export const deleteDrink = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const user = (req as any).user; // Do middleware authenticateToken
    
    await client.query('BEGIN');
    
    // Buscar a bebida
    const drinkResult = await client.query('SELECT * FROM drinks_poll WHERE id = $1', [id]);
    
    if (drinkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Bebida não encontrada' });
    }
    
    const drink = drinkResult.rows[0];
    
    // Verificar se o usuário é o criador ou admin
    if (drink.created_by !== user.userId && user.role !== 'admin') {
      await client.query('ROLLBACK');
      return res.status(403).json({ 
        success: false, 
        error: 'Apenas o criador ou administradores podem deletar esta bebida' 
      });
    }
    
    // Deletar participantes (CASCADE já faria isso, mas sendo explícito)
    await client.query('DELETE FROM user_drink_participants WHERE drink_id = $1', [id]);
    
    // Deletar a bebida
    await client.query('DELETE FROM drinks_poll WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    
    res.json({ 
      success: true, 
      message: 'Bebida deletada com sucesso'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao deletar bebida:', error);
    res.status(500).json({ success: false, error: 'Erro ao deletar bebida' });
  } finally {
    client.release();
  }
};

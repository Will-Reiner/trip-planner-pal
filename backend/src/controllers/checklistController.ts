import { Request, Response } from 'express';
import pool from '../config/database';

export const getAllChecklist = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        u.nome as owner_nome,
        u.avatar_url as owner_avatar
      FROM checklist c
      LEFT JOIN users u ON c.owner_id = u.id
      ORDER BY c.completed, c.categoria, c.created_at
    `);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar checklist:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar checklist' });
  }
};

export const getChecklistByCategory = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    
    if (!['item', 'tarefa', 'nao_esqueca'].includes(category)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Categoria inválida. Use: item, tarefa ou nao_esqueca' 
      });
    }
    
    const result = await pool.query(`
      SELECT 
        c.*,
        u.nome as owner_nome,
        u.avatar_url as owner_avatar
      FROM checklist c
      LEFT JOIN users u ON c.owner_id = u.id
      WHERE c.categoria = $1
      ORDER BY c.completed, c.created_at
    `, [category]);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar checklist por categoria:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar checklist' });
  }
};

export const createChecklistItem = async (req: Request, res: Response) => {
  try {
    const { categoria, descricao, owner_id } = req.body;
    
    if (!categoria || !descricao) {
      return res.status(400).json({ 
        success: false, 
        error: 'Categoria e descrição são obrigatórios' 
      });
    }
    
    if (!['item', 'tarefa', 'nao_esqueca'].includes(categoria)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Categoria inválida. Use: item, tarefa ou nao_esqueca' 
      });
    }
    
    const result = await pool.query(
      'INSERT INTO checklist (categoria, descricao, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [categoria, descricao, owner_id]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erro ao criar item da checklist:', error);
    res.status(500).json({ success: false, error: 'Erro ao criar item da checklist' });
  }
};

export const updateChecklistItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { descricao, completed, owner_id } = req.body;
    
    const result = await pool.query(
      `UPDATE checklist 
       SET descricao = COALESCE($1, descricao),
           completed = COALESCE($2, completed),
           owner_id = COALESCE($3, owner_id)
       WHERE id = $4
       RETURNING *`,
      [descricao, completed, owner_id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Item não encontrado' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar item da checklist:', error);
    res.status(500).json({ success: false, error: 'Erro ao atualizar item' });
  }
};

export const deleteChecklistItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM checklist WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Item não encontrado' });
    }
    
    res.json({ 
      success: true, 
      message: 'Item deletado com sucesso',
      data: result.rows[0] 
    });
  } catch (error) {
    console.error('Erro ao deletar item da checklist:', error);
    res.status(500).json({ success: false, error: 'Erro ao deletar item' });
  }
};

// Reivindicar propriedade de um item da checklist
export const claimChecklistItem = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'user_id é obrigatório' 
      });
    }
    
    await client.query('BEGIN');
    
    // Verificar se o item está disponível
    const checkResult = await client.query(
      'SELECT owner_id FROM checklist WHERE id = $1 FOR UPDATE',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Item não encontrado' });
    }
    
    if (checkResult.rows[0].owner_id !== null) {
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        success: false, 
        error: 'Este item já tem um responsável' 
      });
    }
    
    // Atribuir responsável
    const result = await client.query(
      'UPDATE checklist SET owner_id = $1 WHERE id = $2 RETURNING *',
      [user_id, id]
    );
    
    await client.query('COMMIT');
    
    res.json({ 
      success: true, 
      message: 'Item reivindicado com sucesso',
      data: result.rows[0] 
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao reivindicar item:', error);
    res.status(500).json({ success: false, error: 'Erro ao reivindicar item' });
  } finally {
    client.release();
  }
};

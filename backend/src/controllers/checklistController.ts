import { Request, Response } from 'express';
import pool from '../config/database';

type AuthenticatedRequest = Request & { user?: { userId: number; role: string } };

export const getAllChecklist = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;
    
    const result = await pool.query(`
      SELECT 
        c.*,
        u.nome as owner_nome,
        u.avatar_url as owner_avatar,
        creator.nome as created_by_nome,
        CASE 
          WHEN c.categoria = 'nao_esqueca' AND $1::INTEGER IS NOT NULL 
          THEN EXISTS(
            SELECT 1 FROM user_checklist_checked 
            WHERE checklist_id = c.id AND user_id = $1 AND checked = TRUE
          )
          ELSE c.completed 
        END as is_checked_by_user
      FROM checklist c
      LEFT JOIN users u ON c.owner_id = u.id
      LEFT JOIN users creator ON c.created_by_id = creator.id
      ORDER BY c.completed, c.categoria, c.created_at
    `, [user_id || null]);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar checklist:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar checklist' });
  }
};

export const getChecklistByCategory = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const { user_id } = req.query;
    
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
        u.avatar_url as owner_avatar,
        CASE 
          WHEN c.categoria = 'nao_esqueca' AND $2::INTEGER IS NOT NULL 
          THEN EXISTS(
            SELECT 1 FROM user_checklist_checked 
            WHERE checklist_id = c.id AND user_id = $2 AND checked = TRUE
          )
          ELSE c.completed 
        END as is_checked_by_user
      FROM checklist c
      LEFT JOIN users u ON c.owner_id = u.id
      WHERE c.categoria = $1
      ORDER BY c.completed, c.created_at
    `, [category, user_id || null]);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar checklist por categoria:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar checklist' });
  }
};

export const createChecklistItem = async (req: Request, res: Response) => {
  try {
    const { categoria, descricao, owner_id, created_by_id } = req.body;
    
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
      'INSERT INTO checklist (categoria, descricao, owner_id, created_by_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [categoria, descricao, owner_id, created_by_id]
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
    const userId = (req as AuthenticatedRequest).user?.userId;
    const userRole = (req as AuthenticatedRequest).user?.role;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Token não fornecido' });
    }
    
    // Verificar se o item existe e quem criou
    const checkResult = await pool.query(
      'SELECT created_by_id, categoria FROM checklist WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Item não encontrado' });
    }
    
    const categoria = checkResult.rows[0].categoria as string;
    const createdById = checkResult.rows[0].created_by_id as number | null;

    if (categoria === 'item' || categoria === 'tarefa') {
      if (userRole !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          error: 'Apenas administradores podem deletar este item' 
        });
      }
    } else if (categoria === 'nao_esqueca') {
      if (userRole !== 'admin') {
        if (!createdById || createdById !== userId) {
          return res.status(403).json({ 
            success: false, 
            error: 'Apenas quem criou o item pode deletá-lo' 
          });
        }
      }
    }
    
    const result = await pool.query(
      'DELETE FROM checklist WHERE id = $1 RETURNING *',
      [id]
    );
    
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
    
    // Se user_id for null ou undefined, remover responsabilidade
    if (user_id === null || user_id === undefined) {
      await client.query(
        'UPDATE checklist SET owner_id = NULL WHERE id = $1',
        [id]
      );
      return res.json({ success: true, message: 'Responsabilidade removida' });
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

// Toggle individual do checklist (para essenciais - categoria 'nao_esqueca')
export const toggleUserChecklistItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'user_id é obrigatório' 
      });
    }
    
    // Verificar se já existe um registro
    const existingCheck = await pool.query(
      'SELECT * FROM user_checklist_checked WHERE user_id = $1 AND checklist_id = $2',
      [user_id, id]
    );
    
    if (existingCheck.rows.length > 0) {
      // Toggle o estado
      const newCheckedState = !existingCheck.rows[0].checked;
      await pool.query(
        'UPDATE user_checklist_checked SET checked = $1, checked_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND checklist_id = $3',
        [newCheckedState, user_id, id]
      );
      res.json({ 
        success: true, 
        checked: newCheckedState,
        message: newCheckedState ? 'Item marcado' : 'Item desmarcado'
      });
    } else {
      // Criar novo registro
      await pool.query(
        'INSERT INTO user_checklist_checked (user_id, checklist_id, checked) VALUES ($1, $2, TRUE)',
        [user_id, id]
      );
      res.json({ 
        success: true, 
        checked: true,
        message: 'Item marcado'
      });
    }
    
  } catch (error) {
    console.error('Erro ao toggle checklist item:', error);
    res.status(500).json({ success: false, error: 'Erro ao atualizar item' });
  }
};

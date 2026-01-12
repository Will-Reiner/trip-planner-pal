import { Request, Response } from 'express';
import pool from '../config/database';

export const getAllMeals = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.*,
        c.nome as cook_nome,
        c.avatar_url as cook_avatar,
        d1.nome as dishwasher1_nome,
        d1.avatar_url as dishwasher1_avatar,
        d2.nome as dishwasher2_nome,
        d2.avatar_url as dishwasher2_avatar
      FROM meals m
      LEFT JOIN users c ON m.cook_id = c.id
      LEFT JOIN users d1 ON m.dishwasher1_id = d1.id
      LEFT JOIN users d2 ON m.dishwasher2_id = d2.id
      ORDER BY m.data, 
        CASE m.tipo_refeicao 
          WHEN 'cafe' THEN 1 
          WHEN 'almoco' THEN 2 
          WHEN 'jantar' THEN 3 
        END
    `);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar refeições:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar refeições' });
  }
};

export const getMealById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        m.*,
        c.nome as cook_nome,
        c.avatar_url as cook_avatar,
        d1.nome as dishwasher1_nome,
        d1.avatar_url as dishwasher1_avatar,
        d2.nome as dishwasher2_nome,
        d2.avatar_url as dishwasher2_avatar
      FROM meals m
      LEFT JOIN users c ON m.cook_id = c.id
      LEFT JOIN users d1 ON m.dishwasher1_id = d1.id
      LEFT JOIN users d2 ON m.dishwasher2_id = d2.id
      WHERE m.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Refeição não encontrada' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar refeição:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar refeição' });
  }
};

export const createMeal = async (req: Request, res: Response) => {
  try {
    const { data, tipo_refeicao, ingredientes, cook_id, dishwasher1_id, dishwasher2_id } = req.body;
    
    if (!data || !tipo_refeicao) {
      return res.status(400).json({ 
        success: false, 
        error: 'Data e tipo de refeição são obrigatórios' 
      });
    }
    
    if (!['cafe', 'almoco', 'jantar'].includes(tipo_refeicao)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tipo de refeição inválido. Use: cafe, almoco ou jantar' 
      });
    }
    
    const result = await pool.query(
      `INSERT INTO meals (data, tipo_refeicao, ingredientes, cook_id, dishwasher1_id, dishwasher2_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [data, tipo_refeicao, ingredientes, cook_id, dishwasher1_id, dishwasher2_id]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Erro ao criar refeição:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({ 
        success: false, 
        error: 'Já existe uma refeição deste tipo nesta data' 
      });
    }
    
    res.status(500).json({ success: false, error: 'Erro ao criar refeição' });
  }
};

// Rota PATCH /claim-role - Preencher vagas vazias em refeições
export const claimRole = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { meal_id, role, user_id } = req.body;
    
    if (!meal_id || !role || !user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'meal_id, role e user_id são obrigatórios' 
      });
    }
    
    if (!['cook', 'dishwasher1', 'dishwasher2'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Role inválido. Use: cook, dishwasher1 ou dishwasher2' 
      });
    }
    
    await client.query('BEGIN');
    
    // Verificar se a vaga está disponível
    const checkQuery = `SELECT ${role}_id FROM meals WHERE id = $1 FOR UPDATE`;
    const checkResult = await client.query(checkQuery, [meal_id]);
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Refeição não encontrada' });
    }
    
    const roleIdField = `${role}_id`;
    if (checkResult.rows[0][roleIdField] !== null) {
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        success: false, 
        error: 'Esta vaga já está preenchida' 
      });
    }
    
    // Preencher a vaga
    const updateQuery = `
      UPDATE meals 
      SET ${role}_id = $1 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await client.query(updateQuery, [user_id, meal_id]);
    
    await client.query('COMMIT');
    
    res.json({ 
      success: true, 
      message: 'Vaga preenchida com sucesso',
      data: result.rows[0] 
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao preencher vaga:', error);
    res.status(500).json({ success: false, error: 'Erro ao preencher vaga' });
  } finally {
    client.release();
  }
};

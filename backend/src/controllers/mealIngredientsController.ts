import { Request, Response } from 'express';
import pool from '../config/database';

export const addIngredientToMeal = async (req: Request, res: Response) => {
  try {
    const { meal_id, ingredient_id, quantidade_necessaria } = req.body;
    
    if (!meal_id || !ingredient_id || !quantidade_necessaria) {
      return res.status(400).json({ 
        success: false, 
        error: 'meal_id, ingredient_id e quantidade_necessaria são obrigatórios' 
      });
    }
    
    const result = await pool.query(
      `INSERT INTO meal_ingredients (meal_id, ingredient_id, quantidade_necessaria)
       VALUES ($1, $2, $3)
       ON CONFLICT (meal_id, ingredient_id) 
       DO UPDATE SET quantidade_necessaria = $3
       RETURNING *`,
      [meal_id, ingredient_id, quantidade_necessaria]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erro ao adicionar ingrediente à refeição:', error);
    res.status(500).json({ success: false, error: 'Erro ao adicionar ingrediente' });
  }
};

export const removeIngredientFromMeal = async (req: Request, res: Response) => {
  try {
    const { meal_id, ingredient_id } = req.body;
    
    if (!meal_id || !ingredient_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'meal_id e ingredient_id são obrigatórios' 
      });
    }
    
    const result = await pool.query(
      `DELETE FROM meal_ingredients 
       WHERE meal_id = $1 AND ingredient_id = $2
       RETURNING *`,
      [meal_id, ingredient_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Vínculo não encontrado' });
    }
    
    res.json({ success: true, message: 'Ingrediente removido da refeição' });
  } catch (error) {
    console.error('Erro ao remover ingrediente:', error);
    res.status(500).json({ success: false, error: 'Erro ao remover ingrediente' });
  }
};

export const getMealIngredients = async (req: Request, res: Response) => {
  try {
    const { mealId } = req.params;
    
    const result = await pool.query(
      `SELECT 
        mi.id,
        mi.meal_id,
        mi.ingredient_id,
        mi.quantidade_necessaria,
        m.nome as ingredient_nome,
        m.categoria,
        m.quantidade as quantidade_total,
        m.unidade,
        m.comprado,
        m.responsavel_id,
        u.nome as responsavel_nome,
        u.avatar_url as responsavel_avatar
      FROM meal_ingredients mi
      JOIN market_items m ON mi.ingredient_id = m.id
      LEFT JOIN users u ON m.responsavel_id = u.id
      WHERE mi.meal_id = $1
      ORDER BY m.categoria, m.nome`,
      [mealId]
    );
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar ingredientes da refeição:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar ingredientes' });
  }
};

export const getIngredientMeals = async (req: Request, res: Response) => {
  try {
    const { ingredientId } = req.params;
    
    const result = await pool.query(
      `SELECT 
        mi.id,
        mi.meal_id,
        mi.ingredient_id,
        mi.quantidade_necessaria,
        m.data,
        m.tipo_refeicao,
        m.nome_refeicao
      FROM meal_ingredients mi
      JOIN meals m ON mi.meal_id = m.id
      WHERE mi.ingredient_id = $1
      ORDER BY m.data, m.tipo_refeicao`,
      [ingredientId]
    );
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar refeições do ingrediente:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar refeições' });
  }
};

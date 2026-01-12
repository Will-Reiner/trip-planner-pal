import { Request, Response } from 'express';
import pool from '../config/database';

export const getAllDrinks = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM drinks_poll ORDER BY categoria, votos DESC'
    );
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar bebidas:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar bebidas' });
  }
};

export const getDrinksByCategory = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    
    if (!['alc', 'non-alc'].includes(category)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Categoria inválida. Use: alc ou non-alc' 
      });
    }
    
    const result = await pool.query(
      'SELECT * FROM drinks_poll WHERE categoria = $1 ORDER BY votos DESC',
      [category]
    );
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar bebidas por categoria:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar bebidas' });
  }
};

export const createDrink = async (req: Request, res: Response) => {
  try {
    const { categoria, nome_bebida, votos = 0 } = req.body;
    
    if (!categoria || !nome_bebida) {
      return res.status(400).json({ 
        success: false, 
        error: 'Categoria e nome da bebida são obrigatórios' 
      });
    }
    
    if (!['alc', 'non-alc'].includes(categoria)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Categoria inválida. Use: alc ou non-alc' 
      });
    }
    
    const result = await pool.query(
      'INSERT INTO drinks_poll (categoria, nome_bebida, votos) VALUES ($1, $2, $3) RETURNING *',
      [categoria, nome_bebida, votos]
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

// Rota POST /vote - Incrementar votos de bebidas
export const voteDrink = async (req: Request, res: Response) => {
  try {
    const { drink_id } = req.body;
    
    if (!drink_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'drink_id é obrigatório' 
      });
    }
    
    const result = await pool.query(
      'UPDATE drinks_poll SET votos = votos + 1 WHERE id = $1 RETURNING *',
      [drink_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Bebida não encontrada' });
    }
    
    res.json({ 
      success: true, 
      message: 'Voto computado com sucesso',
      data: result.rows[0] 
    });
  } catch (error) {
    console.error('Erro ao votar em bebida:', error);
    res.status(500).json({ success: false, error: 'Erro ao votar em bebida' });
  }
};

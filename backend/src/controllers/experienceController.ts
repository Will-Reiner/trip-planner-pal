import { Request, Response } from 'express';
import pool from '../config/database';

export const getAllExperiences = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.*,
        u.nome as autor_nome,
        u.avatar_url as autor_avatar
      FROM experience e
      LEFT JOIN users u ON e.autor_id = u.id
      ORDER BY e.votos DESC, e.created_at DESC
    `);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar experiências:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar experiências' });
  }
};

export const getExperiencesByType = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    
    if (!['frase', 'tema_festa'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tipo inválido. Use: frase ou tema_festa' 
      });
    }
    
    const result = await pool.query(`
      SELECT 
        e.*,
        u.nome as autor_nome,
        u.avatar_url as autor_avatar
      FROM experience e
      LEFT JOIN users u ON e.autor_id = u.id
      WHERE e.tipo = $1
      ORDER BY e.votos DESC, e.created_at DESC
    `, [type]);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar experiências por tipo:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar experiências' });
  }
};

export const createExperience = async (req: Request, res: Response) => {
  try {
    const { tipo, conteudo, autor_id } = req.body;
    
    if (!tipo || !conteudo) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tipo e conteúdo são obrigatórios' 
      });
    }
    
    if (!['frase', 'tema_festa'].includes(tipo)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tipo inválido. Use: frase ou tema_festa' 
      });
    }
    
    const result = await pool.query(
      'INSERT INTO experience (tipo, conteudo, autor_id, votos) VALUES ($1, $2, $3, 0) RETURNING *',
      [tipo, conteudo, autor_id]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erro ao criar experiência:', error);
    res.status(500).json({ success: false, error: 'Erro ao criar experiência' });
  }
};

// Rota POST /vote - Incrementar votos de temas de festa
export const voteExperience = async (req: Request, res: Response) => {
  try {
    const { experience_id } = req.body;
    
    if (!experience_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'experience_id é obrigatório' 
      });
    }
    
    const result = await pool.query(
      'UPDATE experience SET votos = votos + 1 WHERE id = $1 RETURNING *',
      [experience_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Experiência não encontrada' });
    }
    
    res.json({ 
      success: true, 
      message: 'Voto computado com sucesso',
      data: result.rows[0] 
    });
  } catch (error) {
    console.error('Erro ao votar em experiência:', error);
    res.status(500).json({ success: false, error: 'Erro ao votar em experiência' });
  }
};

import { Request, Response } from 'express';
import pool from '../config/database';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, nome, avatar_url, titulo_engracado, created_at FROM users ORDER BY nome'
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar usuários' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, nome, avatar_url, titulo_engracado, created_at FROM users WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar usuário' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { nome, avatar_url, titulo_engracado } = req.body;
    
    if (!nome) {
      return res.status(400).json({ success: false, error: 'Nome é obrigatório' });
    }
    
    const result = await pool.query(
      'INSERT INTO users (nome, avatar_url, titulo_engracado) VALUES ($1, $2, $3) RETURNING *',
      [nome, avatar_url, titulo_engracado]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ success: false, error: 'Erro ao criar usuário' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, avatar_url, titulo_engracado } = req.body;
    
    const result = await pool.query(
      `UPDATE users 
       SET nome = COALESCE($1, nome),
           avatar_url = COALESCE($2, avatar_url),
           titulo_engracado = COALESCE($3, titulo_engracado)
       WHERE id = $4
       RETURNING *`,
      [nome, avatar_url, titulo_engracado, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ success: false, error: 'Erro ao atualizar usuário' });
  }
};

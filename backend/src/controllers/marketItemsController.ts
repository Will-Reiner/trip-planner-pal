import { Request, Response } from 'express';
import pool from '../config/database';

export const getAllMarketItems = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        mi.*,
        resp.nome as responsavel_nome,
        resp.avatar_url as responsavel_avatar,
        adder.nome as adicionado_por_nome,
        adder.avatar_url as adicionado_por_avatar
      FROM market_items mi
      LEFT JOIN users resp ON mi.responsavel_id = resp.id
      LEFT JOIN users adder ON mi.adicionado_por_id = adder.id
      ORDER BY mi.categoria, mi.comprado, mi.nome
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar itens do mercado:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar itens do mercado' });
  }
};

export const getMarketItemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        mi.*,
        resp.nome as responsavel_nome,
        resp.avatar_url as responsavel_avatar,
        adder.nome as adicionado_por_nome,
        adder.avatar_url as adicionado_por_avatar
      FROM market_items mi
      LEFT JOIN users resp ON mi.responsavel_id = resp.id
      LEFT JOIN users adder ON mi.adicionado_por_id = adder.id
      WHERE mi.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Item não encontrado' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar item:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar item' });
  }
};

export const createMarketItem = async (req: Request, res: Response) => {
  try {
    const { 
      nome_item, 
      categoria, 
      quantidade, 
      unidade_medida, 
      valor_por_porcao, 
      tamanho_porcao,
      responsavel_id,
      adicionado_por_id,
      observacoes
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO market_items 
       (nome, categoria, quantidade, unidade, valor_por_porcao, tamanho_porcao, responsavel_id, adicionado_por_id, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [nome_item, categoria, quantidade, unidade_medida, valor_por_porcao, tamanho_porcao, responsavel_id, adicionado_por_id, observacoes]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erro ao criar item:', error);
    res.status(500).json({ success: false, error: 'Erro ao criar item' });
  }
};

export const updateMarketItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      nome, 
      categoria, 
      quantidade, 
      unidade, 
      valor_por_porcao, 
      tamanho_porcao,
      responsavel_id,
      observacoes,
      comprado
    } = req.body;
    
    const result = await pool.query(
      `UPDATE market_items 
       SET nome = COALESCE($1, nome),
           categoria = COALESCE($2, categoria),
           quantidade = COALESCE($3, quantidade),
           unidade = COALESCE($4, unidade),
           valor_por_porcao = COALESCE($5, valor_por_porcao),
           tamanho_porcao = COALESCE($6, tamanho_porcao),
           responsavel_id = COALESCE($7, responsavel_id),
           observacoes = COALESCE($8, observacoes),
           comprado = COALESCE($9, comprado)
       WHERE id = $10
       RETURNING *`,
      [nome, categoria, quantidade, unidade, valor_por_porcao, tamanho_porcao, responsavel_id, observacoes, comprado, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Item não encontrado' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar item:', error);
    res.status(500).json({ success: false, error: 'Erro ao atualizar item' });
  }
};

export const deleteMarketItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM market_items WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Item não encontrado' });
    }
    
    res.json({ success: true, message: 'Item removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover item:', error);
    res.status(500).json({ success: false, error: 'Erro ao remover item' });
  }
};

export const toggleComprado = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE market_items 
       SET comprado = NOT comprado
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Item não encontrado' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar status do item:', error);
    res.status(500).json({ success: false, error: 'Erro ao atualizar status do item' });
  }
};

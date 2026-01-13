import { Request, Response } from 'express';
import pool from '../config/database';

// ============= RIDES =============

export const getAllRides = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.*,
        m.nome as motorista_nome,
        m.avatar_url as motorista_avatar,
        json_agg(
          json_build_object(
            'id', rp.id,
            'user_id', rp.user_id,
            'user_nome', u.nome,
            'user_avatar', u.avatar_url,
            'contribuicao', rp.contribuicao,
            'pagamento_confirmado', rp.pagamento_confirmado
          )
        ) FILTER (WHERE rp.id IS NOT NULL) as passageiros
      FROM rides r
      LEFT JOIN users m ON r.motorista_id = m.id
      LEFT JOIN ride_passengers rp ON r.id = rp.ride_id
      LEFT JOIN users u ON rp.user_id = u.id
      GROUP BY r.id, m.nome, m.avatar_url
      ORDER BY r.data_viagem DESC NULLS LAST, r.created_at DESC
    `);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar caronas:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar caronas' });
  }
};

export const createRide = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { 
      titulo, 
      motorista_id, 
      origem, 
      destino, 
      data_viagem, 
      valor_gasolina, 
      distancia_km,
      passageiros 
    } = req.body;
    
    if (!titulo || !motorista_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'titulo e motorista_id são obrigatórios' 
      });
    }
    
    await client.query('BEGIN');
    
    let expense_id = null;
    
    // Se tem valor de gasolina, criar despesa automática
    if (valor_gasolina && valor_gasolina > 0) {
      const categoryResult = await client.query(
        "SELECT id FROM expense_categories WHERE nome = 'Gasolina' LIMIT 1"
      );
      
      if (categoryResult.rows.length > 0) {
        const expenseResult = await client.query(
          `INSERT INTO expenses (category_id, descricao, valor_total, pagador_id)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [categoryResult.rows[0].id, `Gasolina - ${titulo}`, valor_gasolina, motorista_id]
        );
        expense_id = expenseResult.rows[0].id;
      }
    }
    
    const rideResult = await client.query(
      `INSERT INTO rides (titulo, motorista_id, origem, destino, data_viagem, valor_gasolina, distancia_km, expense_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [titulo, motorista_id, origem, destino, data_viagem, valor_gasolina, distancia_km, expense_id]
    );
    
    const ride = rideResult.rows[0];
    
    // Adicionar passageiros
    if (passageiros && Array.isArray(passageiros) && passageiros.length > 0) {
      for (const p of passageiros) {
        await client.query(
          'INSERT INTO ride_passengers (ride_id, user_id, contribuicao) VALUES ($1, $2, $3)',
          [ride.id, p.user_id, p.contribuicao || null]
        );
        
        // Se criou despesa, adicionar passageiro na despesa também
        if (expense_id) {
          await client.query(
            'INSERT INTO expense_participants (expense_id, user_id, valor_individual) VALUES ($1, $2, $3)',
            [expense_id, p.user_id, p.contribuicao || null]
          );
        }
      }
    }
    
    await client.query('COMMIT');
    res.status(201).json({ success: true, data: ride });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar carona:', error);
    res.status(500).json({ success: false, error: 'Erro ao criar carona' });
  } finally {
    client.release();
  }
};

export const updateRide = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { titulo, origem, destino, data_viagem, valor_gasolina, distancia_km, passageiros } = req.body;
    
    await client.query('BEGIN');
    
    await client.query(
      `UPDATE rides 
       SET titulo = COALESCE($1, titulo),
           origem = COALESCE($2, origem),
           destino = COALESCE($3, destino),
           data_viagem = COALESCE($4, data_viagem),
           valor_gasolina = COALESCE($5, valor_gasolina),
           distancia_km = COALESCE($6, distancia_km),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7`,
      [titulo, origem, destino, data_viagem, valor_gasolina, distancia_km, id]
    );
    
    if (passageiros && Array.isArray(passageiros)) {
      await client.query('DELETE FROM ride_passengers WHERE ride_id = $1', [id]);
      
      for (const p of passageiros) {
        await client.query(
          'INSERT INTO ride_passengers (ride_id, user_id, contribuicao) VALUES ($1, $2, $3)',
          [id, p.user_id, p.contribuicao || null]
        );
      }
    }
    
    await client.query('COMMIT');
    res.json({ success: true, message: 'Carona atualizada' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar carona:', error);
    res.status(500).json({ success: false, error: 'Erro ao atualizar carona' });
  } finally {
    client.release();
  }
};

export const confirmRidePayment = async (req: Request, res: Response) => {
  try {
    const { ride_id, user_id } = req.body;
    
    if (!ride_id || !user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'ride_id e user_id são obrigatórios' 
      });
    }
    
    await pool.query(
      'UPDATE ride_passengers SET pagamento_confirmado = true WHERE ride_id = $1 AND user_id = $2',
      [ride_id, user_id]
    );
    
    res.json({ success: true, message: 'Pagamento da carona confirmado' });
  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error);
    res.status(500).json({ success: false, error: 'Erro ao confirmar pagamento' });
  }
};

export const deleteRide = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM rides WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Carona não encontrada' });
    }
    
    res.json({ success: true, message: 'Carona deletada' });
  } catch (error) {
    console.error('Erro ao deletar carona:', error);
    res.status(500).json({ success: false, error: 'Erro ao deletar carona' });
  }
};

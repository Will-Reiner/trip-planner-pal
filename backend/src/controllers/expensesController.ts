import { Request, Response } from 'express';
import type { PoolClient } from 'pg';
import pool from '../config/database';

const getOrCreateGasolinaCategoryId = async (client: PoolClient) => {
  const existing = await client.query(
    "SELECT id FROM expense_categories WHERE nome = 'Gasolina' LIMIT 1"
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id as number;
  }

  const created = await client.query(
    'INSERT INTO expense_categories (nome, icone, cor, is_system) VALUES ($1, $2, $3, true) RETURNING id',
    ['Gasolina', null, '#ef4444']
  );

  return created.rows[0].id as number;
};

const syncGasolinaExpenses = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const gasolinaCategoryId = await getOrCreateGasolinaCategoryId(client);

    const ridesResult = await client.query(
      `SELECT id, titulo, motorista_id, valor_gasolina, expense_id
       FROM rides
       WHERE valor_gasolina IS NOT NULL AND valor_gasolina > 0`
    );

    for (const ride of ridesResult.rows) {
      let expenseId = ride.expense_id as number | null;

      if (!expenseId) {
        const expenseResult = await client.query(
          `INSERT INTO expenses (category_id, descricao, valor_total, pagador_id)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [gasolinaCategoryId, `Gasolina - ${ride.titulo}`, ride.valor_gasolina, ride.motorista_id]
        );
        expenseId = expenseResult.rows[0].id as number;

        await client.query(
          'UPDATE rides SET expense_id = $1 WHERE id = $2',
          [expenseId, ride.id]
        );
      } else {
        await client.query(
          'UPDATE expenses SET descricao = $1, valor_total = $2 WHERE id = $3',
          [`Gasolina - ${ride.titulo}`, ride.valor_gasolina, expenseId]
        );
      }

      const passengersResult = await client.query(
        'SELECT user_id FROM ride_passengers WHERE ride_id = $1',
        [ride.id]
      );

      const totalPeople = passengersResult.rows.length + 1;
      const valorIndividual = Number(ride.valor_gasolina) / totalPeople;

      await client.query('DELETE FROM expense_participants WHERE expense_id = $1', [expenseId]);

      await client.query(
        'INSERT INTO expense_participants (expense_id, user_id, valor_individual) VALUES ($1, $2, $3)',
        [expenseId, ride.motorista_id, valorIndividual]
      );

      for (const passenger of passengersResult.rows) {
        await client.query(
          'INSERT INTO expense_participants (expense_id, user_id, valor_individual) VALUES ($1, $2, $3)',
          [expenseId, passenger.user_id, valorIndividual]
        );
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao sincronizar despesas de gasolina:', error);
  } finally {
    client.release();
  }
};

// ============= EXPENSE CATEGORIES =============

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM expense_categories ORDER BY is_system DESC, nome ASC'
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar categorias' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { nome, icone, cor } = req.body;
    
    if (!nome) {
      return res.status(400).json({ success: false, error: 'Nome é obrigatório' });
    }
    
    const result = await pool.query(
      'INSERT INTO expense_categories (nome, icone, cor, is_system) VALUES ($1, $2, $3, false) RETURNING *',
      [nome, icone, cor]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: unknown) {
    const errorCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? (error as { code?: string }).code
        : undefined;
    if (errorCode === '23505') {
      return res.status(409).json({ success: false, error: 'Categoria já existe' });
    }
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ success: false, error: 'Erro ao criar categoria' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const check = await pool.query('SELECT is_system FROM expense_categories WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Categoria não encontrada' });
    }
    
    if (check.rows[0].is_system) {
      return res.status(403).json({ success: false, error: 'Não é possível deletar categorias do sistema' });
    }
    
    await pool.query('DELETE FROM expense_categories WHERE id = $1', [id]);
    res.json({ success: true, message: 'Categoria deletada' });
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    res.status(500).json({ success: false, error: 'Erro ao deletar categoria' });
  }
};

// ============= EXPENSE ESTIMATES =============

export const getAllEstimates = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.*,
        c.nome as categoria_nome,
        c.icone as categoria_icone,
        c.cor as categoria_cor,
        u.nome as criado_por_nome,
        json_agg(
          json_build_object(
            'id', ep.id,
            'user_id', ep.user_id,
            'user_nome', pu.nome,
            'user_avatar', pu.avatar_url
          )
        ) FILTER (WHERE ep.id IS NOT NULL) as participantes
      FROM expense_estimates e
      LEFT JOIN expense_categories c ON e.category_id = c.id
      LEFT JOIN users u ON e.criado_por_id = u.id
      LEFT JOIN expense_estimate_participants ep ON e.id = ep.estimate_id
      LEFT JOIN users pu ON ep.user_id = pu.id
      GROUP BY e.id, c.nome, c.icone, c.cor, u.nome
      ORDER BY e.created_at DESC
    `);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar estimativas:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar estimativas' });
  }
};

export const createEstimate = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { category_id, descricao, valor_estimado, criado_por_id, participantes } = req.body;
    
    if (!category_id || !descricao || !valor_estimado) {
      return res.status(400).json({ 
        success: false, 
        error: 'category_id, descricao e valor_estimado são obrigatórios' 
      });
    }
    
    await client.query('BEGIN');
    
    const estimateResult = await client.query(
      `INSERT INTO expense_estimates (category_id, descricao, valor_estimado, criado_por_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [category_id, descricao, valor_estimado, criado_por_id]
    );
    
    const estimate = estimateResult.rows[0];
    
    if (participantes && Array.isArray(participantes) && participantes.length > 0) {
      for (const userId of participantes) {
        await client.query(
          'INSERT INTO expense_estimate_participants (estimate_id, user_id) VALUES ($1, $2)',
          [estimate.id, userId]
        );
      }
    }
    
    await client.query('COMMIT');
    res.status(201).json({ success: true, data: estimate });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar estimativa:', error);
    res.status(500).json({ success: false, error: 'Erro ao criar estimativa' });
  } finally {
    client.release();
  }
};

export const updateEstimate = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { descricao, valor_estimado, participantes } = req.body;
    
    await client.query('BEGIN');
    
    await client.query(
      `UPDATE expense_estimates 
       SET descricao = COALESCE($1, descricao),
           valor_estimado = COALESCE($2, valor_estimado),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [descricao, valor_estimado, id]
    );
    
    if (participantes && Array.isArray(participantes)) {
      await client.query('DELETE FROM expense_estimate_participants WHERE estimate_id = $1', [id]);

      const normalizedParticipants = participantes
        .map((participant: unknown) => {
          if (typeof participant === 'number') {
            return participant;
          }

          if (typeof participant === 'string') {
            const parsedUserId = Number(participant);
            return Number.isFinite(parsedUserId) ? parsedUserId : null;
          }

          if (typeof participant === 'object' && participant !== null) {
            const participantObj = participant as { user_id?: unknown };
            const rawUserId = participantObj.user_id;
            const userId =
              typeof rawUserId === 'number'
                ? rawUserId
                : typeof rawUserId === 'string'
                  ? Number(rawUserId)
                  : null;
            return userId !== null && Number.isFinite(userId) ? userId : null;
          }

          return null;
        })
        .filter((userId): userId is number => userId !== null);

      for (const userId of normalizedParticipants) {
        await client.query(
          'INSERT INTO expense_estimate_participants (estimate_id, user_id) VALUES ($1, $2)',
          [id, userId]
        );
      }
    }
    
    await client.query('COMMIT');
    res.json({ success: true, message: 'Estimativa atualizada' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar estimativa:', error);
    res.status(500).json({ success: false, error: 'Erro ao atualizar estimativa' });
  } finally {
    client.release();
  }
};

export const deleteEstimate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM expense_estimates WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Estimativa não encontrada' });
    }
    
    res.json({ success: true, message: 'Estimativa deletada' });
  } catch (error) {
    console.error('Erro ao deletar estimativa:', error);
    res.status(500).json({ success: false, error: 'Erro ao deletar estimativa' });
  }
};

// ============= EXPENSES (Real) =============

export const getAllExpenses = async (req: Request, res: Response) => {
  try {
    await syncGasolinaExpenses();
    const result = await pool.query(`
      SELECT 
        e.*,
        c.nome as categoria_nome,
        c.icone as categoria_icone,
        c.cor as categoria_cor,
        p.nome as pagador_nome,
        p.avatar_url as pagador_avatar,
        json_agg(
          json_build_object(
            'id', ep.id,
            'user_id', ep.user_id,
            'user_nome', u.nome,
            'user_avatar', u.avatar_url,
            'valor_individual', ep.valor_individual,
            'pagamento_confirmado', ep.pagamento_confirmado,
            'data_pagamento', ep.data_pagamento
          )
        ) FILTER (WHERE ep.id IS NOT NULL) as participantes
      FROM expenses e
      LEFT JOIN expense_categories c ON e.category_id = c.id
      LEFT JOIN users p ON e.pagador_id = p.id
      LEFT JOIN expense_participants ep ON e.id = ep.expense_id
      LEFT JOIN users u ON ep.user_id = u.id
      GROUP BY e.id, c.nome, c.icone, c.cor, p.nome, p.avatar_url
      ORDER BY e.data_despesa DESC
    `);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar despesas:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar despesas' });
  }
};

export const createExpense = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { category_id, descricao, valor_total, pagador_id, participantes } = req.body;
    
    if (!category_id || !descricao || !valor_total || !pagador_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'category_id, descricao, valor_total e pagador_id são obrigatórios' 
      });
    }
    
    await client.query('BEGIN');
    
    // Buscar estimate_id automaticamente pela categoria
    const estimateResult = await client.query(
      'SELECT id FROM expense_estimates WHERE category_id = $1 ORDER BY created_at DESC LIMIT 1',
      [category_id]
    );
    const estimate_id = estimateResult.rows.length > 0 ? estimateResult.rows[0].id : null;
    
    const expenseResult = await client.query(
      `INSERT INTO expenses (estimate_id, category_id, descricao, valor_total, pagador_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [estimate_id, category_id, descricao, valor_total, pagador_id]
    );
    
    const expense = expenseResult.rows[0];
    
    if (participantes && Array.isArray(participantes) && participantes.length > 0) {
      for (const p of participantes) {
        await client.query(
          `INSERT INTO expense_participants (expense_id, user_id, valor_individual)
           VALUES ($1, $2, $3)`,
          [expense.id, p.user_id, p.valor_individual || null]
        );
      }
    }
    
    await client.query('COMMIT');
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar despesa:', error);
    res.status(500).json({ success: false, error: 'Erro ao criar despesa' });
  } finally {
    client.release();
  }
};

export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const { expense_id, user_id } = req.body;
    
    if (!expense_id || !user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'expense_id e user_id são obrigatórios' 
      });
    }
    
    await pool.query(
      `UPDATE expense_participants 
       SET pagamento_confirmado = true, data_pagamento = CURRENT_TIMESTAMP
       WHERE expense_id = $1 AND user_id = $2`,
      [expense_id, user_id]
    );
    
    res.json({ success: true, message: 'Pagamento confirmado' });
  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error);
    res.status(500).json({ success: false, error: 'Erro ao confirmar pagamento' });
  }
};

export const getDebtsSummary = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM debts_summary ORDER BY devedor_nome, credor_nome');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar resumo de dívidas:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar resumo de dívidas' });
  }
};

export const updateExpense = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { descricao, valor_total, category_id, participantes } = req.body;
    
    await client.query('BEGIN');
    
    await client.query(
      `UPDATE expenses 
       SET descricao = COALESCE($1, descricao),
           valor_total = COALESCE($2, valor_total),
           category_id = COALESCE($3, category_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [descricao, valor_total, category_id, id]
    );
    
    if (participantes && Array.isArray(participantes)) {
      await client.query('DELETE FROM expense_participants WHERE expense_id = $1', [id]);

      const normalizedParticipants = participantes
        .map((participant: unknown) => {
          if (typeof participant === 'number') {
            return { user_id: participant, valor_individual: null };
          }

          if (typeof participant === 'string') {
            const parsedUserId = Number(participant);
            return Number.isFinite(parsedUserId)
              ? { user_id: parsedUserId, valor_individual: null }
              : null;
          }

          if (typeof participant === 'object' && participant !== null) {
            const participantObj = participant as { user_id?: unknown; valor_individual?: unknown };
            const rawUserId = participantObj.user_id;
            const rawValorIndividual = participantObj.valor_individual;

            const userId =
              typeof rawUserId === 'number'
                ? rawUserId
                : typeof rawUserId === 'string'
                  ? Number(rawUserId)
                  : null;
            const valorIndividual =
              typeof rawValorIndividual === 'number'
                ? rawValorIndividual
                : typeof rawValorIndividual === 'string'
                  ? Number(rawValorIndividual)
                  : null;

            if (userId !== null && Number.isFinite(userId)) {
              return {
                user_id: userId,
                valor_individual: Number.isFinite(valorIndividual) ? valorIndividual : null,
              };
            }
          }

          return null;
        })
        .filter((participant): participant is { user_id: number; valor_individual: number | null } =>
          participant !== null
        );

      for (const participant of normalizedParticipants) {
        await client.query(
          'INSERT INTO expense_participants (expense_id, user_id, valor_individual) VALUES ($1, $2, $3)',
          [id, participant.user_id, participant.valor_individual]
        );
      }
    }
    
    await client.query('COMMIT');
    res.json({ success: true, message: 'Despesa atualizada' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar despesa:', error);
    res.status(500).json({ success: false, error: 'Erro ao atualizar despesa' });
  } finally {
    client.release();
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Despesa não encontrada' });
    }
    
    res.json({ success: true, message: 'Despesa deletada' });
  } catch (error) {
    console.error('Erro ao deletar despesa:', error);
    res.status(500).json({ success: false, error: 'Erro ao deletar despesa' });
  }
};

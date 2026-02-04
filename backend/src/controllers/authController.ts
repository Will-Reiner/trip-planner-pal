import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import pool from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'trip-planner-secret-key-change-in-production';

interface TokenPayload {
  userId: number;
  role: string;
}

type AuthenticatedRequest = Request & { user?: TokenPayload };

// Middleware para verificar JWT
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.log('❌ Autenticação falhou: Token não fornecido');
    return res.status(401).json({ success: false, error: 'Token não fornecido' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || !decoded || typeof decoded !== 'object') {
      console.log('❌ Autenticação falhou: Token inválido', err?.message);
      return res.status(403).json({ success: false, error: 'Token inválido' });
    }

    (req as AuthenticatedRequest).user = decoded as TokenPayload;
    console.log('✓ Autenticado:', (decoded as TokenPayload).userId, 'Role:', (decoded as TokenPayload).role);
    next();
  });
};

// Middleware para verificar se é admin
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as AuthenticatedRequest).user;
  
  if (!user || user.role !== 'admin') {
    console.log('❌ Acesso negado. User:', user?.userId, 'Role:', user?.role);
    return res.status(403).json({ 
      success: false, 
      error: 'Acesso negado. Apenas administradores.' 
    });
  }
  
  console.log('✓ Admin autorizado:', user.userId);
  next();
};

// Login
export const login = async (req: Request, res: Response) => {
  try {
    const { nome, senha } = req.body;

    if (!nome || !senha) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nome e senha são obrigatórios' 
      });
    }

    // Buscar usuário
    const result = await pool.query(
      'SELECT * FROM users WHERE nome = $1',
      [nome]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuário ou senha incorretos' 
      });
    }

    const user = result.rows[0];

    // Verificar senha
    const validPassword = await bcrypt.compare(senha, user.senha);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuário ou senha incorretos' 
      });
    }

    // Gerar JWT (sem expiração conforme solicitado)
    const token = jwt.sign(
      { userId: user.id, role: user.role } as TokenPayload,
      JWT_SECRET
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          nome: user.nome,
          role: user.role,
          avatar_url: user.avatar_url,
          titulo_engracado: user.titulo_engracado
        }
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ success: false, error: 'Erro no login' });
  }
};

// Criar novo usuário (apenas admin)
export const createUser = async (req: Request, res: Response) => {
  try {
    const { nome, senha, role } = req.body;

    if (!nome || !senha) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nome e senha são obrigatórios' 
      });
    }

    if (role && !['admin', 'membro'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Role inválida. Use: admin ou membro' 
      });
    }

    // Verificar se usuário já existe
    const existing = await pool.query(
      'SELECT id FROM users WHERE nome = $1',
      [nome]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'Usuário já existe' 
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Criar usuário
    const result = await pool.query(
      `INSERT INTO users (nome, senha, role) 
       VALUES ($1, $2, $3) 
       RETURNING id, nome, role, avatar_url, titulo_engracado`,
      [nome, hashedPassword, role || 'membro']
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ success: false, error: 'Erro ao criar usuário' });
  }
};

// Verificar token (para manter sessão)
export const verifyToken = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return res.status(401).json({ success: false, error: 'Token não fornecido' });
    }

    // Buscar dados atualizados do usuário
    const result = await pool.query(
      'SELECT id, nome, role, avatar_url, titulo_engracado FROM users WHERE id = $1',
      [user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(500).json({ success: false, error: 'Erro ao verificar token' });
  }
};

import express from 'express';
import { login, createUser, verifyToken, authenticateToken, requireAdmin } from '../controllers/authController';

const router = express.Router();

// Rota pública de login
router.post('/login', login);

// Rotas protegidas
router.get('/verify', authenticateToken, verifyToken);
router.post('/users', authenticateToken, requireAdmin, createUser);

export default router;

import express from 'express';
import { 
  getLeaderboard, 
  getUserScore, 
  addPointManual, 
  redeemQRCode
} from '../controllers/gameController';
import { authenticateToken } from '../controllers/authController';

const router = express.Router();

// Rotas públicas (autenticadas)
router.get('/leaderboard', getLeaderboard);
router.get('/my-score', authenticateToken, getUserScore);

// Adicionar ponto manual (apenas Lumi)
router.post('/add-point/:userId', authenticateToken, addPointManual);

// Resgatar QR code
router.post('/qr/:token', authenticateToken, redeemQRCode);

export default router;

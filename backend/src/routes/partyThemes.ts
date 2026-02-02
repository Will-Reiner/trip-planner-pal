import express from 'express';
import { 
  getAllPartyThemes, 
  createPartyTheme, 
  deletePartyTheme, 
  votePartyTheme,
  removeVotePartyTheme,
  getUserVotes
} from '../controllers/partyThemesController';
import { authenticateToken } from '../controllers/authController';

const router = express.Router();

router.get('/', getAllPartyThemes);
router.get('/my-votes', authenticateToken, getUserVotes);
router.post('/', authenticateToken, createPartyTheme);
router.delete('/:id', authenticateToken, deletePartyTheme);
router.post('/:id/vote', authenticateToken, votePartyTheme);
router.delete('/:id/vote', authenticateToken, removeVotePartyTheme);

export default router;

import express from 'express';
import { 
  getAllPolls, 
  getMyVotes, 
  voteOnPoll,
  removeVote,
  getAdminResults
} from '../controllers/pollsController';
import { authenticateToken } from '../controllers/authController';

const router = express.Router();

router.get('/', getAllPolls);
router.get('/my-votes', authenticateToken, getMyVotes);
router.get('/admin/results', authenticateToken, getAdminResults);
router.post('/:id/vote', authenticateToken, voteOnPoll);
router.delete('/:id/vote', authenticateToken, removeVote);

export default router;

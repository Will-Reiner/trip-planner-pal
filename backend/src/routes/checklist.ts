import { Router } from 'express';
import { 
  getAllChecklist, 
  getChecklistByCategory,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  claimChecklistItem,
  toggleUserChecklistItem
} from '../controllers/checklistController';
import { authenticateToken } from '../controllers/authController';

const router = Router();

router.get('/', getAllChecklist);
router.get('/category/:category', getChecklistByCategory);
router.post('/', createChecklistItem);
router.patch('/:id', updateChecklistItem);
router.delete('/:id', authenticateToken, deleteChecklistItem);
router.patch('/:id/claim', claimChecklistItem);
router.patch('/:id/toggle', toggleUserChecklistItem);

export default router;

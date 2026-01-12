import { Router } from 'express';
import { 
  getAllChecklist, 
  getChecklistByCategory,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  claimChecklistItem
} from '../controllers/checklistController';

const router = Router();

router.get('/', getAllChecklist);
router.get('/category/:category', getChecklistByCategory);
router.post('/', createChecklistItem);
router.patch('/:id', updateChecklistItem);
router.delete('/:id', deleteChecklistItem);
router.patch('/:id/claim', claimChecklistItem);

export default router;

import { Router } from 'express';
import { 
  getAllMeals, 
  getMealById, 
  createMeal,
  updateMeal,
  deleteMeal,
  claimRole
} from '../controllers/mealsController';
import { authenticateToken, requireAdmin } from '../controllers/authController';

const router = Router();

router.get('/', getAllMeals);
router.post('/', authenticateToken, requireAdmin, createMeal);
router.patch('/claim-role', claimRole);
router.get('/:id', getMealById);
router.patch('/:id', authenticateToken, requireAdmin, updateMeal);
router.delete('/:id', authenticateToken, requireAdmin, deleteMeal);

export default router;

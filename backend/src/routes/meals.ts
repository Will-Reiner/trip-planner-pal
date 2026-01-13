import { Router } from 'express';
import { 
  getAllMeals, 
  getMealById, 
  createMeal,
  updateMeal,
  claimRole
} from '../controllers/mealsController';

const router = Router();

router.get('/', getAllMeals);
router.get('/:id', getMealById);
router.post('/', createMeal);
router.patch('/:id', updateMeal);
router.patch('/claim-role', claimRole);

export default router;

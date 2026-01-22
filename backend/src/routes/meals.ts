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
router.post('/', createMeal);
router.patch('/claim-role', claimRole);
router.get('/:id', getMealById);
router.patch('/:id', updateMeal);

export default router;

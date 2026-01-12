import { Router } from 'express';
import { 
  getAllMeals, 
  getMealById, 
  createMeal,
  claimRole
} from '../controllers/mealsController';

const router = Router();

router.get('/', getAllMeals);
router.get('/:id', getMealById);
router.post('/', createMeal);
router.patch('/claim-role', claimRole);

export default router;

import { Router } from 'express';
import { 
  getAllDrinks, 
  getDrinksByCategory, 
  createDrink,
  joinDrink,
  leaveDrink,
  deleteDrink
} from '../controllers/drinksController';
import { authenticateToken, requireAdmin } from '../controllers/authController';

const router = Router();

router.get('/', getAllDrinks);
router.get('/category/:category', getDrinksByCategory);
router.post('/', createDrink);
router.post('/:id/join', joinDrink);
router.delete('/:id/leave', leaveDrink);
router.delete('/:id', authenticateToken, deleteDrink); // Validação de criador/admin no controller

export default router;

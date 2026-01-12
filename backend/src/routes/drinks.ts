import { Router } from 'express';
import { 
  getAllDrinks, 
  getDrinksByCategory, 
  createDrink,
  voteDrink
} from '../controllers/drinksController';

const router = Router();

router.get('/', getAllDrinks);
router.get('/category/:category', getDrinksByCategory);
router.post('/', createDrink);
router.post('/vote', voteDrink);

export default router;

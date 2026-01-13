import { Router } from 'express';
import { 
  addIngredientToMeal,
  removeIngredientFromMeal,
  getMealIngredients,
  getIngredientMeals
} from '../controllers/mealIngredientsController';

const router = Router();

router.post('/', addIngredientToMeal);
router.delete('/', removeIngredientFromMeal);
router.get('/meal/:mealId', getMealIngredients);
router.get('/ingredient/:ingredientId', getIngredientMeals);

export default router;

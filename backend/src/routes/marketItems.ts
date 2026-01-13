import { Router } from 'express';
import { 
  getAllMarketItems, 
  getMarketItemById, 
  createMarketItem, 
  updateMarketItem,
  deleteMarketItem,
  toggleComprado
} from '../controllers/marketItemsController';

const router = Router();

router.get('/', getAllMarketItems);
router.get('/:id', getMarketItemById);
router.post('/', createMarketItem);
router.patch('/:id', updateMarketItem);
router.put('/:id', updateMarketItem);
router.delete('/:id', deleteMarketItem);
router.patch('/:id/toggle', toggleComprado);

export default router;

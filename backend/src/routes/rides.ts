import { Router } from 'express';
import {
  getAllRides,
  createRide,
  updateRide,
  confirmRidePayment,
  deleteRide
} from '../controllers/ridesController';

const router = Router();

router.get('/', getAllRides);
router.post('/', createRide);
router.patch('/:id', updateRide);
router.delete('/:id', deleteRide);
router.patch('/confirm-payment', confirmRidePayment);

export default router;

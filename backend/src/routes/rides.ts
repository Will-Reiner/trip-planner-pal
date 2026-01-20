import { Router } from 'express';
import {
  getAllRides,
  createRide,
  updateRide,
  confirmRidePayment,
  deleteRide,
  joinRide,
  leaveRide
} from '../controllers/ridesController';

const router = Router();

router.get('/', getAllRides);
router.post('/', createRide);
router.patch('/:id', updateRide);
router.delete('/:id', deleteRide);
router.patch('/confirm-payment', confirmRidePayment);
router.post('/:id/join', joinRide);
router.post('/:id/leave', leaveRide);

export default router;

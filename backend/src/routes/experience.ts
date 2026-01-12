import { Router } from 'express';
import { 
  getAllExperiences, 
  getExperiencesByType,
  createExperience,
  voteExperience
} from '../controllers/experienceController';

const router = Router();

router.get('/', getAllExperiences);
router.get('/type/:type', getExperiencesByType);
router.post('/', createExperience);
router.post('/vote', voteExperience);

export default router;

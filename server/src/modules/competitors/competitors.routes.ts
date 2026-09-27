import { Router } from 'express';
import { CompetitorsController } from './competitors.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', CompetitorsController.getAll);
router.get('/:id', CompetitorsController.getById);
router.post('/', CompetitorsController.create);
router.put('/:id', CompetitorsController.update);

export default router;

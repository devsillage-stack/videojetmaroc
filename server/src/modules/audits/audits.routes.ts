import { Router } from 'express';
import { AuditsController } from './audits.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Audits
router.get('/', AuditsController.getAll);
router.get('/:id', AuditsController.getById);
router.post('/', AuditsController.create);
router.post('/:id/tco', AuditsController.calculateTco);

// TCO Calculations
router.get('/tco/all', AuditsController.getAllTco);
router.get('/tco/:id', AuditsController.getTcoById);

export default router;

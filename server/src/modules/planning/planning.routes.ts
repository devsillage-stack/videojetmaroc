import { Router } from 'express';
import {
  getTechnicians,
  getInterventionsSchedule,
  checkTechnicianConflict,
  rescheduleIntervention,
} from './planning.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/technicians', getTechnicians);
router.get('/interventions', getInterventionsSchedule);
router.post('/check-conflicts', checkTechnicianConflict);
router.patch('/reschedule/:id', rescheduleIntervention);

export default router;

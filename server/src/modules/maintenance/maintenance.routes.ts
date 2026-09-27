import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  getInterventions,
  getInterventionById,
  createIntervention,
  startIntervention,
  completeIntervention,
} from './maintenance.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRoles } from '../../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticate);

// Tickets routes
router.get('/tickets', getTickets);
router.get('/tickets/:id', getTicketById);
router.post('/tickets', createTicket);
router.put('/tickets/:id', updateTicket);

// Interventions routes
router.get('/interventions', getInterventions);
router.get('/interventions/:id', getInterventionById);
router.post('/interventions', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.RESPONSABLE_SAV), createIntervention);
router.post('/interventions/:id/start', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.RESPONSABLE_SAV, Role.TECHNICIEN_SAV), startIntervention);
router.post('/interventions/:id/complete', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.RESPONSABLE_SAV, Role.TECHNICIEN_SAV), completeIntervention);

export default router;

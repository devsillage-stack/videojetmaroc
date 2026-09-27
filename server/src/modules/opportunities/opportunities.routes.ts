import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  getOpportunities,
  createOpportunity,
  updateOpportunityStage,
} from './opportunities.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRoles } from '../../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getOpportunities);
router.post('/', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.COMMERCIAL, Role.DIRECTION), createOpportunity);
router.put('/:id/stage', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.COMMERCIAL, Role.DIRECTION), updateOpportunityStage);

export default router;

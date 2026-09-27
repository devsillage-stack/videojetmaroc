import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  getModels,
  createModel,
  getMachines,
  getMachineById,
  createMachine,
  updateMachine,
  deleteMachine,
} from './machines.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRoles } from '../../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/models', getModels);
router.post('/models', requireRoles(Role.SUPER_ADMIN, Role.ADMIN), createModel);

router.get('/', getMachines);
router.get('/:id', getMachineById);
router.post('/', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.RESPONSABLE_SAV, Role.COMMERCIAL), createMachine);
router.put('/:id', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.RESPONSABLE_SAV, Role.TECHNICIEN_SAV), updateMachine);
router.delete('/:id', requireRoles(Role.SUPER_ADMIN, Role.ADMIN), deleteMachine);

export default router;

import { Router } from 'express';
import { Role } from '@prisma/client';
import { getContracts, getContractById, createContract, recordVisit } from './contracts.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRoles } from '../../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getContracts);
router.get('/:id', getContractById);
router.post('/', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.RESPONSABLE_SAV, Role.COMMERCIAL), createContract);
router.post('/:id/visit', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.RESPONSABLE_SAV, Role.TECHNICIEN_SAV), recordVisit);

export default router;

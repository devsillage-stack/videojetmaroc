import { Router } from 'express';
import { Role } from '@prisma/client';
import { getAuditLogs } from './audit.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRoles } from '../../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/', requireRoles(Role.SUPER_ADMIN, Role.ADMIN), getAuditLogs);

export default router;

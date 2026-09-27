import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  getCompanySettings,
  updateCompanySettings,
  getDatabaseStats,
  purgeDatabase,
} from './settings.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRoles } from '../../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticate);

// Company profile & document studio
router.get('/company', getCompanySettings);
router.put(
  '/company',
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.DIRECTION, Role.COMPTABILITE),
  updateCompanySettings
);

// Database maintenance & purge (Super Admin & Admin only)
router.get(
  '/database-stats',
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN),
  getDatabaseStats
);
router.post(
  '/purge-database',
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN),
  purgeDatabase
);

export default router;

import { Router } from 'express';
import { Role } from '@prisma/client';
import { getCurrencies, updateExchangeRate, getTaxRates } from './currencies.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRoles } from '../../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getCurrencies);
router.put('/:code/rate', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.COMPTABILITE, Role.DIRECTION), updateExchangeRate);
router.get('/taxes', getTaxRates);

export default router;

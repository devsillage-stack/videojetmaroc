import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  getQuotes,
  getQuoteById,
  createQuote,
  updateQuoteStatus,
  convertQuoteToInvoice,
} from './quotes.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRoles } from '../../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getQuotes);
router.get('/:id', getQuoteById);
router.post('/', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.COMMERCIAL, Role.DIRECTION), createQuote);
router.put('/:id/status', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.COMMERCIAL, Role.DIRECTION), updateQuoteStatus);
router.post('/:id/convert-to-invoice', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.COMPTABILITE, Role.DIRECTION), convertQuoteToInvoice);

export default router;

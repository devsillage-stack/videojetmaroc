import { Router } from 'express';
import { Role } from '@prisma/client';
import { getInvoices, getInvoiceById, recordPayment } from './invoices.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRoles } from '../../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.post('/:id/payment', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.COMPTABILITE, Role.DIRECTION), recordPayment);

export default router;

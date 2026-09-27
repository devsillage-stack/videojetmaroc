import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  receivePurchaseOrder,
} from './purchasing.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRoles } from '../../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticate);

// Suppliers
router.get('/suppliers', getSuppliers);
router.get('/suppliers/:id', getSupplierById);
router.post(
  '/suppliers',
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.MAGASINIER, Role.COMPTABILITE),
  createSupplier
);
router.put(
  '/suppliers/:id',
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.MAGASINIER, Role.COMPTABILITE),
  updateSupplier
);
router.delete('/suppliers/:id', requireRoles(Role.SUPER_ADMIN, Role.ADMIN), deleteSupplier);

// Purchase Orders
router.get('/orders', getPurchaseOrders);
router.get('/orders/:id', getPurchaseOrderById);
router.post(
  '/orders',
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.MAGASINIER, Role.COMPTABILITE),
  createPurchaseOrder
);
router.patch(
  '/orders/:id/status',
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.MAGASINIER, Role.COMPTABILITE),
  updatePurchaseOrderStatus
);
router.post(
  '/orders/:id/receive',
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.MAGASINIER),
  receivePurchaseOrder
);

export default router;

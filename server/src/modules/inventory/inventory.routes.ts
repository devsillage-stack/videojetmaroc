import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  addStockBatch,
  getExpirationAlerts,
  getReplenishmentSuggestions,
  getStockMovements,
} from './inventory.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRoles } from '../../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.post('/products', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.MAGASINIER), createProduct);
router.put('/products/:id', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.MAGASINIER), updateProduct);

router.post('/batches', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.MAGASINIER), addStockBatch);
router.get('/alerts/expiration', getExpirationAlerts);
router.get('/replenishment-suggestions', getReplenishmentSuggestions);
router.get('/movements', getStockMovements);

export default router;

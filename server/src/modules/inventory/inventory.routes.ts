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
  adjustStock,
  discardBatch,
} from './inventory.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRoles } from '../../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.post('/products', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.MAGASINIER), createProduct);
router.put('/products/:id', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.MAGASINIER), updateProduct);

router.post('/adjust', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.MAGASINIER), adjustStock);

router.post('/batches', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.MAGASINIER), addStockBatch);
router.post('/batches/:batchId/discard', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.MAGASINIER), discardBatch);
router.get('/alerts/expiration', getExpirationAlerts);
router.get('/replenishment-suggestions', getReplenishmentSuggestions);
router.get('/movements', getStockMovements);

export default router;

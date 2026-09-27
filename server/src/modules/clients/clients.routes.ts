import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  addContact,
  addSite,
  addProductionLine,
} from './clients.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRoles } from '../../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getClients);
router.get('/:id', getClientById);
router.post('/', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.COMMERCIAL, Role.DIRECTION), createClient);
router.put('/:id', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.COMMERCIAL, Role.DIRECTION), updateClient);
router.delete('/:id', requireRoles(Role.SUPER_ADMIN, Role.ADMIN), deleteClient);

router.post('/:clientId/contacts', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.COMMERCIAL), addContact);
router.post('/:clientId/sites', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.COMMERCIAL), addSite);
router.post('/sites/:siteId/lines', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.COMMERCIAL, Role.RESPONSABLE_SAV), addProductionLine);

export default router;

import { Router } from 'express';
import { Role } from '@prisma/client';
import { getUsers, getUserById, createUser, updateUser, deleteUser } from './users.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRoles } from '../../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.DIRECTION, Role.RESPONSABLE_SAV), getUsers);
router.get('/:id', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.DIRECTION), getUserById);
router.post('/', requireRoles(Role.SUPER_ADMIN, Role.ADMIN), createUser);
router.put('/:id', requireRoles(Role.SUPER_ADMIN, Role.ADMIN), updateUser);
router.delete('/:id', requireRoles(Role.SUPER_ADMIN), deleteUser);

export default router;

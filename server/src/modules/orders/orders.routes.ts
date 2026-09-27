import { Router } from 'express';
import { OrdersController } from './orders.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', OrdersController.getAll);
router.get('/:id', OrdersController.getById);
router.post('/', OrdersController.create);
router.patch('/:id/status', OrdersController.updateStatus);

export default router;

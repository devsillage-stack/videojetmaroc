import { Router } from 'express';
import { Fleet360Controller } from './fleet360.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/machines/:id', Fleet360Controller.getMachine360);
router.get('/clients/:id', Fleet360Controller.getCustomer360);
router.get('/replacement-alerts', Fleet360Controller.getReplacementAlerts);
router.post('/clients/:id/activities', Fleet360Controller.addCustomerActivity);

export default router;

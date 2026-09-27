import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import {
  handleAiChat,
  handleAiDiagnose,
  handleAiInkAdvisor,
  handleAiSalesPitch,
} from './ai.controller.js';

const router = Router();

router.use(authenticate);

router.post('/chat', handleAiChat);
router.post('/diagnose', handleAiDiagnose);
router.post('/ink-advisor', handleAiInkAdvisor);
router.post('/sales-pitch', handleAiSalesPitch);

export default router;

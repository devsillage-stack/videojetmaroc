import { Router } from 'express';
import {
  exportInterventionPdf,
  exportQuotePdf,
  exportInvoicePdf,
  exportQrLabelsPdf,
  exportSpecimenPdf,
  exportMachinesExcel,
  exportInventoryExcel,
  exportStockMovementsExcel,
} from './exports.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

// PDF Exports
router.get('/interventions/:id/pdf', exportInterventionPdf);
router.get('/quotes/:id/pdf', exportQuotePdf);
router.get('/invoices/:id/pdf', exportInvoicePdf);
router.get('/specimen-pdf', exportSpecimenPdf);
router.get('/machines/qr-labels/pdf', exportQrLabelsPdf);

// Excel Exports
router.get('/machines/excel', exportMachinesExcel);
router.get('/inventory/excel', exportInventoryExcel);
router.get('/movements/excel', exportStockMovementsExcel);

export default router;

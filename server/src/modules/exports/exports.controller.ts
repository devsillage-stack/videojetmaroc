import { Response } from 'express';
import { Role } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { AuthRequest } from '../../types/index.js';
import {
  generateInterventionPdf,
  generateQuotePdf,
  generateInvoicePdf,
  generateQrLabelsPdf,
  generateSpecimenPdf,
} from './pdf.service.js';
import {
  generateMachinesExcel,
  generateInventoryExcel,
  generateStockMovementsExcel,
} from './excel.service.js';
import { logAuditAction } from '../../middlewares/audit.middleware.js';

export const exportInterventionPdf = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;

  const intervention = await prisma.intervention.findUnique({
    where: { id },
    include: {
      technician: true,
      client: true,
      machine: { include: { model: true, site: true, line: true } },
      partsUsed: { include: { product: true } },
    },
  });

  if (!intervention) {
    res.status(404).json({ error: 'Intervention introuvable' });
    return;
  }

  const pdfBuffer = await generateInterventionPdf(intervention);

  await logAuditAction(req, 'EXPORT_PDF', 'Intervention', intervention.id, {
    interventionNumber: intervention.interventionNumber,
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="Fiche_SAV_${intervention.interventionNumber}.pdf"`
  );
  res.send(pdfBuffer);
};

export const exportQuotePdf = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      client: true,
      items: true,
    },
  });

  if (!quote) {
    res.status(404).json({ error: 'Devis introuvable' });
    return;
  }

  const pdfBuffer = await generateQuotePdf(quote);

  await logAuditAction(req, 'EXPORT_PDF', 'Quote', quote.id, {
    quoteNumber: quote.quoteNumber,
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="Devis_${quote.quoteNumber}.pdf"`
  );
  res.send(pdfBuffer);
};

export const exportInvoicePdf = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      quote: {
        include: {
          items: true,
        },
      },
    },
  });

  if (!invoice) {
    res.status(404).json({ error: 'Facture introuvable' });
    return;
  }

  const pdfBuffer = await generateInvoicePdf(invoice);

  await logAuditAction(req, 'EXPORT_PDF', 'Invoice', invoice.id, {
    invoiceNumber: invoice.invoiceNumber,
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="Facture_${invoice.invoiceNumber}.pdf"`
  );
  res.send(pdfBuffer);
};

export const exportSpecimenPdf = async (req: AuthRequest, res: Response): Promise<void> => {
  const pdfBuffer = await generateSpecimenPdf();

  await logAuditAction(req, 'EXPORT_PDF', 'CompanySettings', 'default', {
    type: 'SPECIMEN_PREVIEW',
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="Specimen_Mise_En_Page_Videojet.pdf"'
  );
  res.send(pdfBuffer);
};

export const exportQrLabelsPdf = async (req: AuthRequest, res: Response): Promise<void> => {
  const { clientId, machineId } = req.query;

  const where: any = {};
  if (clientId) where.clientId = String(clientId);
  if (machineId) where.id = String(machineId);

  const machines = await prisma.machine.findMany({
    where,
    include: {
      model: true,
      client: true,
      site: true,
    },
    orderBy: { serialNumber: 'asc' },
  });

  if (machines.length === 0) {
    res.status(404).json({ error: 'Aucune machine trouvée pour l\'impression d\'étiquettes' });
    return;
  }

  const pdfBuffer = await generateQrLabelsPdf(machines);

  await logAuditAction(req, 'EXPORT_QR_LABELS', 'Machine', undefined, {
    count: machines.length,
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="Etiquettes_QR_Videojet.pdf"');
  res.send(pdfBuffer);
};

export const exportMachinesExcel = async (req: AuthRequest, res: Response): Promise<void> => {
  const machines = await prisma.machine.findMany({
    include: {
      model: true,
      client: true,
      site: true,
    },
    orderBy: { serialNumber: 'asc' },
  });

  const buffer = await generateMachinesExcel(machines);

  await logAuditAction(req, 'EXPORT_EXCEL', 'Machine', undefined, {
    count: machines.length,
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', 'attachment; filename="Parc_Machines_Videojet.xlsx"');
  res.send(buffer);
};

export const exportInventoryExcel = async (req: AuthRequest, res: Response): Promise<void> => {
  const isPrivileged =
    req.user &&
    ([Role.SUPER_ADMIN, Role.ADMIN, Role.DIRECTION, Role.COMPTABILITE] as Role[]).includes(
      req.user.role
    );

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { partNumber: 'asc' },
  });

  const buffer = await generateInventoryExcel(products, Boolean(isPrivileged));

  await logAuditAction(req, 'EXPORT_EXCEL', 'Product', undefined, {
    count: products.length,
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', 'attachment; filename="Catalogue_Videojet.xlsx"');
  res.send(buffer);
};

export const exportStockMovementsExcel = async (req: AuthRequest, res: Response): Promise<void> => {
  const movements = await prisma.stockMovement.findMany({
    include: {
      product: true,
      user: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  const buffer = await generateStockMovementsExcel(movements);

  await logAuditAction(req, 'EXPORT_EXCEL', 'StockMovement', undefined, {
    count: movements.length,
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', 'attachment; filename="Mouvements_Stock_Videojet.xlsx"');
  res.send(buffer);
};

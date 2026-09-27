import { Response } from 'express';
import { InvoiceStatus } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { AuthRequest } from '../../types/index.js';
import { logAuditAction } from '../../middlewares/audit.middleware.js';

export const getInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, clientId, search } = req.query;

  const where: any = {};
  if (status) where.status = status as InvoiceStatus;
  if (clientId) where.clientId = String(clientId);

  if (search) {
    where.OR = [
      { invoiceNumber: { contains: String(search), mode: 'insensitive' } },
      { client: { name: { contains: String(search), mode: 'insensitive' } } },
    ];
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      client: { select: { id: true, name: true, city: true } },
      quote: { select: { id: true, quoteNumber: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ invoices });
};

export const getInvoiceById = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      quote: {
        include: {
          items: {
            include: { machineModel: true, product: true },
          },
        },
      },
    },
  });

  if (!invoice) {
    res.status(404).json({ error: 'Facture introuvable' });
    return;
  }

  res.json({ invoice });
};

export const recordPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { amount, paymentMethod } = req.body;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
  });

  if (!invoice) {
    res.status(404).json({ error: 'Facture introuvable' });
    return;
  }

  const newPaidAmount = invoice.paidAmount + Number(amount);
  let newStatus: InvoiceStatus = invoice.status;

  if (newPaidAmount >= invoice.totalTtc) {
    newStatus = InvoiceStatus.PAYEE;
  } else if (newPaidAmount > 0) {
    newStatus = InvoiceStatus.PAYEE_PARTIEL;
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      paidAmount: newPaidAmount,
      status: newStatus,
      paymentMethod: paymentMethod || invoice.paymentMethod,
    },
  });

  await logAuditAction(req, 'RECORD_PAYMENT', 'Invoice', invoice.id, {
    amountRecorded: amount,
    newStatus,
  });

  res.json({ invoice: updated, message: 'Paiement enregistré' });
};

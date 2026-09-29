import { Response } from 'express';
import { z } from 'zod';
import { QuoteStatus, Role } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { AuthRequest } from '../../types/index.js';
import { logAuditAction } from '../../middlewares/audit.middleware.js';
import { getNextSequenceNumber } from '../../utils/sequencer.js';

const quoteItemSchema = z.object({
  itemType: z.enum(['MACHINE', 'PRODUCT', 'SERVICE', 'CONTRAT']),
  machineModelId: z.string().optional().nullable().or(z.literal('')),
  productId: z.string().optional().nullable().or(z.literal('')),
  description: z.string().min(2),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  costPrice: z.number().nonnegative().default(0),
  discountPercent: z.number().min(0).max(100).default(0),
});

const quoteSchema = z.object({
  clientId: z.string().uuid(),
  opportunityId: z.string().uuid().optional().nullable().or(z.literal('')),
  taxRateId: z.string().min(1, 'Taux de TVA requis'),
  currency: z.string().default('MAD'),
  exchangeRate: z.number().positive().default(1.0),
  discountPercent: z.number().min(0).max(100).default(0),
  validUntil: z.string(),
  paymentTerms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(quoteItemSchema).min(1, 'Au moins un article est requis'),
});

export const getQuotes = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, clientId, search } = req.query;

  const where: any = {};
  if (status) where.status = status as QuoteStatus;
  if (clientId) where.clientId = String(clientId);

  if (search) {
    where.OR = [
      { quoteNumber: { contains: String(search), mode: 'insensitive' } },
      { client: { name: { contains: String(search), mode: 'insensitive' } } },
    ];
  }

  const quotes = await prisma.quote.findMany({
    where,
    include: {
      client: { select: { id: true, name: true, city: true, defaultCurrency: true } },
      createdBy: { select: { firstName: true, lastName: true } },
      taxRate: true,
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const isPrivileged = req.user && ([Role.SUPER_ADMIN, Role.ADMIN, Role.DIRECTION, Role.COMPTABILITE] as Role[]).includes(req.user.role);

  const sanitized = quotes.map((q) => {
    if (!isPrivileged) {
      const copy: any = { ...q };
      delete copy.totalCost;
      delete copy.estimatedMargin;
      return copy;
    }
    return q;
  });

  res.json({ quotes: sanitized });
};

export const getQuoteById = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      client: true,
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      taxRate: true,
      items: {
        include: {
          machineModel: true,
          product: true,
        },
      },
    },
  });

  if (!quote) {
    res.status(404).json({ error: 'Devis introuvable' });
    return;
  }

  const isPrivileged = req.user && ([Role.SUPER_ADMIN, Role.ADMIN, Role.DIRECTION, Role.COMPTABILITE] as Role[]).includes(req.user.role);

  if (!isPrivileged) {
    const copy: any = { ...quote };
    delete copy.totalCost;
    delete copy.estimatedMargin;
    copy.items = copy.items.map((it: any) => {
      const itCopy = { ...it };
      delete itCopy.costPrice;
      return itCopy;
    });
    res.json({ quote: copy });
    return;
  }

  res.json({ quote });
};

export const createQuote = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = quoteSchema.parse(req.body);

  const quoteNumber = await getNextSequenceNumber('quote');

  const tax = await prisma.taxRate.findUnique({
    where: { id: data.taxRateId },
  });

  if (!tax) {
    res.status(400).json({ error: 'Taux de TVA invalide' });
    return;
  }

  // Calculate totals
  let subtotalHt = 0;
  let totalCost = 0;

  const preparedItems = data.items.map((item) => {
    const lineDiscount = item.discountPercent / 100;
    const lineTotal = item.quantity * item.unitPrice * (1 - lineDiscount);
    const lineCost = item.quantity * item.costPrice;

    subtotalHt += lineTotal;
    totalCost += lineCost;

    return {
      itemType: item.itemType,
      machineModelId: item.machineModelId || null,
      productId: item.productId || null,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      costPrice: item.costPrice,
      discountPercent: item.discountPercent,
      totalLineHt: Math.round(lineTotal * 100) / 100,
    };
  });

  const globalDiscountAmount = (subtotalHt * data.discountPercent) / 100;
  const totalHt = Math.round((subtotalHt - globalDiscountAmount) * 100) / 100;
  const taxAmount = Math.round((totalHt * (tax.rate / 100)) * 100) / 100;
  const totalTtc = Math.round((totalHt + taxAmount) * 100) / 100;
  const estimatedMargin = Math.round((totalHt - totalCost) * 100) / 100;

  const quote = await prisma.quote.create({
    data: {
      quoteNumber,
      clientId: data.clientId,
      opportunityId: data.opportunityId || null,
      createdById: req.user!.userId,
      taxRateId: data.taxRateId,
      status: QuoteStatus.BROUILLON,
      currency: data.currency,
      exchangeRate: data.exchangeRate,
      subtotalHt: Math.round(subtotalHt * 100) / 100,
      discountPercent: data.discountPercent,
      discountAmount: Math.round(globalDiscountAmount * 100) / 100,
      totalHt,
      taxAmount,
      totalTtc,
      totalCost: Math.round(totalCost * 100) / 100,
      estimatedMargin,
      validUntil: new Date(data.validUntil),
      paymentTerms: data.paymentTerms || null,
      notes: data.notes || null,
      items: {
        create: preparedItems,
      },
    },
    include: {
      client: true,
      items: true,
      taxRate: true,
    },
  });

  await logAuditAction(req, 'CREATE', 'Quote', quote.id, { quoteNumber, totalHt });

  res.status(201).json({ quote, message: 'Devis créé avec succès' });
};

export const updateQuoteStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { status } = req.body;

  const quote = await prisma.quote.update({
    where: { id },
    data: { status },
    include: { client: true },
  });

  await logAuditAction(req, 'STATUS_CHANGE', 'Quote', quote.id, { newStatus: status });

  res.json({ quote, message: `Statut du devis passé à [${status}]` });
};

export const convertQuoteToInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { client: true },
  });

  if (!quote) {
    res.status(404).json({ error: 'Devis introuvable' });
    return;
  }

  const invoiceNumber = await getNextSequenceNumber('invoice');

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30); // 30 days credit

  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        invoiceNumber,
        quoteId: quote.id,
        clientId: quote.clientId,
        issueDate: new Date(),
        dueDate,
        currency: quote.currency,
        exchangeRate: quote.exchangeRate,
        subtotalHt: quote.totalHt,
        taxAmount: quote.taxAmount,
        totalTtc: quote.totalTtc,
        paidAmount: 0,
        notes: `Généré automatiquement depuis le devis ${quote.quoteNumber}`,
      },
    });

    // Mark quote as accepted
    await tx.quote.update({
      where: { id: quote.id },
      data: { status: QuoteStatus.ACCEPTE },
    });

    return inv;
  });

  await logAuditAction(req, 'CONVERT_TO_INVOICE', 'Quote', quote.id, { invoiceNumber });

  res.status(201).json({ invoice, message: 'Facture générée avec succès depuis le devis' });
};

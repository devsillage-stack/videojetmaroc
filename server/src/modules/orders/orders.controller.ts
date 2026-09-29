import { Request, Response } from 'express';
import prisma from '../../config/prisma.js';
import { OrderStatus, QuoteStatus } from '@prisma/client';
import { getNextSequenceNumber } from '../../utils/sequencer.js';

export class OrdersController {
  // GET /api/orders
  static async getAll(req: Request, res: Response): Promise<void> {
    const { clientId, status } = req.query;

    const where: any = {};
    if (clientId) where.clientId = clientId as string;
    if (status) where.status = status as OrderStatus;

    const orders = await prisma.order.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, code: true, city: true } },
        quote: { select: { id: true, quoteNumber: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        items: {
          include: {
            machineModel: { select: { id: true, modelNumber: true, name: true } },
            product: { select: { id: true, partNumber: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ orders });
  }

  // GET /api/orders/:id
  static async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: id as string },
      include: {
        client: true,
        quote: true,
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: {
          include: {
            machineModel: true,
            product: true,
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Commande introuvable' });
      return;
    }

    res.json({ order });
  }

  // POST /api/orders
  static async create(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const {
      clientId,
      quoteId,
      deliveryAddress,
      estimatedDeliveryDate,
      trackingNumber,
      notes,
      items = [],
    } = req.body;

    const orderNumber = await getNextSequenceNumber('order');

    // If converted from quote
    let finalClientId = clientId;
    let subtotalHt = 0;
    let taxAmount = 0;
    let totalTtc = 0;
    let currency = 'MAD';
    let exchangeRate = 1.0;
    let finalItems = items;

    if (quoteId) {
      const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: { items: true },
      });

      if (!quote) {
        res.status(404).json({ error: 'Devis associé introuvable' });
        return;
      }

      finalClientId = quote.clientId;
      subtotalHt = quote.totalHt;
      taxAmount = quote.taxAmount;
      totalTtc = quote.totalTtc;
      currency = quote.currency;
      exchangeRate = quote.exchangeRate;

      // Map quote items to order items if not custom passed
      if (!items || items.length === 0) {
        finalItems = quote.items.map((it) => ({
          itemType: it.itemType,
          machineModelId: it.machineModelId,
          productId: it.productId,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalLineHt: it.totalLineHt,
        }));
      }

      // Update quote status to ACCEPTE if not already
      await prisma.quote.update({
        where: { id: quoteId },
        data: { status: QuoteStatus.ACCEPTE },
      });
    } else {
      if (!finalClientId) {
        res.status(400).json({ error: 'Le client est requis' });
        return;
      }
      subtotalHt = finalItems.reduce((acc: number, it: any) => acc + (Number(it.totalLineHt) || 0), 0);
      taxAmount = subtotalHt * 0.2;
      totalTtc = subtotalHt + taxAmount;
    }

    const order = await prisma.order.create({
      data: {
        orderNumber,
        quote: quoteId ? { connect: { id: quoteId } } : undefined,
        client: { connect: { id: finalClientId } },
        createdBy: { connect: { id: userId } },
        status: OrderStatus.CONFIRMEE,
        currency,
        exchangeRate,
        subtotalHt,
        taxAmount,
        totalTtc,
        deliveryAddress: deliveryAddress || null,
        estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null,
        trackingNumber: trackingNumber || null,
        notes: notes || null,

        items: {
          create: finalItems.map((it: any) => ({
            itemType: it.itemType || 'PRODUCT',
            machineModelId: it.machineModelId || null,
            productId: it.productId || null,
            description: it.description,
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
            totalLineHt: Number(it.totalLineHt) || (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
          })),
        },
      },
      include: {
        client: true,
        items: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        userEmail: (req as any).user?.email,
        action: 'CREATE_ORDER',
        entity: 'Order',
        entityId: order.id,
        details: { orderNumber: order.orderNumber, clientId: order.clientId, totalTtc: order.totalTtc },
      },
    });

    res.status(201).json({ order, message: 'Commande créée avec succès' });
  }

  // PATCH /api/orders/:id/status
  static async updateStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { status, trackingNumber, actualDeliveryDate } = req.body;

    const order = await prisma.order.update({
      where: { id: id as string },
      data: {
        status: status as OrderStatus,
        trackingNumber: trackingNumber !== undefined ? trackingNumber : undefined,
        actualDeliveryDate: actualDeliveryDate ? new Date(actualDeliveryDate) : undefined,
      },
    });

    res.json({ order, message: `Statut de la commande mis à jour : ${status}` });
  }
}

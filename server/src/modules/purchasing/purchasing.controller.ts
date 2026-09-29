import { Response } from 'express';
import { z } from 'zod';
import { PurchaseOrderStatus, StockMovementType, Role } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { AuthRequest } from '../../types/index.js';
import { logAuditAction } from '../../middlewares/audit.middleware.js';
import { getNextSequenceNumber } from '../../utils/sequencer.js';

// SUPPLIERS
const supplierSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  contactName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().default('Maroc'),
  paymentTerms: z.string().optional().nullable(),
  currency: z.string().default('MAD'),
  rating: z.number().min(1).max(5).default(5.0),
  notes: z.string().optional().nullable(),
});

export const getSuppliers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { search } = req.query;

  const where: any = {};
  if (search) {
    where.OR = [
      { code: { contains: String(search), mode: 'insensitive' } },
      { name: { contains: String(search), mode: 'insensitive' } },
      { contactName: { contains: String(search), mode: 'insensitive' } },
      { city: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  const suppliers = await prisma.supplier.findMany({
    where,
    include: {
      _count: {
        select: {
          products: true,
          purchaseOrders: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  res.json({ suppliers });
};

export const getSupplierById = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      products: {
        select: {
          id: true,
          partNumber: true,
          name: true,
          type: true,
          technology: true,
          unitPrice: true,
          stockQuantity: true,
          minStockThreshold: true,
          unit: true,
        },
      },
      purchaseOrders: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          createdBy: { select: { firstName: true, lastName: true } },
          _count: { select: { items: true } },
        },
      },
    },
  });

  if (!supplier) {
    res.status(404).json({ error: 'Fournisseur introuvable' });
    return;
  }

  res.json({ supplier });
};

export const createSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = supplierSchema.parse(req.body);

  const existing = await prisma.supplier.findUnique({
    where: { code: data.code },
  });

  if (existing) {
    res.status(400).json({ error: 'Un fournisseur avec ce code existe déjà' });
    return;
  }

  const supplier = await prisma.supplier.create({
    data,
  });

  await logAuditAction(req, 'CREATE', 'Supplier', supplier.id, { code: supplier.code, name: supplier.name });

  res.status(201).json({ supplier, message: 'Fournisseur créé avec succès' });
};

export const updateSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const data = supplierSchema.partial().parse(req.body);

  const supplier = await prisma.supplier.update({
    where: { id },
    data,
  });

  await logAuditAction(req, 'UPDATE', 'Supplier', supplier.id, data);

  res.json({ supplier, message: 'Fournisseur mis à jour' });
};

export const deleteSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;

  await prisma.supplier.delete({
    where: { id },
  });

  await logAuditAction(req, 'DELETE', 'Supplier', id);

  res.json({ message: 'Fournisseur supprimé' });
};

// PURCHASE ORDERS
const purchaseOrderSchema = z.object({
  supplierId: z.string().uuid(),
  currency: z.string().default('MAD'),
  exchangeRate: z.number().positive().default(1.0),
  expectedDeliveryDate: z.string().optional().nullable(),
  trackingNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().positive(),
      unitPrice: z.number().positive(),
    })
  ).min(1),
});

export const getPurchaseOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, supplierId, search } = req.query;

  const where: any = {};
  if (status) where.status = status as PurchaseOrderStatus;
  if (supplierId) where.supplierId = String(supplierId);

  if (search) {
    where.OR = [
      { orderNumber: { contains: String(search), mode: 'insensitive' } },
      { trackingNumber: { contains: String(search), mode: 'insensitive' } },
      { supplier: { name: { contains: String(search), mode: 'insensitive' } } },
    ];
  }

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where,
    include: {
      supplier: { select: { id: true, name: true, code: true, currency: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      items: {
        include: {
          product: { select: { id: true, partNumber: true, name: true, unit: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ purchaseOrders });
};

export const getPurchaseOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;

  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      createdBy: true,
      items: {
        include: {
          product: true,
        },
      },
      stockMovements: {
        include: {
          product: true,
          batch: true,
          user: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!purchaseOrder) {
    res.status(404).json({ error: 'Bon de commande fournisseur introuvable' });
    return;
  }

  res.json({ purchaseOrder });
};

export const createPurchaseOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = purchaseOrderSchema.parse(req.body);
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ error: 'Non authentifié' });
    return;
  }

  const orderNumber = await getNextSequenceNumber('purchaseOrder');

  let subtotalHt = 0;
  const itemsData = data.items.map((item) => {
    const lineTotal = item.quantity * item.unitPrice;
    subtotalHt += lineTotal;
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalLineHt: lineTotal,
    };
  });

  const taxAmount = subtotalHt * 0.20;
  const totalTtc = subtotalHt + taxAmount;

  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      orderNumber,
      supplierId: data.supplierId,
      createdById: userId,
      status: PurchaseOrderStatus.BROUILLON,
      currency: data.currency,
      exchangeRate: data.exchangeRate,
      subtotalHt,
      taxAmount,
      totalTtc,
      expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null,
      trackingNumber: data.trackingNumber || null,
      notes: data.notes || null,
      items: {
        create: itemsData,
      },
    },
    include: {
      supplier: true,
      items: { include: { product: true } },
    },
  });

  await logAuditAction(req, 'CREATE', 'PurchaseOrder', purchaseOrder.id, {
    orderNumber,
    totalTtc,
    itemsCount: data.items.length,
  });

  res.status(201).json({ purchaseOrder, message: 'Bon de commande fournisseur créé avec succès' });
};

export const updatePurchaseOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { status, trackingNumber } = req.body;

  if (!status || !Object.values(PurchaseOrderStatus).includes(status)) {
    res.status(400).json({ error: 'Statut de commande invalide' });
    return;
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      status,
      ...(trackingNumber !== undefined && { trackingNumber }),
    },
    include: {
      supplier: true,
    },
  });

  await logAuditAction(req, 'UPDATE_STATUS', 'PurchaseOrder', updated.id, { status });

  res.json({ purchaseOrder: updated, message: `Statut mis à jour : ${status}` });
};

const receiveItemsSchema = z.object({
  receivedItems: z.array(
    z.object({
      itemId: z.string().uuid(),
      receivedQuantity: z.number().positive(),
      batchNumber: z.string().optional().nullable(),
      expirationDate: z.string().optional().nullable(),
      warehouseLocation: z.string().optional().nullable(),
    })
  ).min(1),
  receivedDate: z.string().optional(),
});

export const receivePurchaseOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const data = receiveItemsSchema.parse(req.body);
  const userId = req.user?.userId;

  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });

  if (!order) {
    res.status(404).json({ error: 'Bon de commande fournisseur introuvable' });
    return;
  }

  const updatedOrder = await prisma.$transaction(async (tx) => {
    for (const reception of data.receivedItems) {
      const item = order.items.find((i) => i.id === reception.itemId);
      if (!item) continue;

      // Update item received quantity
      const newReceivedQty = item.receivedQuantity + reception.receivedQuantity;
      await tx.purchaseOrderItem.update({
        where: { id: item.id },
        data: { receivedQuantity: newReceivedQty },
      });

      // Create batch if batchNumber provided
      let batchId: string | null = null;
      if (reception.batchNumber && reception.expirationDate) {
        const expDate = new Date(reception.expirationDate);
        const batch = await tx.stockBatch.create({
          data: {
            productId: item.productId,
            batchNumber: reception.batchNumber,
            expirationDate: expDate,
            quantity: reception.receivedQuantity,
            warehouseLocation: reception.warehouseLocation || null,
          },
        });
        batchId = batch.id;
      }

      // Increment product stock
      const productBefore = item.product.stockQuantity;
      const productAfter = productBefore + reception.receivedQuantity;

      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { increment: reception.receivedQuantity } },
      });

      // Create StockMovement
      const movementNumber = await getNextSequenceNumber('stockMovement', undefined, tx);

      await tx.stockMovement.create({
        data: {
          movementNumber,
          productId: item.productId,
          batchId,
          purchaseOrderId: order.id,
          userId: userId || null,
          type: StockMovementType.ENTREE_ACHAT,
          quantity: reception.receivedQuantity,
          stockBefore: productBefore,
          stockAfter: productAfter,
          reason: `Réception bon de commande fournisseur ${order.orderNumber}`,
        },
      });
    }

    // Check if fully received
    const updatedItems = await tx.purchaseOrderItem.findMany({
      where: { purchaseOrderId: id },
    });

    const allComplete = updatedItems.every((i) => i.receivedQuantity >= i.quantity);
    const newStatus = allComplete ? PurchaseOrderStatus.RECUE_COMPLETE : PurchaseOrderStatus.RECUE_PARTIELLE;

    return await tx.purchaseOrder.update({
      where: { id },
      data: {
        status: newStatus,
        receivedDate: new Date(data.receivedDate || new Date()),
      },
      include: {
        supplier: true,
        items: { include: { product: true } },
        stockMovements: true,
      },
    });
  });

  await logAuditAction(req, 'RECEIVE_ORDER', 'PurchaseOrder', id, {
    newStatus: updatedOrder.status,
    receivedCount: data.receivedItems.length,
  });

  res.json({
    purchaseOrder: updatedOrder,
    message: updatedOrder.status === PurchaseOrderStatus.RECUE_COMPLETE
      ? 'Commande entièrement réceptionnée et stock mis à jour'
      : 'Réception partielle enregistrée et stock mis à jour',
  });
};

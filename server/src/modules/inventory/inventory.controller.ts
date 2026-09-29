import { Response } from 'express';
import { z } from 'zod';
import { ProductType, MachineTechnology, ProductUnit, BatchStatus, Role, StockMovementType } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { AuthRequest } from '../../types/index.js';
import { logAuditAction } from '../../middlewares/audit.middleware.js';
import { getNextSequenceNumber } from '../../utils/sequencer.js';

const productSchema = z.object({
  partNumber: z.string().min(2),
  name: z.string().min(2),
  type: z.nativeEnum(ProductType),
  technology: z.nativeEnum(MachineTechnology).default(MachineTechnology.CIJ),
  description: z.string().optional().nullable(),
  unitPrice: z.number().positive(),
  costPrice: z.number().nonnegative(),
  currency: z.string().default('MAD'),
  stockQuantity: z.number().default(0),
  minStockThreshold: z.number().default(10),
  unit: z.nativeEnum(ProductUnit).default(ProductUnit.CARTOUCHE),
  safetySheetUrl: z.string().optional().nullable(),
});

const batchSchema = z.object({
  productId: z.string().uuid(),
  batchNumber: z.string().min(2),
  expirationDate: z.string(),
  quantity: z.number().positive(),
  warehouseLocation: z.string().optional().nullable(),
});

export const getProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  const { type, technology, search, lowStock } = req.query;

  const where: any = { isActive: true };
  if (type) where.type = type as ProductType;
  if (technology) where.technology = technology as MachineTechnology;

  if (search) {
    where.OR = [
      { partNumber: { contains: String(search), mode: 'insensitive' } },
      { name: { contains: String(search), mode: 'insensitive' } },
      { description: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      batches: {
        where: { quantity: { gt: 0 } },
        orderBy: { expirationDate: 'asc' },
      },
    },
    orderBy: { partNumber: 'asc' },
  });

  // Filter low stock if requested
  let result = products;
  if (lowStock === 'true') {
    result = products.filter((p) => p.stockQuantity <= p.minStockThreshold);
  }

  // Hide costPrice from roles not authorized
  const isPrivileged = req.user && ([Role.SUPER_ADMIN, Role.ADMIN, Role.DIRECTION, Role.COMPTABILITE] as Role[]).includes(req.user.role);
  if (!isPrivileged) {
    result = result.map((p) => {
      const copy: any = { ...p };
      delete copy.costPrice;
      return copy;
    });
  }

  res.json({ products: result });
};

export const getProductById = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      batches: { orderBy: { expirationDate: 'asc' } },
    },
  });

  if (!product) {
    res.status(404).json({ error: 'Article introuvable' });
    return;
  }

  const isPrivileged = req.user && ([Role.SUPER_ADMIN, Role.ADMIN, Role.DIRECTION, Role.COMPTABILITE] as Role[]).includes(req.user.role);
  if (!isPrivileged) {
    const copy: any = { ...product };
    delete copy.costPrice;
    res.json({ product: copy });
    return;
  }

  res.json({ product });
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = productSchema.parse(req.body);

  const existing = await prisma.product.findUnique({
    where: { partNumber: data.partNumber },
  });

  if (existing) {
    res.status(400).json({ error: 'Un article avec cette référence existe déjà' });
    return;
  }

  const product = await prisma.product.create({
    data: {
      ...data,
      description: data.description || null,
      safetySheetUrl: data.safetySheetUrl || null,
    },
  });

  await logAuditAction(req, 'CREATE', 'Product', product.id, { partNumber: product.partNumber });

  res.status(201).json({ product, message: 'Article créé dans le catalogue' });
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const data = productSchema.partial().parse(req.body);

  const product = await prisma.product.update({
    where: { id },
    data,
  });

  await logAuditAction(req, 'UPDATE', 'Product', product.id, data);

  res.json({ product, message: 'Article mis à jour' });
};

// BATCHES & EXPIRATION ALERTS
export const addStockBatch = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = batchSchema.parse(req.body);

  const expDate = new Date(data.expirationDate);
  const now = new Date();
  let status: BatchStatus = BatchStatus.VALIDE;
  const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

  if (diffDays <= 0) {
    status = BatchStatus.PERIME;
  } else if (diffDays <= 60) {
    status = BatchStatus.ALERTE_PEREMPTION;
  }

  const batch = await prisma.stockBatch.create({
    data: {
      productId: data.productId,
      batchNumber: data.batchNumber,
      expirationDate: expDate,
      quantity: data.quantity,
      warehouseLocation: data.warehouseLocation || null,
      status,
    },
  });

  // Increment product total stock
  await prisma.product.update({
    where: { id: data.productId },
    data: {
      stockQuantity: {
        increment: data.quantity,
      },
    },
  });

  await logAuditAction(req, 'RECEIVE_BATCH', 'StockBatch', batch.id, {
    batchNumber: batch.batchNumber,
    quantity: data.quantity,
  });

  res.status(201).json({ batch, message: 'Lot réceptionné et stock mis à jour' });
};

export const getExpirationAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
  const now = new Date();
  const alertDate = new Date();
  alertDate.setDate(now.getDate() + 60); // 60 days ahead

  const batches = await prisma.stockBatch.findMany({
    where: {
      quantity: { gt: 0 },
      expirationDate: { lte: alertDate },
    },
    include: {
      product: {
        select: {
          id: true,
          partNumber: true,
          name: true,
          type: true,
          unit: true,
        },
      },
    },
    orderBy: { expirationDate: 'asc' },
  });

  res.json({ alerts: batches });
};

export const getReplenishmentSuggestions = async (req: AuthRequest, res: Response): Promise<void> => {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
    },
    include: {
      supplier: true,
    },
    orderBy: { stockQuantity: 'asc' },
  });

  const suggestions = products
    .filter((p) => p.stockQuantity <= p.minStockThreshold)
    .map((p) => {
      const deficit = p.minStockThreshold - p.stockQuantity;
      const suggestedReorderQuantity = Math.max(p.minStockThreshold * 2 - p.stockQuantity, p.minStockThreshold);
      const estimatedCost = suggestedReorderQuantity * p.costPrice;

      return {
        product: {
          id: p.id,
          partNumber: p.partNumber,
          name: p.name,
          type: p.type,
          technology: p.technology,
          stockQuantity: p.stockQuantity,
          minStockThreshold: p.minStockThreshold,
          unit: p.unit,
          unitPrice: p.unitPrice,
          currency: p.currency,
        },
        supplier: p.supplier || null,
        deficit,
        suggestedReorderQuantity,
        estimatedCost,
      };
    });

  res.json({ suggestions, count: suggestions.length });
};

export const getStockMovements = async (req: AuthRequest, res: Response): Promise<void> => {
  const { productId, type, limit = 50 } = req.query;

  const where: any = {};
  if (productId) where.productId = String(productId);
  if (type) where.type = type as any;

  const movements = await prisma.stockMovement.findMany({
    where,
    include: {
      product: { select: { id: true, partNumber: true, name: true, unit: true } },
      batch: { select: { id: true, batchNumber: true } },
      purchaseOrder: { select: { id: true, orderNumber: true } },
      user: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: Number(limit),
  });

  res.json({ movements });
};

export const adjustStock = async (req: AuthRequest, res: Response): Promise<void> => {
  const adjustSchema = z.object({
    productId: z.string().uuid(),
    batchId: z.string().uuid().optional().nullable(),
    quantityDelta: z.number().refine((val) => val !== 0, 'La variation doit être non nulle'),
    reason: z.string().min(3, 'Le motif d\'ajustement est requis'),
  });

  const data = adjustSchema.parse(req.body);
  const userId = req.user?.userId;

  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      throw new Error('Article introuvable');
    }

    const stockBefore = product.stockQuantity;
    const stockAfter = Math.max(0, stockBefore + data.quantityDelta);
    const actualDelta = stockAfter - stockBefore;

    await tx.product.update({
      where: { id: data.productId },
      data: { stockQuantity: stockAfter },
    });

    if (data.batchId) {
      const batch = await tx.stockBatch.findUnique({ where: { id: data.batchId } });
      if (batch) {
        const batchAfter = Math.max(0, batch.quantity + data.quantityDelta);
        await tx.stockBatch.update({
          where: { id: data.batchId },
          data: {
            quantity: batchAfter,
            status: batchAfter === 0 ? BatchStatus.EPUISE : batch.status,
          },
        });
      }
    }

    const movementNumber = await getNextSequenceNumber('stockMovement', undefined, tx);
    const movement = await tx.stockMovement.create({
      data: {
        movementNumber,
        productId: data.productId,
        batchId: data.batchId || null,
        userId: userId || null,
        type: StockMovementType.AJUSTEMENT_INVENTAIRE,
        quantity: actualDelta,
        stockBefore,
        stockAfter,
        reason: data.reason,
      },
    });

    return { product, movement, stockBefore, stockAfter };
  });

  await logAuditAction(req, 'STOCK_ADJUSTMENT', 'Product', data.productId, {
    quantityDelta: data.quantityDelta,
    reason: data.reason,
  });

  res.json({
    message: 'Stock ajusté avec succès',
    ...result,
  });
};

export const discardBatch = async (req: AuthRequest, res: Response): Promise<void> => {
  const batchId = String(req.params.batchId);
  const { reason = 'Mise au rebut lot périmé ou non-conforme' } = req.body;
  const userId = req.user?.userId;

  const result = await prisma.$transaction(async (tx) => {
    const batch = await tx.stockBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new Error('Lot introuvable');
    }

    const discardedQty = batch.quantity;
    if (discardedQty <= 0) {
      throw new Error('Ce lot est déjà épuisé');
    }

    const product = await tx.product.findUnique({
      where: { id: batch.productId },
    });

    if (!product) {
      throw new Error('Article lié au lot introuvable');
    }

    // Decrement product stock
    const productBefore = product.stockQuantity;
    const productAfter = Math.max(0, productBefore - discardedQty);

    await tx.product.update({
      where: { id: batch.productId },
      data: { stockQuantity: productAfter },
    });

    // Mark batch as PERIME and quantity 0
    await tx.stockBatch.update({
      where: { id: batchId },
      data: {
        quantity: 0,
        status: BatchStatus.PERIME,
      },
    });

    // Create stock movement
    const movementNumber = await getNextSequenceNumber('stockMovement', undefined, tx);
    const movement = await tx.stockMovement.create({
      data: {
        movementNumber,
        productId: batch.productId,
        batchId: batch.id,
        userId: userId || null,
        type: StockMovementType.REBUT_PERIME,
        quantity: -discardedQty,
        stockBefore: productBefore,
        stockAfter: productAfter,
        reason: `${reason} (Lot ${batch.batchNumber})`,
      },
    });

    return { batch, movement, discardedQty };
  });

  await logAuditAction(req, 'DISCARD_BATCH', 'StockBatch', batchId, {
    quantity: result.discardedQty,
    reason,
  });

  res.json({
    message: `Lot ${result.batch.batchNumber} (${result.discardedQty} unités) mis au rebut avec succès`,
    ...result,
  });
};

import { Response } from 'express';
import { z } from 'zod';
import prisma from '../../config/prisma.js';
import { AuthRequest } from '../../types/index.js';
import { logAuditAction } from '../../middlewares/audit.middleware.js';

export const getCurrencies = async (req: AuthRequest, res: Response): Promise<void> => {
  const currencies = await prisma.currency.findMany({
    include: {
      ratesHistory: {
        take: 5,
        orderBy: { recordedAt: 'desc' },
      },
    },
    orderBy: { code: 'asc' },
  });

  res.json({ currencies });
};

export const updateExchangeRate = async (req: AuthRequest, res: Response): Promise<void> => {
  const code = req.params.code as string;
  const { rateToBase } = req.body;

  const rate = parseFloat(rateToBase);
  if (isNaN(rate) || rate <= 0) {
    res.status(400).json({ error: 'Taux de change invalide' });
    return;
  }

  const updated = await prisma.currency.update({
    where: { code: code.toUpperCase() },
    data: {
      rateToBase: rate,
      updatedAt: new Date(),
      ratesHistory: {
        create: {
          rateToBase: rate,
        },
      },
    },
  });

  await logAuditAction(req, 'UPDATE_EXCHANGE_RATE', 'Currency', code, { newRate: rate });

  res.json({ currency: updated, message: `Taux de change mis à jour pour ${code}` });
};

export const getTaxRates = async (req: AuthRequest, res: Response): Promise<void> => {
  const taxRates = await prisma.taxRate.findMany({
    where: { isActive: true },
    orderBy: { rate: 'desc' },
  });

  res.json({ taxRates });
};

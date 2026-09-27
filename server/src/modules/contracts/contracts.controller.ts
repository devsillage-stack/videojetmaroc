import { Response } from 'express';
import { z } from 'zod';
import { ContractType, ContractStatus } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { AuthRequest } from '../../types/index.js';
import { logAuditAction } from '../../middlewares/audit.middleware.js';

const contractSchema = z.object({
  contractNumber: z.string().min(2),
  clientId: z.string().uuid(),
  type: z.nativeEnum(ContractType).default(ContractType.GOLD),
  startDate: z.string(),
  endDate: z.string(),
  annualCost: z.number().nonnegative(),
  currency: z.string().default('MAD'),
  visitsPerYear: z.number().int().positive().default(4),
  responseTimeHours: z.number().int().positive().default(8),
  includesParts: z.boolean().default(false),
  includesConsumables: z.boolean().default(false),
  notes: z.string().optional().nullable(),
});

export const getContracts = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, type, clientId, search } = req.query;

  const where: any = {};
  if (status) where.status = status as ContractStatus;
  if (type) where.type = type as ContractType;
  if (clientId) where.clientId = String(clientId);

  if (search) {
    where.OR = [
      { contractNumber: { contains: String(search), mode: 'insensitive' } },
      { client: { name: { contains: String(search), mode: 'insensitive' } } },
    ];
  }

  const contracts = await prisma.maintenanceContract.findMany({
    where,
    include: {
      client: { select: { id: true, name: true, city: true } },
    },
    orderBy: { endDate: 'asc' },
  });

  res.json({ contracts });
};

export const getContractById = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;

  const contract = await prisma.maintenanceContract.findUnique({
    where: { id },
    include: {
      client: {
        include: {
          machines: { include: { model: true } },
        },
      },
    },
  });

  if (!contract) {
    res.status(404).json({ error: 'Contrat introuvable' });
    return;
  }

  res.json({ contract });
};

export const createContract = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = contractSchema.parse(req.body);

  const contract = await prisma.maintenanceContract.create({
    data: {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      status: ContractStatus.ACTIF,
      notes: data.notes || null,
    },
    include: { client: true },
  });

  await logAuditAction(req, 'CREATE', 'MaintenanceContract', contract.id, {
    contractNumber: contract.contractNumber,
  });

  res.status(201).json({ contract, message: 'Contrat de maintenance créé' });
};

export const recordVisit = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;

  const contract = await prisma.maintenanceContract.update({
    where: { id },
    data: {
      visitsCompleted: {
        increment: 1,
      },
    },
  });

  await logAuditAction(req, 'RECORD_VISIT', 'MaintenanceContract', contract.id, {
    visitsCompleted: contract.visitsCompleted,
  });

  res.json({ contract, message: 'Visite préventive enregistrée sur le contrat' });
};

import { Response } from 'express';
import { z } from 'zod';
import { OpportunityStage } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { AuthRequest } from '../../types/index.js';
import { logAuditAction } from '../../middlewares/audit.middleware.js';

const opportunitySchema = z.object({
  title: z.string().min(2),
  clientId: z.string().uuid(),
  assignedToId: z.string().uuid().optional(),
  stage: z.nativeEnum(OpportunityStage).default(OpportunityStage.QUALIFICATION),
  expectedValue: z.number().nonnegative().default(0),
  currency: z.string().default('MAD'),
  probabilityPercent: z.number().min(0).max(100).default(50),
  closeDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const getOpportunities = async (req: AuthRequest, res: Response): Promise<void> => {
  const { stage, clientId, assignedToId } = req.query;

  const where: any = {};
  if (stage) where.stage = stage as OpportunityStage;
  if (clientId) where.clientId = String(clientId);
  if (assignedToId) where.assignedToId = String(assignedToId);

  const opportunities = await prisma.opportunity.findMany({
    where,
    include: {
      client: { select: { id: true, name: true, city: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { quotes: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ opportunities });
};

export const createOpportunity = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = opportunitySchema.parse(req.body);

  const opportunity = await prisma.opportunity.create({
    data: {
      title: data.title,
      clientId: data.clientId,
      assignedToId: data.assignedToId || req.user!.userId,
      stage: data.stage,
      expectedValue: data.expectedValue,
      currency: data.currency,
      probabilityPercent: data.probabilityPercent,
      closeDate: data.closeDate ? new Date(data.closeDate) : null,
      notes: data.notes || null,
    },
    include: {
      client: true,
      assignedTo: true,
    },
  });

  await logAuditAction(req, 'CREATE', 'Opportunity', opportunity.id, { title: opportunity.title });

  res.status(201).json({ opportunity, message: 'Opportunité créée' });
};

export const updateOpportunityStage = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { stage, lostReason } = req.body;

  const opportunity = await prisma.opportunity.update({
    where: { id },
    data: {
      stage,
      ...(lostReason && { lostReason }),
    },
  });

  await logAuditAction(req, 'STAGE_CHANGE', 'Opportunity', opportunity.id, { newStage: stage });

  res.json({ opportunity, message: 'Étape de l\'opportunité mise à jour' });
};

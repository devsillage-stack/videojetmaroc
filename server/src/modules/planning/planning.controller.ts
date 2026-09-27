import { Response } from 'express';
import { z } from 'zod';
import { Role, InterventionStatus } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { AuthRequest } from '../../types/index.js';
import { logAuditAction } from '../../middlewares/audit.middleware.js';

export const getTechnicians = async (req: AuthRequest, res: Response): Promise<void> => {
  const technicians = await prisma.user.findMany({
    where: {
      role: Role.TECHNICIEN_SAV,
      isActive: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      interventions: {
        where: {
          status: { in: [InterventionStatus.PLANIFIEE, InterventionStatus.EN_COURS] },
        },
        include: {
          client: { select: { id: true, name: true, city: true } },
          machine: { include: { model: true } },
          ticket: { select: { ticketNumber: true, priority: true } },
        },
        orderBy: { scheduledDate: 'asc' },
      },
    },
    orderBy: { lastName: 'asc' },
  });

  res.json({ technicians });
};

export const getInterventionsSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  const { startDate, endDate, technicianId, status } = req.query;

  const where: any = {};
  if (technicianId) where.technicianId = String(technicianId);
  if (status) where.status = status as InterventionStatus;

  if (startDate || endDate) {
    where.scheduledDate = {};
    if (startDate) where.scheduledDate.gte = new Date(String(startDate));
    if (endDate) where.scheduledDate.lte = new Date(String(endDate));
  }

  const interventions = await prisma.intervention.findMany({
    where,
    include: {
      technician: { select: { id: true, firstName: true, lastName: true, phone: true } },
      client: { select: { id: true, name: true, city: true, address: true } },
      machine: { include: { model: true, line: true } },
      ticket: { select: { ticketNumber: true, priority: true, errorCode: true } },
    },
    orderBy: { scheduledDate: 'asc' },
  });

  const formatted = interventions.map((item) => ({
    ...item,
    meterReadingPrints: item.meterReadingPrints ? Number(item.meterReadingPrints) : null,
  }));

  res.json({ interventions: formatted });
};

const conflictCheckSchema = z.object({
  technicianId: z.string().uuid(),
  scheduledDate: z.string(),
  estimatedHours: z.number().min(0.5).default(3.0),
  excludeInterventionId: z.string().uuid().optional(),
});

export const checkTechnicianConflict = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = conflictCheckSchema.parse(req.body);
  const targetDate = new Date(data.scheduledDate);
  const startWindow = new Date(targetDate.getTime() - data.estimatedHours * 60 * 60 * 1000);
  const endWindow = new Date(targetDate.getTime() + data.estimatedHours * 60 * 60 * 1000);

  const where: any = {
    technicianId: data.technicianId,
    status: { in: [InterventionStatus.PLANIFIEE, InterventionStatus.EN_COURS] },
    scheduledDate: {
      gte: startWindow,
      lte: endWindow,
    },
  };

  if (data.excludeInterventionId) {
    where.id = { not: data.excludeInterventionId };
  }

  const conflicting = await prisma.intervention.findFirst({
    where,
    include: {
      client: { select: { name: true, city: true } },
      machine: { include: { model: true } },
    },
  });

  if (conflicting) {
    res.json({
      hasConflict: true,
      message: `Conflit de planning détecté : le technicien est déjà affecté à une intervention chez ${conflicting.client.name} (${conflicting.client.city}) à cette heure.`,
      conflictingIntervention: conflicting,
    });
    return;
  }

  res.json({
    hasConflict: false,
    message: 'Technicien disponible sur ce créneau horaire.',
  });
};

const rescheduleSchema = z.object({
  scheduledDate: z.string(),
  technicianId: z.string().uuid().optional(),
  overrideConflict: z.boolean().default(false),
});

export const rescheduleIntervention = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const data = rescheduleSchema.parse(req.body);

  const existing = await prisma.intervention.findUnique({
    where: { id },
  });

  if (!existing) {
    res.status(404).json({ error: 'Intervention introuvable' });
    return;
  }

  const targetTechnicianId = data.technicianId || existing.technicianId;
  const targetDate = new Date(data.scheduledDate);

  if (!data.overrideConflict) {
    const startWindow = new Date(targetDate.getTime() - 2.5 * 60 * 60 * 1000);
    const endWindow = new Date(targetDate.getTime() + 2.5 * 60 * 60 * 1000);

    const conflict = await prisma.intervention.findFirst({
      where: {
        id: { not: id },
        technicianId: targetTechnicianId,
        status: { in: [InterventionStatus.PLANIFIEE, InterventionStatus.EN_COURS] },
        scheduledDate: {
          gte: startWindow,
          lte: endWindow,
        },
      },
      include: { client: true },
    });

    if (conflict) {
      res.status(409).json({
        error: `Conflit de planning : le technicien a déjà l'intervention ${conflict.interventionNumber} chez ${conflict.client.name} sur cette plage horaire.`,
        conflict,
      });
      return;
    }
  }

  const updated = await prisma.intervention.update({
    where: { id },
    data: {
      scheduledDate: targetDate,
      ...(data.technicianId && { technicianId: data.technicianId }),
    },
    include: {
      technician: true,
      client: true,
      machine: { include: { model: true } },
    },
  });

  await logAuditAction(req, 'RESCHEDULE', 'Intervention', updated.id, {
    oldDate: existing.scheduledDate,
    newDate: targetDate,
    technicianId: targetTechnicianId,
  });

  res.json({
    intervention: {
      ...updated,
      meterReadingPrints: updated.meterReadingPrints ? Number(updated.meterReadingPrints) : null,
    },
    message: 'Intervention replanifiée avec succès',
  });
};

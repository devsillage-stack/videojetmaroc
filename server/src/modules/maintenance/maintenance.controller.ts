import { Response } from 'express';
import { z } from 'zod';
import {
  TicketPriority,
  TicketStatus,
  InterventionType,
  InterventionStatus,
  MachineStatus,
} from '@prisma/client';
import prisma from '../../config/prisma.js';
import { AuthRequest } from '../../types/index.js';
import { logAuditAction } from '../../middlewares/audit.middleware.js';
import { getNextSequenceNumber } from '../../utils/sequencer.js';

const ticketSchema = z.object({
  machineId: z.string().uuid(),
  clientId: z.string().uuid(),
  assignedToId: z.string().uuid().optional().nullable(),
  priority: z.nativeEnum(TicketPriority).default(TicketPriority.NORMALE),
  faultDescription: z.string().min(5),
  errorCode: z.string().optional().nullable(),
  reportedBy: z.string().optional().nullable(),
});

const interventionSchema = z.object({
  ticketId: z.string().uuid().optional().nullable(),
  machineId: z.string().uuid(),
  clientId: z.string().uuid(),
  technicianId: z.string().uuid(),
  type: z.nativeEnum(InterventionType).default(InterventionType.CURATIVE),
  scheduledDate: z.string(),
  diagnosis: z.string().optional().nullable(),
  workDone: z.string().optional().nullable(),
  travelHours: z.number().min(0).default(0),
  travelDistanceKm: z.number().min(0).default(0),
  travelExpenses: z.number().min(0).default(0),
});

const completeInterventionSchema = z.object({
  hoursSpent: z.number().min(0.1),
  travelHours: z.number().min(0).optional().default(0),
  travelDistanceKm: z.number().min(0).optional().default(0),
  travelExpenses: z.number().min(0).optional().default(0),
  meterReadingHours: z.number().optional().nullable(),
  meterReadingPrints: z.number().optional().nullable(),
  diagnosis: z.string().min(3),
  workDone: z.string().min(3),
  customerFeedback: z.string().optional().nullable(),
  customerSignature: z.string().optional().nullable(), // Data URL base64
  customerSignerName: z.string().min(2),
  customerSignerTitle: z.string().optional().nullable(),
  partsUsed: z.array(
    z.object({
      productId: z.string().uuid(),
      batchId: z.string().uuid().optional().nullable(),
      quantity: z.number().positive(),
    })
  ).default([]),
});

// TICKETS
export const getTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, priority, clientId, machineId, search } = req.query;

  const where: any = {};
  if (status) where.status = status as TicketStatus;
  if (priority) where.priority = priority as TicketPriority;
  if (clientId) where.clientId = String(clientId);
  if (machineId) where.machineId = String(machineId);

  if (search) {
    where.OR = [
      { ticketNumber: { contains: String(search), mode: 'insensitive' } },
      { faultDescription: { contains: String(search), mode: 'insensitive' } },
      { errorCode: { contains: String(search), mode: 'insensitive' } },
      { client: { name: { contains: String(search), mode: 'insensitive' } } },
    ];
  }

  const tickets = await prisma.maintenanceTicket.findMany({
    where,
    include: {
      client: { select: { id: true, name: true, city: true } },
      machine: {
        include: { model: true, line: true },
      },
      assignedTo: { select: { id: true, firstName: true, lastName: true, phone: true } },
      _count: { select: { interventions: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ tickets });
};

export const getTicketById = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;

  const ticket = await prisma.maintenanceTicket.findUnique({
    where: { id },
    include: {
      client: true,
      machine: { include: { model: true, site: true, line: true } },
      assignedTo: true,
      interventions: {
        include: {
          technician: true,
          partsUsed: { include: { product: true } },
        },
      },
    },
  });

  if (!ticket) {
    res.status(404).json({ error: 'Ticket introuvable' });
    return;
  }

  res.json({ ticket });
};

export const createTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = ticketSchema.parse(req.body);

  const ticketNumber = await getNextSequenceNumber('ticket');

  const now = new Date();
  let slaResponseHours = 4;
  let slaResolutionHours = 24;

  if (data.priority === TicketPriority.CRITIQUE_LIGNE_ARRETEE) {
    slaResponseHours = 1;
    slaResolutionHours = 4;
  } else if (data.priority === TicketPriority.HAUTE) {
    slaResponseHours = 2;
    slaResolutionHours = 8;
  } else if (data.priority === TicketPriority.NORMALE) {
    slaResponseHours = 4;
    slaResolutionHours = 24;
  } else if (data.priority === TicketPriority.BASSE) {
    slaResponseHours = 8;
    slaResolutionHours = 48;
  }

  const slaTargetResponseAt = new Date(now.getTime() + slaResponseHours * 60 * 60 * 1000);
  const slaTargetResolutionAt = new Date(now.getTime() + slaResolutionHours * 60 * 60 * 1000);

  const ticket = await prisma.maintenanceTicket.create({
    data: {
      ticketNumber,
      machineId: data.machineId,
      clientId: data.clientId,
      assignedToId: data.assignedToId || null,
      priority: data.priority,
      faultDescription: data.faultDescription,
      errorCode: data.errorCode || null,
      reportedBy: data.reportedBy || null,
      status: data.assignedToId ? TicketStatus.ASSIGNE : TicketStatus.OUVERT,
      slaTargetResponseAt,
      slaTargetResolutionAt,
    },
    include: {
      machine: { include: { model: true } },
      client: true,
    },
  });

  // If priority is CRITIQUE, update machine status to EN_PANNE
  if (data.priority === TicketPriority.CRITIQUE_LIGNE_ARRETEE) {
    await prisma.machine.update({
      where: { id: data.machineId },
      data: { status: MachineStatus.EN_PANNE },
    });
  }

  await logAuditAction(req, 'CREATE', 'MaintenanceTicket', ticket.id, { ticketNumber });

  res.status(201).json({ ticket, message: 'Ticket d\'incident créé' });
};

export const updateTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { status, priority, assignedToId, resolutionNotes } = req.body;

  const existing = await prisma.maintenanceTicket.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: 'Ticket introuvable' });
    return;
  }

  const updateData: any = {
    ...(status && { status }),
    ...(priority && { priority }),
    ...(assignedToId !== undefined && { assignedToId }),
    ...(resolutionNotes !== undefined && { resolutionNotes }),
  };

  if (status === TicketStatus.EN_COURS && !existing.firstRespondedAt) {
    updateData.firstRespondedAt = new Date();
  }

  if ((status === TicketStatus.RESOLU || status === TicketStatus.CLOTURE) && !existing.resolvedAt) {
    updateData.resolvedAt = new Date();
  }

  const ticket = await prisma.maintenanceTicket.update({
    where: { id },
    data: updateData,
    include: { machine: true },
  });

  // If resolved, update machine back to OPERATIONNELLE if no other open tickets
  if (status === TicketStatus.RESOLU || status === TicketStatus.CLOTURE) {
    await prisma.machine.update({
      where: { id: ticket.machineId },
      data: { status: MachineStatus.OPERATIONNELLE },
    });
  }

  await logAuditAction(req, 'UPDATE', 'MaintenanceTicket', ticket.id, req.body);

  res.json({ ticket, message: 'Ticket mis à jour' });
};

// INTERVENTIONS
export const getInterventions = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, type, technicianId, clientId, machineId } = req.query;

  const where: any = {};
  if (status) where.status = status as InterventionStatus;
  if (type) where.type = type as InterventionType;
  if (technicianId) where.technicianId = String(technicianId);
  if (clientId) where.clientId = String(clientId);
  if (machineId) where.machineId = String(machineId);

  const interventions = await prisma.intervention.findMany({
    where,
    include: {
      technician: { select: { id: true, firstName: true, lastName: true, phone: true } },
      client: { select: { id: true, name: true, city: true } },
      machine: { include: { model: true, line: true } },
      ticket: { select: { ticketNumber: true, priority: true } },
      partsUsed: { include: { product: true } },
    },
    orderBy: { scheduledDate: 'desc' },
  });

  const formatted = interventions.map((item) => ({
    ...item,
    meterReadingPrints: item.meterReadingPrints ? Number(item.meterReadingPrints) : null,
  }));

  res.json({ interventions: formatted });
};

export const getInterventionById = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;

  const intervention = await prisma.intervention.findUnique({
    where: { id },
    include: {
      technician: true,
      client: true,
      machine: { include: { model: true, site: true, line: true } },
      ticket: true,
      partsUsed: {
        include: {
          product: true,
          batch: true,
        },
      },
    },
  });

  if (!intervention) {
    res.status(404).json({ error: 'Intervention introuvable' });
    return;
  }

  res.json({
    intervention: {
      ...intervention,
      meterReadingPrints: intervention.meterReadingPrints ? Number(intervention.meterReadingPrints) : null,
    },
  });
};

export const createIntervention = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = interventionSchema.parse(req.body);

  const interventionNumber = await getNextSequenceNumber('intervention');

  const intervention = await prisma.intervention.create({
    data: {
      interventionNumber,
      ticketId: data.ticketId || null,
      machineId: data.machineId,
      clientId: data.clientId,
      technicianId: data.technicianId,
      type: data.type,
      scheduledDate: new Date(data.scheduledDate),
      diagnosis: data.diagnosis || null,
      workDone: data.workDone || null,
      status: InterventionStatus.PLANIFIEE,
    },
    include: {
      technician: true,
      machine: { include: { model: true } },
      client: true,
    },
  });

  if (data.ticketId) {
    await prisma.maintenanceTicket.update({
      where: { id: data.ticketId },
      data: { status: TicketStatus.ASSIGNE, assignedToId: data.technicianId },
    });
  }

  await logAuditAction(req, 'CREATE', 'Intervention', intervention.id, { interventionNumber });

  res.status(201).json({ intervention, message: 'Intervention planifiée avec succès' });
};

export const startIntervention = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;

  const intervention = await prisma.intervention.update({
    where: { id },
    data: {
      status: InterventionStatus.EN_COURS,
      startedAt: new Date(),
    },
  });

  await prisma.machine.update({
    where: { id: intervention.machineId },
    data: { status: MachineStatus.EN_MAINTENANCE },
  });

  await logAuditAction(req, 'START', 'Intervention', intervention.id);

  res.json({ intervention, message: 'Intervention démarrée' });
};

export const completeIntervention = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const data = completeInterventionSchema.parse(req.body);

  const existing = await prisma.intervention.findUnique({
    where: { id },
    include: { machine: true },
  });

  if (!existing) {
    res.status(404).json({ error: 'Intervention introuvable' });
    return;
  }

  const completed = await prisma.$transaction(async (tx) => {
    // 1. Update machine meters and operational status
    const machineUpdate: any = {
      status: MachineStatus.OPERATIONNELLE,
    };
    if (data.meterReadingHours !== undefined && data.meterReadingHours !== null) {
      machineUpdate.totalOperatingHours = data.meterReadingHours;
    }
    if (data.meterReadingPrints !== undefined && data.meterReadingPrints !== null) {
      machineUpdate.totalPrintsCount = BigInt(data.meterReadingPrints);
    }

    await tx.machine.update({
      where: { id: existing.machineId },
      data: machineUpdate,
    });

    // 2. Handle spare parts consumption and stock decrements
    if (data.partsUsed && data.partsUsed.length > 0) {
      for (const part of data.partsUsed) {
        const product = await tx.product.findUnique({
          where: { id: part.productId },
        });

        if (product) {
          await tx.interventionPartUsed.create({
            data: {
              interventionId: id,
              productId: part.productId,
              batchId: part.batchId || null,
              quantity: part.quantity,
              unitPrice: product.unitPrice,
            },
          });

          // Decrement product stock
          await tx.product.update({
            where: { id: part.productId },
            data: {
              stockQuantity: {
                decrement: part.quantity,
              },
            },
          });

          // If batch provided, decrement batch quantity
          if (part.batchId) {
            await tx.stockBatch.update({
              where: { id: part.batchId },
              data: {
                quantity: {
                  decrement: part.quantity,
                },
              },
            });
          }

          // Traceability stock movement
          const movementNumber = await getNextSequenceNumber('stockMovement', undefined, tx);
          await tx.stockMovement.create({
            data: {
              movementNumber,
              productId: part.productId,
              batchId: part.batchId || null,
              userId: req.user?.userId || null,
              type: 'SORTIE_INTERVENTION',
              quantity: -part.quantity,
              stockBefore: product.stockQuantity,
              stockAfter: product.stockQuantity - part.quantity,
              reason: `Pièce utilisée pour intervention ${existing.interventionNumber}`,
            },
          });
        }
      }
    }

    // 3. Update intervention as completed
    const updatedIntervention = await tx.intervention.update({
      where: { id },
      data: {
        status: InterventionStatus.TERMINEE,
        completedAt: new Date(),
        hoursSpent: data.hoursSpent,
        travelHours: data.travelHours || 0.0,
        travelDistanceKm: data.travelDistanceKm || 0.0,
        travelExpenses: data.travelExpenses || 0.0,
        meterReadingHours: data.meterReadingHours || null,
        meterReadingPrints: data.meterReadingPrints ? BigInt(data.meterReadingPrints) : null,
        diagnosis: data.diagnosis,
        workDone: data.workDone,
        customerFeedback: data.customerFeedback || null,
        customerSignature: data.customerSignature || null,
        customerSignerName: data.customerSignerName,
        customerSignerTitle: data.customerSignerTitle || null,
      },
      include: {
        partsUsed: { include: { product: true } },
        technician: true,
        client: true,
        machine: { include: { model: true } },
      },
    });

    // 4. If linked to a ticket, resolve the ticket
    if (existing.ticketId) {
      const existingTicket = await tx.maintenanceTicket.findUnique({ where: { id: existing.ticketId } });
      await tx.maintenanceTicket.update({
        where: { id: existing.ticketId },
        data: {
          status: TicketStatus.RESOLU,
          resolvedAt: existingTicket?.resolvedAt || new Date(),
          resolutionNotes: `Résolu lors de l'intervention ${existing.interventionNumber} par ${(updatedIntervention as any).technician?.firstName || ''} ${(updatedIntervention as any).technician?.lastName || ''}. Travaux effectués: ${data.workDone}`,
        },
      });
    }

    return updatedIntervention;
  });

  await logAuditAction(req, 'COMPLETE', 'Intervention', completed.id, {
    hoursSpent: data.hoursSpent,
    signer: data.customerSignerName,
  });

  res.json({
    intervention: {
      ...completed,
      meterReadingPrints: completed.meterReadingPrints ? Number(completed.meterReadingPrints) : null,
    },
    message: 'Fiche d\'intervention clôturée et signée avec succès',
  });
};

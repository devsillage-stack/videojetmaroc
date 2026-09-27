import { Response } from 'express';
import { z } from 'zod';
import QRCode from 'qrcode';
import { MachineStatus, MachineTechnology } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { AuthRequest } from '../../types/index.js';
import { logAuditAction } from '../../middlewares/audit.middleware.js';

const machineModelSchema = z.object({
  modelNumber: z.string().min(1),
  family: z.nativeEnum(MachineTechnology),
  name: z.string().min(1),
  description: z.string().optional(),
  maxSpeed: z.string().optional(),
  resolution: z.string().optional(),
  ipRating: z.string().optional(),
  standardWarrantyMonths: z.number().default(12),
});

const machineSchema = z.object({
  serialNumber: z.string().min(3),
  modelId: z.string().uuid(),
  clientId: z.string().uuid(),
  siteId: z.string().uuid().optional().nullable(),
  lineId: z.string().uuid().optional().nullable(),
  status: z.nativeEnum(MachineStatus).default(MachineStatus.OPERATIONNELLE),
  installDate: z.string().optional(),
  warrantyEndDate: z.string().optional().nullable(),
  totalOperatingHours: z.number().default(0),
  totalPrintsCount: z.number().default(0),
  notes: z.string().optional().nullable(),
});

export const getModels = async (req: AuthRequest, res: Response): Promise<void> => {
  const models = await prisma.machineModel.findMany({
    orderBy: { modelNumber: 'asc' },
  });
  res.json({ models });
};

export const createModel = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = machineModelSchema.parse(req.body);
  const model = await prisma.machineModel.create({ data });
  await logAuditAction(req, 'CREATE', 'MachineModel', model.id, { modelNumber: model.modelNumber });
  res.status(201).json({ model, message: 'Modèle créé avec succès' });
};

export const getMachines = async (req: AuthRequest, res: Response): Promise<void> => {
  const { search, status, family, clientId, siteId } = req.query;

  const where: any = {};
  if (status) where.status = status as MachineStatus;
  if (clientId) where.clientId = String(clientId);
  if (siteId) where.siteId = String(siteId);
  if (family) {
    where.model = { family: family as MachineTechnology };
  }

  if (search) {
    where.OR = [
      { serialNumber: { contains: String(search), mode: 'insensitive' } },
      { client: { name: { contains: String(search), mode: 'insensitive' } } },
      { model: { name: { contains: String(search), mode: 'insensitive' } } },
    ];
  }

  const machines = await prisma.machine.findMany({
    where,
    include: {
      model: true,
      client: { select: { id: true, name: true, city: true } },
      site: { select: { id: true, name: true } },
      line: { select: { id: true, name: true } },
      _count: {
        select: {
          tickets: true,
          interventions: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = machines.map((m) => ({
    ...m,
    totalPrintsCount: Number(m.totalPrintsCount),
  }));

  res.json({ machines: formatted });
};

export const getMachineById = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;

  const machine = await prisma.machine.findUnique({
    where: { id },
    include: {
      model: true,
      client: true,
      site: true,
      line: true,
      tickets: {
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: { select: { firstName: true, lastName: true } },
        },
      },
      interventions: {
        orderBy: { scheduledDate: 'desc' },
        include: {
          technician: { select: { firstName: true, lastName: true, phone: true } },
          partsUsed: { include: { product: true } },
        },
      },
    },
  });

  if (!machine) {
    res.status(404).json({ error: 'Machine introuvable' });
    return;
  }

  const formatted = {
    ...machine,
    totalPrintsCount: Number(machine.totalPrintsCount),
    interventions: (machine as any).interventions.map((i: any) => ({
      ...i,
      meterReadingPrints: i.meterReadingPrints ? Number(i.meterReadingPrints) : null,
    })),
  };

  res.json({ machine: formatted });
};

export const createMachine = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = machineSchema.parse(req.body);

  const existing = await prisma.machine.findUnique({
    where: { serialNumber: data.serialNumber },
  });

  if (existing) {
    res.status(400).json({ error: 'Une machine avec ce numéro de série existe déjà' });
    return;
  }

  // Generate QR Code
  const qrContent = JSON.stringify({
    serialNumber: data.serialNumber,
    system: 'VIDEOJET MAROC INDUSTRIAL PLATFORM',
    url: `/machines/${data.serialNumber}`,
  });
  const qrCodeData = await QRCode.toDataURL(qrContent, { width: 300, margin: 2 });

  const machine = await prisma.machine.create({
    data: {
      serialNumber: data.serialNumber,
      modelId: data.modelId,
      clientId: data.clientId,
      siteId: data.siteId || null,
      lineId: data.lineId || null,
      status: data.status,
      installDate: data.installDate ? new Date(data.installDate) : new Date(),
      warrantyEndDate: data.warrantyEndDate ? new Date(data.warrantyEndDate) : null,
      totalOperatingHours: data.totalOperatingHours,
      totalPrintsCount: BigInt(data.totalPrintsCount),
      qrCodeData,
      notes: data.notes || null,
    },
    include: {
      model: true,
      client: true,
    },
  });

  await logAuditAction(req, 'CREATE', 'Machine', machine.id, { serialNumber: machine.serialNumber });

  res.status(201).json({
    machine: { ...machine, totalPrintsCount: Number(machine.totalPrintsCount) },
    message: 'Machine enregistrée avec succès dans le parc',
  });
};

export const updateMachine = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const data = machineSchema.partial().parse(req.body);

  const updateData: any = { ...data };
  if (data.installDate) updateData.installDate = new Date(data.installDate);
  if (data.warrantyEndDate) updateData.warrantyEndDate = new Date(data.warrantyEndDate);
  if (data.totalPrintsCount !== undefined) updateData.totalPrintsCount = BigInt(data.totalPrintsCount);

  const machine = await prisma.machine.update({
    where: { id },
    data: updateData,
    include: { model: true, client: true },
  });

  await logAuditAction(req, 'UPDATE', 'Machine', machine.id, data);

  res.json({
    machine: { ...machine, totalPrintsCount: Number(machine.totalPrintsCount) },
    message: 'Machine mise à jour',
  });
};

export const deleteMachine = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;

  await prisma.machine.delete({ where: { id } });
  await logAuditAction(req, 'DELETE', 'Machine', id);

  res.json({ message: 'Machine supprimée du parc' });
};

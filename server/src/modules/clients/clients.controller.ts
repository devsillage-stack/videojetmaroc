import { Response } from 'express';
import { z } from 'zod';
import { ClientType, IndustrySector, ClientStatus } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { AuthRequest } from '../../types/index.js';
import { logAuditAction } from '../../middlewares/audit.middleware.js';

const clientSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  type: z.nativeEnum(ClientType).default(ClientType.CLIENT),
  industrySector: z.nativeEnum(IndustrySector).default(IndustrySector.AGROALIMENTAIRE),
  ice: z.string().optional().nullable(),
  rc: z.string().optional().nullable(),
  ifTax: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().default('Casablanca'),
  country: z.string().default('Maroc'),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  website: z.string().optional().nullable(),
  status: z.nativeEnum(ClientStatus).default(ClientStatus.ACTIF),
  defaultCurrency: z.string().default('MAD'),
  creditLimit: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const getClients = async (req: AuthRequest, res: Response): Promise<void> => {
  const { search, type, sector, status, city } = req.query;

  const where: any = {};
  if (type) where.type = type as ClientType;
  if (sector) where.industrySector = sector as IndustrySector;
  if (status) where.status = status as ClientStatus;
  if (city) where.city = { contains: String(city), mode: 'insensitive' };

  if (search) {
    where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { code: { contains: String(search), mode: 'insensitive' } },
      { city: { contains: String(search), mode: 'insensitive' } },
      { ice: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  const clients = await prisma.client.findMany({
    where,
    include: {
      _count: {
        select: {
          machines: true,
          contracts: true,
          tickets: true,
          quotes: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ clients });
};

export const getClientById = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: { isPrimary: 'desc' } },
      sites: {
        include: {
          productionLines: true,
        },
      },
      machines: {
        include: {
          model: true,
          site: true,
          line: true,
        },
      },
      contracts: {
        orderBy: { endDate: 'desc' },
      },
      tickets: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          machine: { include: { model: true } },
          assignedTo: { select: { firstName: true, lastName: true } },
        },
      },
      quotes: {
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!client) {
    res.status(404).json({ error: 'Client introuvable' });
    return;
  }

  res.json({ client });
};

export const createClient = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = clientSchema.parse(req.body);

  const existing = await prisma.client.findUnique({
    where: { code: data.code },
  });

  if (existing) {
    res.status(400).json({ error: 'Un client avec ce code existe déjà' });
    return;
  }

  const client = await prisma.client.create({
    data: {
      ...data,
      email: data.email || null,
    },
  });

  await logAuditAction(req, 'CREATE', 'Client', client.id, { name: client.name, code: client.code });

  res.status(201).json({ client, message: 'Client créé avec succès' });
};

export const updateClient = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const data = clientSchema.partial().parse(req.body);

  const client = await prisma.client.update({
    where: { id },
    data: {
      ...data,
      email: data.email || null,
    },
  });

  await logAuditAction(req, 'UPDATE', 'Client', client.id, data);

  res.json({ client, message: 'Client mis à jour' });
};

export const deleteClient = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;

  await prisma.client.delete({
    where: { id },
  });

  await logAuditAction(req, 'DELETE', 'Client', id);

  res.json({ message: 'Client supprimé' });
};

// Contacts
export const addContact = async (req: AuthRequest, res: Response): Promise<void> => {
  const clientId = req.params.clientId as string;
  const { firstName, lastName, position, phone, email, isPrimary } = req.body;

  const contact = await prisma.clientContact.create({
    data: {
      clientId,
      firstName,
      lastName,
      position,
      phone,
      email,
      isPrimary: !!isPrimary,
    },
  });

  res.status(201).json({ contact, message: 'Contact ajouté' });
};

// Sites & Lines
export const addSite = async (req: AuthRequest, res: Response): Promise<void> => {
  const clientId = req.params.clientId as string;
  const { name, address, city, contactPerson, phone } = req.body;

  const site = await prisma.site.create({
    data: {
      clientId,
      name,
      address,
      city: city || 'Casablanca',
      contactPerson,
      phone,
    },
  });

  res.status(201).json({ site, message: 'Site industriel ajouté' });
};

export const addProductionLine = async (req: AuthRequest, res: Response): Promise<void> => {
  const siteId = req.params.siteId as string;
  const { name, speedUnitsPerHour, productType } = req.body;

  const line = await prisma.productionLine.create({
    data: {
      siteId,
      name,
      speedUnitsPerHour: speedUnitsPerHour ? parseInt(speedUnitsPerHour, 10) : null,
      productType,
    },
  });

  res.status(201).json({ line, message: 'Ligne de production ajoutée' });
};

import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Role } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { AuthRequest } from '../../types/index.js';
import { logAuditAction } from '../../middlewares/audit.middleware.js';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.nativeEnum(Role),
  phone: z.string().optional(),
});

const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { role, search } = req.query;

  const where: any = {};
  if (role) {
    where.role = role as Role;
  }
  if (search) {
    where.OR = [
      { firstName: { contains: String(search), mode: 'insensitive' } },
      { lastName: { contains: String(search), mode: 'insensitive' } },
      { email: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      phone: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ users });
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      phone: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: 'Utilisateur introuvable' });
    return;
  }

  res.json({ user });
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = createUserSchema.parse(req.body);

  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existing) {
    res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà' });
    return;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      phone: data.phone,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      phone: true,
      isActive: true,
      createdAt: true,
    },
  });

  await logAuditAction(req, 'CREATE', 'User', user.id, { email: user.email, role: user.role });

  res.status(201).json({ user, message: 'Utilisateur créé avec succès' });
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const data = updateUserSchema.parse(req.body);

  const updatePayload: any = { ...data };
  if (data.password) {
    updatePayload.passwordHash = await bcrypt.hash(data.password, 10);
    delete updatePayload.password;
  }

  const user = await prisma.user.update({
    where: { id },
    data: updatePayload,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      phone: true,
      isActive: true,
      updatedAt: true,
    },
  });

  await logAuditAction(req, 'UPDATE', 'User', user.id, data);

  res.json({ user, message: 'Utilisateur mis à jour' });
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;

  if (req.user?.userId === id) {
    res.status(400).json({ error: 'Impossible de supprimer votre propre compte' });
    return;
  }

  await prisma.user.delete({
    where: { id },
  });

  await logAuditAction(req, 'DELETE', 'User', id);

  res.json({ message: 'Utilisateur supprimé' });
};

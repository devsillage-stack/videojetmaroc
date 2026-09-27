import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../../config/prisma.js';
import { ENV } from '../../config/env.js';
import { AuthRequest } from '../../types/index.js';
import { logAuditAction } from '../../middlewares/audit.middleware.js';

const loginSchema = z.object({
  email: z.string().email('Format email invalide'),
  password: z.string().min(4, 'Mot de passe requis'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z.string().min(6, 'Le nouveau mot de passe doit contenir au moins 6 caractères'),
});

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user || !user.isActive) {
    res.status(401).json({ error: 'Identifiants invalides ou compte inactif' });
    return;
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    res.status(401).json({ error: 'Identifiants invalides' });
    return;
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  );

  const authReq = req as AuthRequest;
  authReq.user = { userId: user.id, email: user.email, role: user.role };
  await logAuditAction(authReq, 'LOGIN', 'User', user.id, { email: user.email });

  res.json({
    message: 'Connexion réussie',
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
    },
  });
};

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Non authentifié' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      phone: true,
      avatarUrl: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: 'Utilisateur introuvable' });
    return;
  }

  res.json({ user });
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Non authentifié' });
    return;
  }

  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
  });

  if (!user) {
    res.status(404).json({ error: 'Utilisateur introuvable' });
    return;
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    res.status(400).json({ error: 'Le mot de passe actuel est incorrect' });
    return;
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  await logAuditAction(req, 'CHANGE_PASSWORD', 'User', user.id);

  res.json({ message: 'Mot de passe modifié avec succès' });
};

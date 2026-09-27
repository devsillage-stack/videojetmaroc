import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import prisma from '../config/prisma.js';

export const logAuditAction = async (
  req: AuthRequest,
  action: string,
  entity: string,
  entityId?: string | null,
  details?: Record<string, any>
) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId || null,
        userEmail: req.user?.email || null,
        action,
        entity,
        entityId: entityId || null,
        details: details || {},
        ipAddress: typeof ip === 'string' ? ip : ip ? String(ip[0]) : null,
        userAgent: userAgent || null,
      },
    });
  } catch (error) {
    console.error('Audit log creation failed:', error);
  }
};

import { Response } from 'express';
import prisma from '../../config/prisma.js';
import { AuthRequest } from '../../types/index.js';

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  const { action, entity, userId, limit = '50', page = '1' } = req.query;

  const take = Math.min(parseInt(String(limit), 10) || 50, 100);
  const skip = ((parseInt(String(page), 10) || 1) - 1) * take;

  const where: any = {};
  if (action) where.action = String(action);
  if (entity) where.entity = String(entity);
  if (userId) where.userId = String(userId);

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, role: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({
    logs,
    pagination: {
      total,
      page: parseInt(String(page), 10) || 1,
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  });
};

import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthRequest } from '../types/index.js';

export const requireRoles = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }

    if (req.user.role === Role.SUPER_ADMIN) {
      next();
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Accès refusé : le rôle [${req.user.role}] n'a pas les droits nécessaires pour cette opération`,
      });
      return;
    }

    next();
  };
};

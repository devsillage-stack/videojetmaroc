import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.originalUrl || req.url;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  console.error(`[${timestamp}] [ERROR] ${method} ${path} (from ${ip}):`, err);

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Erreur de validation des données fournies',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta?.target.join(', ') : err.meta?.target;
      res.status(409).json({
        error: `Conflit d'unicité : un enregistrement avec ce champ (${target || 'valeur unique'}) existe déjà.`,
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        error: 'Élément introuvable ou déjà supprimé.',
      });
      return;
    }
  }

  const statusCode = err.statusCode || (err.name === 'UnauthorizedError' ? 401 : 500);
  res.status(statusCode).json({
    error: err.message || 'Une erreur interne est survenue sur le serveur NEXORA',
  });
};

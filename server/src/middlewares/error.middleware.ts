import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error('[Error Handler]', err);

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Erreur de validation des données',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  const statusCode = err.statusCode || (err.name === 'UnauthorizedError' ? 401 : 500);
  res.status(statusCode).json({
    error: err.message || 'Une erreur interne est survenue sur le serveur',
  });
};

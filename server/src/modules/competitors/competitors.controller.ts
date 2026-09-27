import { Request, Response } from 'express';
import prisma from '../../config/prisma.js';
import { MachineTechnology } from '@prisma/client';

export class CompetitorsController {
  // GET /api/competitors
  static async getAll(req: Request, res: Response): Promise<void> {
    const { technology, search } = req.query;

    const where: any = {};
    if (technology) where.technology = technology as MachineTechnology;
    if (search) {
      where.OR = [
        { brand: { contains: search as string, mode: 'insensitive' } },
        { modelName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const competitors = await prisma.competitor.findMany({
      where,
      orderBy: { brand: 'asc' },
    });

    res.json({ competitors });
  }

  // GET /api/competitors/:id
  static async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const competitor = await prisma.competitor.findUnique({
      where: { id: id as string },
    });

    if (!competitor) {
      res.status(404).json({ error: 'Fiche concurrent introuvable' });
      return;
    }

    res.json({ competitor });
  }

  // POST /api/competitors
  static async create(req: Request, res: Response): Promise<void> {
    const {
      brand,
      modelName,
      technology,
      indicativePrice,
      currency = 'MAD',
      technicalPoints,
      commercialStrengths,
      reportedWeaknesses,
      clientObjections,
      videojetWinningPitch,
    } = req.body;

    if (!brand || !modelName) {
      res.status(400).json({ error: 'La marque et le modèle concurrent sont requis' });
      return;
    }

    const competitor = await prisma.competitor.create({
      data: {
        brand,
        modelName,
        technology: technology || MachineTechnology.CIJ,
        indicativePrice: indicativePrice ? Number(indicativePrice) : null,
        currency,
        technicalPoints,
        commercialStrengths,
        reportedWeaknesses,
        clientObjections,
        videojetWinningPitch,
      },
    });

    res.status(201).json({ competitor, message: 'Fiche concurrent créée avec succès' });
  }

  // PUT /api/competitors/:id
  static async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const data = req.body;

    const competitor = await prisma.competitor.update({
      where: { id: id as string },
      data: {
        ...data,
        indicativePrice: data.indicativePrice ? Number(data.indicativePrice) : undefined,
      },
    });

    res.json({ competitor, message: 'Fiche concurrent mise à jour' });
  }
}

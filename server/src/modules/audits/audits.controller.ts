import { Request, Response } from 'express';
import prisma from '../../config/prisma.js';
import { generateTechnicalRecommendation } from './recommendation.engine.js';
import { AuditStatus } from '@prisma/client';

export class AuditsController {
  // GET /api/audits
  static async getAll(req: Request, res: Response): Promise<void> {
    const { clientId, status } = req.query;

    const where: any = {};
    if (clientId) where.clientId = clientId as string;
    if (status) where.status = status as AuditStatus;

    const audits = await prisma.industrialAudit.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, code: true, city: true } },
        site: { select: { id: true, name: true, city: true } },
        line: { select: { id: true, name: true, productType: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        recommendations: {
          include: {
            recommendedModel: { select: { id: true, modelNumber: true, name: true, family: true } },
          },
        },
        tcoCalculations: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ audits });
  }

  // GET /api/audits/:id
  static async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const audit = await prisma.industrialAudit.findUnique({
      where: { id: id as string },
      include: {
        client: true,
        site: true,
        line: true,
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        recommendations: {
          include: {
            recommendedModel: true,
          },
        },
        tcoCalculations: {
          include: {
            machineModel: true,
          },
        },
      },
    });

    if (!audit) {
      res.status(404).json({ error: 'Audit industriel introuvable' });
      return;
    }

    res.json({ audit });
  }

  // POST /api/audits
  static async create(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const {

      clientId,
      siteId,
      lineId,
      packagingSubstrate,
      lineSpeedMpm,
      unitsPerHour,
      ambientTempMin,
      ambientTempMax,
      dustLevel,
      washdownExposure,
      printLocation,
      messageHeightMm,
      messageLinesCount,
      opticalDistanceMm,
      existingMachineBrand,
      existingMachineModel,
      existingMachineAgeYears,
      currentPainPoints,
      currentConsumableCostPerYear,
      currentDowntimeHoursPerYear,
      notes,
      photos,
    } = req.body;

    if (!clientId || !packagingSubstrate) {
      res.status(400).json({ error: 'Le client et le substrat d\'emballage sont obligatoires' });
      return;
    }

    const count = await prisma.industrialAudit.count();
    const auditNumber = `AUD-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Auto generate recommendation
    const recResult = generateTechnicalRecommendation({
      packagingSubstrate,
      unitsPerHour: unitsPerHour ? Number(unitsPerHour) : null,
      lineSpeedMpm: lineSpeedMpm ? Number(lineSpeedMpm) : null,
      dustLevel,
      washdownExposure: Boolean(washdownExposure),
      messageLinesCount: messageLinesCount ? Number(messageLinesCount) : 2,
      ambientTempMin: ambientTempMin ? Number(ambientTempMin) : null,
      ambientTempMax: ambientTempMax ? Number(ambientTempMax) : null,
    });

    // Find recommended model
    const matchedModel = await prisma.machineModel.findFirst({
      where: { modelNumber: recResult.modelNumber },
    });

    const audit = await prisma.industrialAudit.create({
      data: {
        auditNumber,
        client: { connect: { id: clientId } },
        createdBy: { connect: { id: userId } },
        site: siteId ? { connect: { id: siteId } } : undefined,
        line: lineId ? { connect: { id: lineId } } : undefined,
        status: AuditStatus.VALIDE,
        packagingSubstrate,
        lineSpeedMpm: lineSpeedMpm ? Number(lineSpeedMpm) : null,
        unitsPerHour: unitsPerHour ? Number(unitsPerHour) : null,
        ambientTempMin: ambientTempMin ? Number(ambientTempMin) : null,
        ambientTempMax: ambientTempMax ? Number(ambientTempMax) : null,
        dustLevel: dustLevel || 'Faible',
        washdownExposure: Boolean(washdownExposure),
        printLocation: printLocation || null,
        messageHeightMm: messageHeightMm ? Number(messageHeightMm) : null,
        messageLinesCount: messageLinesCount ? Number(messageLinesCount) : 2,
        opticalDistanceMm: opticalDistanceMm ? Number(opticalDistanceMm) : null,
        existingMachineBrand: existingMachineBrand || null,
        existingMachineModel: existingMachineModel || null,
        existingMachineAgeYears: existingMachineAgeYears ? Number(existingMachineAgeYears) : null,
        currentPainPoints: currentPainPoints || null,
        currentConsumableCostPerYear: currentConsumableCostPerYear ? Number(currentConsumableCostPerYear) : null,
        currentDowntimeHoursPerYear: currentDowntimeHoursPerYear ? Number(currentDowntimeHoursPerYear) : null,
        photos: Array.isArray(photos) ? photos : [],
        notes: notes || null,
        recommendations: {
          create: [
            {
              recommendedTech: recResult.recommendedTech,
              recommendedModelId: matchedModel ? matchedModel.id : null,
              confidenceScore: recResult.confidenceScore,
              justification: recResult.justification,
              suggestedConsumable: recResult.suggestedConsumable,
              assumptions: recResult.assumptions,
              missingDataNotes: recResult.missingDataNotes,
            },
          ],
        },
      },
      include: {
        recommendations: {
          include: { recommendedModel: true },
        },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        userEmail: (req as any).user?.email,
        action: 'CREATE_AUDIT',
        entity: 'IndustrialAudit',
        entityId: audit.id,
        details: { auditNumber: audit.auditNumber, clientId, recommended: recResult.modelNumber },
      },
    });

    res.status(201).json({ audit, message: 'Audit industriel enregistré et recommandation calculée avec succès' });
  }

  // POST /api/audits/:id/tco
  static async calculateTco(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const {
      calculationName,
      machineModelId,
      existingAnnualConsumableCost = 0,
      existingAnnualMaintenanceCost = 0,
      existingAnnualDowntimeHours = 0,
      hourlyDowntimeCost = 1000,
      equipmentInvestmentPrice = 120000,
      installationAndTrainingPrice = 8000,
      videojetAnnualConsumableCost = 30000,
      videojetAnnualMaintenanceCost = 15000,
      annualUnitsProduced = 10000000,
    } = req.body;

    const audit = await prisma.industrialAudit.findUnique({
      where: { id: id as string },
      include: { client: true },
    });

    if (!audit) {
      res.status(404).json({ error: 'Audit introuvable' });
      return;
    }

    const count = await prisma.tcoCalculation.count();
    const calculationNumber = `TCO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const existingDowntimeLosses = Number(existingAnnualDowntimeHours) * Number(hourlyDowntimeCost);
    const totalExistingAnnualCost =
      Number(existingAnnualConsumableCost) + Number(existingAnnualMaintenanceCost) + existingDowntimeLosses;

    const totalVideojetFirstYearCost =
      Number(equipmentInvestmentPrice) +
      Number(installationAndTrainingPrice) +
      Number(videojetAnnualConsumableCost) +
      Number(videojetAnnualMaintenanceCost);

    const totalVideojetSubsequentAnnualCost =
      Number(videojetAnnualConsumableCost) + Number(videojetAnnualMaintenanceCost);

    const estimatedAnnualSavings = totalExistingAnnualCost - totalVideojetSubsequentAnnualCost;
    const totalInitialInvestment = Number(equipmentInvestmentPrice) + Number(installationAndTrainingPrice);
    const paybackPeriodMonths =
      estimatedAnnualSavings > 0 ? (totalInitialInvestment / estimatedAnnualSavings) * 12 : 999;

    const costPerMarkedProductExisting =
      Number(annualUnitsProduced) > 0 ? totalExistingAnnualCost / Number(annualUnitsProduced) : 0;
    const costPerMarkedProductVideojet =
      Number(annualUnitsProduced) > 0 ? totalVideojetSubsequentAnnualCost / Number(annualUnitsProduced) : 0;

    const tco = await prisma.tcoCalculation.create({
      data: {
        calculationNumber,
        auditId: audit.id,
        clientId: audit.clientId,
        machineModelId: machineModelId || null,
        calculationName: calculationName || `Étude TCO - ${audit.auditNumber}`,
        existingAnnualConsumableCost: Number(existingAnnualConsumableCost),
        existingAnnualMaintenanceCost: Number(existingAnnualMaintenanceCost),
        existingAnnualDowntimeLosses: existingDowntimeLosses,
        totalExistingAnnualCost,
        equipmentInvestmentPrice: Number(equipmentInvestmentPrice),
        installationAndTrainingPrice: Number(installationAndTrainingPrice),
        videojetAnnualConsumableCost: Number(videojetAnnualConsumableCost),
        videojetAnnualMaintenanceCost: Number(videojetAnnualMaintenanceCost),
        totalVideojetFirstYearCost,
        totalVideojetSubsequentAnnualCost,
        estimatedAnnualSavings,
        paybackPeriodMonths: Math.round(paybackPeriodMonths * 10) / 10,
        costPerMarkedProductExisting: Math.round(costPerMarkedProductExisting * 100000) / 100000,
        costPerMarkedProductVideojet: Math.round(costPerMarkedProductVideojet * 100000) / 100000,
      },
      include: {
        machineModel: true,
        client: true,
      },
    });

    res.status(201).json({ tco, message: 'Calcul TCO/ROI généré avec succès' });
  }

  // GET /api/tco
  static async getAllTco(req: Request, res: Response): Promise<void> {
    const tcoList = await prisma.tcoCalculation.findMany({
      include: {
        client: { select: { id: true, name: true, code: true } },
        machineModel: { select: { id: true, modelNumber: true, name: true, family: true } },
        audit: { select: { id: true, auditNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ tcoList });
  }

  // GET /api/tco/:id
  static async getTcoById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const tco = await prisma.tcoCalculation.findUnique({
      where: { id: id as string },
      include: {
        client: true,
        machineModel: true,
        audit: true,
      },
    });

    if (!tco) {
      res.status(404).json({ error: 'Calcul TCO introuvable' });
      return;
    }

    res.json({ tco });
  }
}

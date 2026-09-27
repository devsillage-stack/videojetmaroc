import { Request, Response } from 'express';
import prisma from '../../config/prisma.js';
import { TicketPriority, MachineStatus, ActivityType } from '@prisma/client';

export class Fleet360Controller {
  // GET /api/fleet360/machines/:id
  static async getMachine360(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const machine = await prisma.machine.findUnique({
      where: { id: id as string },
      include: {
        model: true,
        client: { select: { id: true, name: true, code: true, city: true, phone: true } },
        site: true,
        line: true,
        tickets: {
          include: {
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        interventions: {
          include: {
            technician: { select: { id: true, firstName: true, lastName: true } },
            partsUsed: {
              include: { product: true },
            },
          },
          orderBy: { scheduledDate: 'desc' },
        },
      },
    });

    if (!machine) {
      res.status(404).json({ error: 'Machine introuvable' });
      return;
    }

    // Warranty calculation
    const now = new Date();
    const isUnderWarranty = machine.warrantyEndDate ? new Date(machine.warrantyEndDate) > now : false;
    const warrantyDaysRemaining = machine.warrantyEndDate
      ? Math.max(0, Math.ceil((new Date(machine.warrantyEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    // Age in years
    const ageYears = Math.round(((now.getTime() - new Date(machine.installDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) * 10) / 10;

    // Critical breakdowns count
    const criticalBreakdownsCount = machine.tickets.filter(
      (t) => t.priority === TicketPriority.CRITIQUE_LIGNE_ARRETEE
    ).length;

    // Total hours spent in maintenance
    const totalMaintenanceHours = machine.interventions.reduce((sum, inv) => sum + (inv.hoursSpent || 0), 0);

    // Replacement Risk Score (0 - 100)
    let replacementScore = 0;
    if (ageYears >= 7) replacementScore += 45;
    else if (ageYears >= 5) replacementScore += 30;
    else if (ageYears >= 3) replacementScore += 15;

    if (criticalBreakdownsCount >= 3) replacementScore += 35;
    else if (criticalBreakdownsCount >= 1) replacementScore += 15;

    if (machine.totalOperatingHours > 25000) replacementScore += 20;
    else if (machine.totalOperatingHours > 15000) replacementScore += 10;

    replacementScore = Math.min(100, replacementScore);

    // Active maintenance contract
    const contract = await prisma.maintenanceContract.findFirst({
      where: { clientId: machine.clientId, status: 'ACTIF' },
    });

    res.json({
      machine,
      metrics: {
        isUnderWarranty,
        warrantyDaysRemaining,
        ageYears,
        criticalBreakdownsCount,
        totalInterventionsCount: machine.interventions.length,
        totalMaintenanceHours: Math.round(totalMaintenanceHours * 10) / 10,
        replacementScore,
        isReplacementRecommended: replacementScore >= 60,
      },
      contract,
    });
  }

  // GET /api/fleet360/clients/:id
  static async getCustomer360(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const client = await prisma.client.findUnique({
      where: { id: id as string },
      include: {
        contacts: true,
        sites: {
          include: { productionLines: true },
        },
        machines: {
          include: { model: true },
        },
        contracts: true,
        opportunities: {
          include: { assignedTo: { select: { id: true, firstName: true, lastName: true } } },
        },
        quotes: {
          include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          orderBy: { issueDate: 'desc' },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
        },
        audits: {
          include: { recommendations: true },
          orderBy: { createdAt: 'desc' },
        },
        tickets: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { performedAt: 'desc' },
        },
      },
    });

    if (!client) {
      res.status(404).json({ error: 'Client introuvable' });
      return;
    }

    // Aggregates
    const totalBilled = client.invoices.reduce((acc, inv) => acc + (inv.totalTtc || 0), 0);
    const totalPaid = client.invoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
    const pendingQuotesValue = client.quotes
      .filter((q) => q.status === 'ENVOYE' || q.status === 'EN_ATTENTE_VALIDATION')
      .reduce((acc, q) => acc + (q.totalTtc || 0), 0);

    const operationalMachines = client.machines.filter((m) => m.status === MachineStatus.OPERATIONNELLE).length;
    const fleetAvailabilityRate =
      client.machines.length > 0 ? Math.round((operationalMachines / client.machines.length) * 100) : 100;

    res.json({
      client,
      financialSummary: {
        totalBilled,
        totalPaid,
        balanceDue: totalBilled - totalPaid,
        pendingQuotesValue,
      },
      fleetSummary: {
        totalMachines: client.machines.length,
        operationalMachines,
        fleetAvailabilityRate,
      },
    });
  }

  // GET /api/fleet360/replacement-alerts
  static async getReplacementAlerts(req: Request, res: Response): Promise<void> {
    const machines = await prisma.machine.findMany({
      include: {
        model: true,
        client: { select: { id: true, name: true, code: true, city: true } },
        tickets: {
          where: { priority: TicketPriority.CRITIQUE_LIGNE_ARRETEE },
        },
      },
    });

    const now = new Date();
    const alerts: any[] = [];

    for (const m of machines) {
      const ageYears = Math.round(((now.getTime() - new Date(m.installDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) * 10) / 10;
      const criticalCount = m.tickets.length;

      let score = 0;
      const reasons: string[] = [];

      if (ageYears >= 6) {
        score += 45;
        reasons.push(`Âge de la machine : ${ageYears} ans (obsolescence technologique)`);
      }
      if (criticalCount >= 2) {
        score += 40;
        reasons.push(`${criticalCount} arrêts critiques enregistrés`);
      }
      if (m.totalOperatingHours >= 20000) {
        score += 25;
        reasons.push(`Compteur horaire élevé : ${Math.round(m.totalOperatingHours)} heures`);
      }

      if (score >= 50) {
        // Suggest upgrade
        let suggestedUpgrade = 'Videojet 1880 MAXIMiZE™';
        if (m.model.family === 'LASER_CO2') suggestedUpgrade = 'Videojet 3340 Laser CO2 30W';
        if (m.model.family === 'TTO') suggestedUpgrade = 'Videojet DataFlex 6530';

        alerts.push({
          machineId: m.id,
          serialNumber: m.serialNumber,
          currentModel: m.model.name,
          client: m.client,
          ageYears,
          operatingHours: m.totalOperatingHours,
          criticalBreakdownsCount: criticalCount,
          replacementScore: Math.min(100, score),
          reasons,
          suggestedUpgrade,
        });
      }
    }

    alerts.sort((a, b) => b.replacementScore - a.replacementScore);

    res.json({ alerts, totalAlerts: alerts.length });
  }

  // POST /api/fleet360/clients/:id/activities
  static async addCustomerActivity(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const { type, title, description, performedAt } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Le titre de l\'activité est requis' });
      return;
    }

    const activity = await prisma.customerActivity.create({
      data: {
        client: { connect: { id: id as string } },
        user: { connect: { id: userId } },
        type: (type as ActivityType) || ActivityType.NOTE,
        title,
        description: description || null,
        performedAt: performedAt ? new Date(performedAt) : new Date(),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });


    res.status(201).json({ activity, message: 'Activité enregistrée dans la timeline' });
  }
}

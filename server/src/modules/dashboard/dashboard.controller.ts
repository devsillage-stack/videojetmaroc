import { Response } from 'express';
import {
  MachineStatus,
  TicketStatus,
  TicketPriority,
  InterventionStatus,
  QuoteStatus,
  OpportunityStage,
  Role,
} from '@prisma/client';
import prisma from '../../config/prisma.js';
import { AuthRequest } from '../../types/index.js';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const isManagement = req.user && ([Role.SUPER_ADMIN, Role.ADMIN, Role.DIRECTION, Role.COMPTABILITE] as Role[]).includes(req.user.role);

  // General counts
  const totalClients = await prisma.client.count();
  const totalMachines = await prisma.machine.count();
  const operationalMachines = await prisma.machine.count({
    where: { status: MachineStatus.OPERATIONNELLE },
  });
  const faultyMachines = await prisma.machine.count({
    where: { status: MachineStatus.EN_PANNE },
  });

  // SAV / Maintenance metrics
  const openTickets = await prisma.maintenanceTicket.count({
    where: { status: { in: [TicketStatus.OUVERT, TicketStatus.ASSIGNE, TicketStatus.EN_COURS] } },
  });
  const criticalTickets = await prisma.maintenanceTicket.count({
    where: {
      status: { notIn: [TicketStatus.RESOLU, TicketStatus.CLOTURE] },
      priority: TicketPriority.CRITIQUE_LIGNE_ARRETEE,
    },
  });
  const completedInterventions = await prisma.intervention.count({
    where: { status: InterventionStatus.TERMINEE },
  });

  // Inventory alerts
  const lowStockCount = await prisma.product.count({
    where: {
      stockQuantity: { lte: 10 },
    },
  });

  const alertDate = new Date();
  alertDate.setDate(alertDate.getDate() + 60);
  const expiringBatchesCount = await prisma.stockBatch.count({
    where: {
      quantity: { gt: 0 },
      expirationDate: { lte: alertDate },
    },
  });

  // Financial / Commercial metrics (guarded for non-management)
  let financialStats = null;
  if (isManagement) {
    const quotes = await prisma.quote.findMany({
      select: {
        totalHt: true,
        totalTtc: true,
        estimatedMargin: true,
        status: true,
        currency: true,
        exchangeRate: true,
      },
    });

    const invoices = await prisma.invoice.findMany({
      select: {
        totalTtc: true,
        paidAmount: true,
        status: true,
      },
    });

    const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.totalTtc, 0);
    const totalCollected = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);

    const acceptedQuotes = quotes.filter((q) => q.status === QuoteStatus.ACCEPTE);
    const totalRevenueAccepted = acceptedQuotes.reduce((acc, q) => acc + q.totalHt * q.exchangeRate, 0);
    const totalMarginAccepted = acceptedQuotes.reduce((acc, q) => acc + q.estimatedMargin * q.exchangeRate, 0);
    const globalMarginPercent = totalRevenueAccepted > 0 ? (totalMarginAccepted / totalRevenueAccepted) * 100 : 0;

    financialStats = {
      totalInvoiced: Math.round(totalInvoiced),
      totalCollected: Math.round(totalCollected),
      totalRevenueAccepted: Math.round(totalRevenueAccepted),
      totalMarginAccepted: Math.round(totalMarginAccepted),
      globalMarginPercent: Math.round(globalMarginPercent * 10) / 10,
    };
  }

  // Machines by family breakdown
  const machinesByFamilyRaw = await prisma.machineModel.findMany({
    include: {
      _count: { select: { machines: true } },
    },
  });

  const familyMap: Record<string, number> = {};
  machinesByFamilyRaw.forEach((m) => {
    familyMap[m.family] = (familyMap[m.family] || 0) + m._count.machines;
  });

  const machinesByFamily = Object.entries(familyMap).map(([name, count]) => ({
    name,
    count,
  }));

  // Recent Tickets
  const recentTickets = await prisma.maintenanceTicket.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { name: true } },
      machine: { include: { model: true } },
    },
  });

  // Recent Interventions
  const recentInterventions = await prisma.intervention.findMany({
    take: 5,
    orderBy: { scheduledDate: 'desc' },
    include: {
      client: { select: { name: true } },
      machine: { include: { model: true } },
      technician: { select: { firstName: true, lastName: true } },
    },
  });

  res.json({
    kpis: {
      totalClients,
      totalMachines,
      operationalMachines,
      faultyMachines,
      openTickets,
      criticalTickets,
      completedInterventions,
      lowStockCount,
      expiringBatchesCount,
      financial: financialStats,
    },
    machinesByFamily,
    recentTickets,
    recentInterventions: recentInterventions.map((i) => ({
      ...i,
      meterReadingPrints: i.meterReadingPrints ? Number(i.meterReadingPrints) : null,
    })),
  });
};

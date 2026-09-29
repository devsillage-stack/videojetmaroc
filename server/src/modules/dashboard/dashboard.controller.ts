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

  const alertDate = new Date();
  alertDate.setDate(alertDate.getDate() + 60);

  // Parallelize count, model breakdown, and recent items queries
  const [
    totalClients,
    totalMachines,
    operationalMachines,
    faultyMachines,
    openTickets,
    criticalTickets,
    completedInterventions,
    lowStockCount,
    expiringBatchesCount,
    machinesByFamilyRaw,
    recentTickets,
    recentInterventions,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.machine.count(),
    prisma.machine.count({ where: { status: MachineStatus.OPERATIONNELLE } }),
    prisma.machine.count({ where: { status: MachineStatus.EN_PANNE } }),
    prisma.maintenanceTicket.count({
      where: { status: { in: [TicketStatus.OUVERT, TicketStatus.ASSIGNE, TicketStatus.EN_COURS] } },
    }),
    prisma.maintenanceTicket.count({
      where: {
        status: { notIn: [TicketStatus.RESOLU, TicketStatus.CLOTURE] },
        priority: TicketPriority.CRITIQUE_LIGNE_ARRETEE,
      },
    }),
    prisma.intervention.count({ where: { status: InterventionStatus.TERMINEE } }),
    prisma.product.count({ where: { stockQuantity: { lte: 10 } } }),
    prisma.stockBatch.count({
      where: {
        quantity: { gt: 0 },
        expirationDate: { lte: alertDate },
      },
    }),
    prisma.machineModel.findMany({
      include: {
        _count: { select: { machines: true } },
      },
    }),
    prisma.maintenanceTicket.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { name: true } },
        machine: { include: { model: true } },
      },
    }),
    prisma.intervention.findMany({
      take: 5,
      orderBy: { scheduledDate: 'desc' },
      include: {
        client: { select: { name: true } },
        machine: { include: { model: true } },
        technician: { select: { firstName: true, lastName: true } },
      },
    }),
  ]);

  // Financial / Commercial metrics (guarded for non-management)
  let financialStats = null;
  if (isManagement) {
    const [invoiceAgg, acceptedQuotes] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: {
          totalTtc: true,
          paidAmount: true,
        },
      }),
      prisma.quote.findMany({
        where: { status: QuoteStatus.ACCEPTE },
        select: {
          totalHt: true,
          estimatedMargin: true,
          exchangeRate: true,
        },
      }),
    ]);

    const totalInvoiced = invoiceAgg._sum.totalTtc || 0;
    const totalCollected = invoiceAgg._sum.paidAmount || 0;

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
  const familyMap: Record<string, number> = {};
  machinesByFamilyRaw.forEach((m) => {
    familyMap[m.family] = (familyMap[m.family] || 0) + m._count.machines;
  });

  const machinesByFamily = Object.entries(familyMap).map(([name, count]) => ({
    name,
    count,
  }));

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

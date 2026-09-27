import prisma from '../../config/prisma.js';

export interface CompanySettingsData {
  companyName?: string;
  tagline?: string;
  formJuridique?: string;
  capitalSocial?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  ice?: string;
  ifTax?: string;
  rc?: string;
  patente?: string;
  cnss?: string;
  bankName?: string;
  bankAgency?: string;
  rib?: string;
  swift?: string;
  logoUrl?: string;
  logoWidth?: number;
  primaryColor?: string;
  accentColor?: string;
  headerStyle?: string;
  termsTemplate?: string;
}

export const getCompanySettings = async () => {
  let settings = await prisma.companySettings.findUnique({
    where: { id: 'default' },
  });

  if (!settings) {
    settings = await prisma.companySettings.create({
      data: {
        id: 'default',
        companyName: 'VIDEOJET MAROC SARL',
        tagline: 'Solutions Professionnelles de Codage, Marquage et Traçabilité Industrielle',
        formJuridique: 'SARL',
        capitalSocial: '1 000 000 DH',
        address: 'Boulevard Ahl Loghlam, Z.I. Sidi Bernoussi',
        city: 'Casablanca',
        postalCode: '20600',
        country: 'Maroc',
        phone: '+212 522 75 40 00',
        email: 'contact@videojet.ma',
        website: 'www.videojet.ma',
        ice: '001892847000082',
        ifTax: '24890123',
        rc: '412098 Casablanca',
        patente: '34120987',
        cnss: '8901234',
        bankName: 'Attijariwafa Bank Maroc',
        bankAgency: 'Agence Sidi Bernoussi Casablanca',
        rib: '007 780 0001234567890123 45',
        swift: 'BCMAMAMC',
        logoWidth: 140,
        primaryColor: '#002b49',
        accentColor: '#ff5c00',
        headerStyle: 'MODERN',
        termsTemplate: 'Conditions : Règlement à 30 jours fin de mois. Matériel neuf garanti 12 mois pièces et main-d\'œuvre.',
      },
    });
  }

  return settings;
};

export const updateCompanySettings = async (data: CompanySettingsData) => {
  await getCompanySettings();

  const cleanData: any = {};
  const allowedFields = [
    'companyName',
    'tagline',
    'formJuridique',
    'capitalSocial',
    'address',
    'city',
    'postalCode',
    'country',
    'phone',
    'email',
    'website',
    'ice',
    'ifTax',
    'rc',
    'patente',
    'cnss',
    'bankName',
    'bankAgency',
    'rib',
    'swift',
    'logoUrl',
    'logoWidth',
    'primaryColor',
    'accentColor',
    'headerStyle',
    'termsTemplate',
  ];

  for (const field of allowedFields) {
    if ((data as any)[field] !== undefined) {
      if (field === 'logoWidth') {
        cleanData[field] = Math.max(60, Math.min(300, Number((data as any)[field]) || 140));
      } else {
        cleanData[field] = (data as any)[field];
      }
    }
  }

  const updated = await prisma.companySettings.update({
    where: { id: 'default' },
    data: cleanData,
  });

  return updated;
};

export const getDatabaseStats = async () => {
  const [
    clients,
    machines,
    quotes,
    orders,
    invoices,
    tickets,
    interventions,
    products,
    stockBatches,
    stockMovements,
    purchaseOrders,
    audits,
    tcoCalculations,
    contracts,
    users,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.machine.count(),
    prisma.quote.count(),
    prisma.order.count(),
    prisma.invoice.count(),
    prisma.maintenanceTicket.count(),
    prisma.intervention.count(),
    prisma.product.count(),
    prisma.stockBatch.count(),
    prisma.stockMovement.count(),
    prisma.purchaseOrder.count(),
    prisma.industrialAudit.count(),
    prisma.tcoCalculation.count(),
    prisma.maintenanceContract.count(),
    prisma.user.count(),
  ]);

  return {
    clients,
    machines,
    quotes,
    orders,
    invoices,
    tickets,
    interventions,
    products,
    stockBatches,
    stockMovements,
    purchaseOrders,
    audits,
    tcoCalculations,
    contracts,
    users,
    totalRecords:
      clients +
      machines +
      quotes +
      orders +
      invoices +
      tickets +
      interventions +
      stockBatches +
      stockMovements +
      purchaseOrders +
      audits +
      tcoCalculations +
      contracts,
  };
};

export interface PurgeOptions {
  mode: 'TRANSACTIONAL' | 'ALL';
  confirmation: string;
  keepAdminUsers?: boolean;
}

export const purgeDatabase = async (options: PurgeOptions) => {
  if (options.confirmation !== 'PURGE') {
    throw new Error('Confirmation incorrecte. Veuillez taper "PURGE" en majuscules pour confirmer l\'opération.');
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Interventions & Parts
    await tx.interventionPartUsed.deleteMany({});
    await tx.intervention.deleteMany({});
    await tx.maintenanceTicket.deleteMany({});

    // 2. Orders & Quotes items
    await tx.orderItem.deleteMany({});
    await tx.order.deleteMany({});
    await tx.quoteItem.deleteMany({});
    await tx.invoice.deleteMany({});
    await tx.quote.deleteMany({});

    // 3. Purchasing & Stock movements
    await tx.stockMovement.deleteMany({});
    await tx.purchaseOrderItem.deleteMany({});
    await tx.purchaseOrder.deleteMany({});
    await tx.stockBatch.deleteMany({});

    // 4. Maintenance contracts & Machine relations
    await tx.maintenanceContract.deleteMany({});
    await tx.machine.deleteMany({});
    await tx.productionLine.deleteMany({});
    await tx.site.deleteMany({});

    // 5. CRM, Audits & TCO
    await tx.auditRecommendation.deleteMany({});
    await tx.tcoCalculation.deleteMany({});
    await tx.industrialAudit.deleteMany({});
    await tx.customerActivity.deleteMany({});
    await tx.opportunity.deleteMany({});
    await tx.clientContact.deleteMany({});
    await tx.client.deleteMany({});

    // 6. If ALL mode, also purge catalog / suppliers / non-admin users
    if (options.mode === 'ALL') {
      await tx.product.deleteMany({});
      await tx.machineModel.deleteMany({});
      await tx.supplier.deleteMany({});
      await tx.competitor.deleteMany({});

      if (options.keepAdminUsers !== false) {
        await tx.user.deleteMany({
          where: {
            role: {
              notIn: ['SUPER_ADMIN', 'ADMIN'],
            },
          },
        });
      }
    }

    return {
      success: true,
      mode: options.mode,
      purgedAt: new Date().toISOString(),
    };
  });
};

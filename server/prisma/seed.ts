import {
  PrismaClient,
  Role,
  ClientType,
  IndustrySector,
  ClientStatus,
  MachineTechnology,
  MachineStatus,
  ContractType,
  ContractStatus,
  TicketPriority,
  TicketStatus,
  InterventionType,
  InterventionStatus,
  ProductType,
  ProductUnit,
  BatchStatus,
  OpportunityStage,
  QuoteStatus,
  InvoiceStatus,
  OrderStatus,
  AuditStatus,
  ActivityType,
  PurchaseOrderStatus,
  StockMovementType,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du peuplement de la base de données VIDEOJET MAROC...');

  // 1. Currencies
  console.log('⚙️ Initialisation des devises...');
  await prisma.currency.upsert({
    where: { code: 'MAD' },
    update: {},
    create: {
      code: 'MAD',
      symbol: 'DH',
      name: 'Dirham Marocain',
      isBase: true,
      rateToBase: 1.0,
    },
  });

  await prisma.currency.upsert({
    where: { code: 'EUR' },
    update: { rateToBase: 10.85 },
    create: {
      code: 'EUR',
      symbol: '€',
      name: 'Euro',
      isBase: false,
      rateToBase: 10.85,
    },
  });

  await prisma.currency.upsert({
    where: { code: 'USD' },
    update: { rateToBase: 10.10 },
    create: {
      code: 'USD',
      symbol: '$',
      name: 'Dollar Américain',
      isBase: false,
      rateToBase: 10.10,
    },
  });

  // 2. Tax Rates
  console.log('⚙️ Initialisation des taux de TVA...');
  const tva20 = await prisma.taxRate.upsert({
    where: { id: 'tax-tva-20' },
    update: {},
    create: {
      id: 'tax-tva-20',
      name: 'TVA Normale (20%)',
      rate: 20.0,
      isDefault: true,
      isActive: true,
    },
  });

  const tva0 = await prisma.taxRate.upsert({
    where: { id: 'tax-tva-0' },
    update: {},
    create: {
      id: 'tax-tva-0',
      name: 'TVA 0% (Exonération / Export)',
      rate: 0.0,
      isDefault: false,
      isActive: true,
    },
  });

  // 3. Users for all roles
  console.log('👥 Création des utilisateurs avec rôles industriels...');
  const defaultPassword = await bcrypt.hash('Videojet2026!', 10);

  const usersData = [
    {
      email: 'superadmin@videojet.ma',
      firstName: 'Karim',
      lastName: 'El Idrissi',
      role: Role.SUPER_ADMIN,
      phone: '+212 661-112233',
    },
    {
      email: 'admin@videojet.ma',
      firstName: 'Nadia',
      lastName: 'Bennani',
      role: Role.ADMIN,
      phone: '+212 661-223344',
    },
    {
      email: 'direction@videojet.ma',
      firstName: 'Tarik',
      lastName: 'Amrani',
      role: Role.DIRECTION,
      phone: '+212 661-334455',
    },
    {
      email: 'commercial@videojet.ma',
      firstName: 'Youssef',
      lastName: 'Chraibi',
      role: Role.COMMERCIAL,
      phone: '+212 661-445566',
    },
    {
      email: 'sav.manager@videojet.ma',
      firstName: 'Mehdi',
      lastName: 'Alaoui',
      role: Role.RESPONSABLE_SAV,
      phone: '+212 661-556677',
    },
    {
      email: 'technicien@videojet.ma',
      firstName: 'Omar',
      lastName: 'Kabbaj',
      role: Role.TECHNICIEN_SAV,
      phone: '+212 661-667788',
    },
    {
      email: 'magasinier@videojet.ma',
      firstName: 'Hassan',
      lastName: 'Tahiri',
      role: Role.MAGASINIER,
      phone: '+212 661-778899',
    },
    {
      email: 'comptabilite@videojet.ma',
      firstName: 'Fatima',
      lastName: 'Zahra Mansouri',
      role: Role.COMPTABILITE,
      phone: '+212 661-889900',
    },
  ];

  const createdUsers: Record<string, any> = {};
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, passwordHash: defaultPassword },
      create: {
        email: u.email,
        passwordHash: defaultPassword,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        phone: u.phone,
      },
    });
    createdUsers[u.email] = user;
  }

  // 4. Machine Models (Official Videojet Technologies)
  console.log('🏭 Création des modèles Videojet officiels...');
  const modelsData = [
    {
      modelNumber: '1580',
      family: MachineTechnology.CIJ,
      name: 'Videojet 1580 Continuous Inkjet',
      description: 'Imprimante jet d\'encre continu conçue pour minimiser les arrêts imprévus avec interface tactile SIMPLICiTY™ et réservoir de réserve de solvant.',
      maxSpeed: '278 m/min',
      resolution: '60 dpi',
      ipRating: 'IP55 / IP65',
    },
    {
      modelNumber: '1880',
      family: MachineTechnology.CIJ,
      name: 'Videojet 1880 IoT CIJ Printer',
      description: 'Imprimante connectée de pointe avec suite prédictive MAXIMiZE™, capteur d\'accumulation d\'encre et rinçage automatique complet.',
      maxSpeed: '334 m/min',
      resolution: '70 dpi',
      ipRating: 'IP66 inox 316',
    },
    {
      modelNumber: '3340',
      family: MachineTechnology.LASER_CO2,
      name: 'Videojet 3340 CO2 Laser Marking System',
      description: 'Système de marquage laser CO2 de 30 Watts, idéal pour l\'emballage grande cadence pharmaceutique, tabac et agroalimentaire.',
      maxSpeed: '900 m/min',
      resolution: 'Marquage vectoriel ultra précis',
      ipRating: 'IP54 / IP65',
    },
    {
      modelNumber: '3640',
      family: MachineTechnology.LASER_CO2,
      name: 'Videojet 3640 CO2 Laser Marking System',
      description: 'Système laser 60 Watts ultra haute vitesse pour les cadences extrêmes d\'embouteillage et de canettes (jusqu\'à 150 000 bph).',
      maxSpeed: '1200 m/min',
      resolution: 'Optique haute résolution',
      ipRating: 'IP65',
    },
    {
      modelNumber: '6530',
      family: MachineTechnology.TTO,
      name: 'Videojet DataFlex 6530 TTO',
      description: 'Surimprimeur à transfert thermique sans air comprimé avec technologie iAssure™ intégrée pour le contrôle qualité en ligne.',
      maxSpeed: '1000 mm/s',
      resolution: '300 dpi',
      ipRating: 'IP66 cassette étanche',
    },
    {
      modelNumber: 'Wolke-m610',
      family: MachineTechnology.TIJ,
      name: 'Wolke m610 touch Thermal Inkjet',
      description: 'Technologie jet d\'encre thermique à cartouches HP pour la sérialisation pharmaceutique et la traçabilité Track & Trace.',
      maxSpeed: '60 m/min à 600 dpi',
      resolution: '600 x 600 dpi',
      ipRating: 'IP20 boîtier inox',
    },
  ];

  const createdModels: Record<string, any> = {};
  for (const m of modelsData) {
    const model = await prisma.machineModel.upsert({
      where: { modelNumber: m.modelNumber },
      update: {},
      create: m,
    });
    createdModels[m.modelNumber] = model;
  }

  // 5. Moroccan Industrial Clients, Sites & Lines
  console.log('🏢 Création des clients industriels marocains...');
  const clientsData = [
    {
      code: 'CLI-DAN-001',
      name: 'Centrale Danone Maroc',
      type: ClientType.CLIENT,
      industrySector: IndustrySector.AGROALIMENTAIRE,
      ice: '001524889000045',
      rc: '123456 Casa',
      ifTax: '01020304',
      city: 'Casablanca',
      address: 'Zone Industrielle Ain Sebaa, Bd Moulay Slimane',
      phone: '+212 522-354000',
      email: 'maintenance.maroc@danone.com',
      sites: [
        {
          name: 'Usine Salé',
          city: 'Salé',
          address: 'Route de Meknès, Zone Industrielle Tabriquet',
          lines: ['Ligne Tetra Pak Briques 1L', 'Ligne Yaourts Pots 125g'],
        },
        {
          name: 'Usine Meknès',
          city: 'Meknès',
          address: 'Quartier Industriel Sidi Bouzekri',
          lines: ['Ligne Bouteilles Lait Frais 500ml', 'Ligne Fromage Fondu'],
        },
      ],
      contact: {
        firstName: 'Rachid',
        lastName: 'El Mansouri',
        position: 'Directeur Maintenance & Ingénierie',
        phone: '+212 661-897654',
        email: 'r.elmansouri@danone.com',
      },
    },
    {
      code: 'CLI-COS-002',
      name: 'Cosumar S.A.',
      type: ClientType.CLIENT,
      industrySector: IndustrySector.AGROALIMENTAIRE,
      ice: '000012345000099',
      rc: '78910 Casa',
      ifTax: '02030405',
      city: 'Casablanca',
      address: '8, Rue El Mouatamid Ibn Abbad, Roches Noires',
      phone: '+212 522-242000',
      email: 'achats.techniques@cosumar.co.ma',
      sites: [
        {
          name: 'Raffinerie Casablanca',
          city: 'Casablanca',
          address: 'Roches Noires',
          lines: ['Ligne Pain de Sucre 2kg', 'Ligne Sucre Morceaux 1kg', 'Ligne Sacs 50kg'],
        },
      ],
      contact: {
        firstName: 'Anas',
        lastName: 'Tazi',
        position: 'Responsable Lignes de Conditionnement',
        phone: '+212 661-345678',
        email: 'a.tazi@cosumar.co.ma',
      },
    },
    {
      code: 'CLI-COO-003',
      name: 'Cooper Pharma',
      type: ClientType.CLIENT,
      industrySector: IndustrySector.PHARMACEUTIQUE,
      ice: '001678901000012',
      rc: '45678 Casa',
      ifTax: '03040506',
      city: 'Casablanca',
      address: 'Zone Industrielle Tit Mellil, Route de Tit Mellil',
      phone: '+212 522-510000',
      email: 'technique@cooperpharma.ma',
      sites: [
        {
          name: 'Site Tit Mellil',
          city: 'Casablanca',
          address: 'Tit Mellil',
          lines: ['Ligne Sérialisation Blisters Pharma', 'Ligne Flacons Sirops'],
        },
      ],
      contact: {
        firstName: 'Dr. Meriem',
        lastName: 'Alj',
        position: 'Directrice Assurance Qualité & Packaging',
        phone: '+212 661-987123',
        email: 'm.alj@cooperpharma.ma',
      },
    },
    {
      code: 'CLI-LES-004',
      name: 'Lesieur Cristal',
      type: ClientType.CLIENT,
      industrySector: IndustrySector.AGROALIMENTAIRE,
      ice: '001556789000033',
      rc: '98765 Casa',
      ifTax: '04050607',
      city: 'Casablanca',
      address: 'Zone Industrielle Aïn Harrouda',
      phone: '+212 522-765000',
      email: 'production@lesieur-cristal.co.ma',
      sites: [
        {
          name: 'Complexe Aïn Harrouda',
          city: 'Mohammedia',
          address: 'Route Nationale 1, Aïn Harrouda',
          lines: ['Ligne Huile Table PET 1L', 'Ligne Bidons 5L'],
        },
      ],
      contact: {
        firstName: 'Hamid',
        lastName: 'Berrada',
        position: 'Chef de Département Maintenance',
        phone: '+212 661-456789',
        email: 'h.berrada@lesieur-cristal.co.ma',
      },
    },
    {
      code: 'CLI-SOT-005',
      name: 'Sothema Laboratoires',
      type: ClientType.CLIENT,
      industrySector: IndustrySector.PHARMACEUTIQUE,
      ice: '001789456000088',
      rc: '65432 Casa',
      ifTax: '05060708',
      city: 'Casablanca',
      address: 'Parc Industriel de Bouskoura',
      phone: '+212 522-334400',
      email: 'maintenance@sothema.ma',
      sites: [
        {
          name: 'Campus Bouskoura',
          city: 'Bouskoura',
          address: 'Bouskoura Techpark',
          lines: ['Ligne Ampoules Injectables Stériles', 'Ligne Étuis Comprimés'],
        },
      ],
      contact: {
        firstName: 'Yassine',
        lastName: 'Ouazzani',
        position: 'Responsable Travaux Neufs & Équipements',
        phone: '+212 661-234567',
        email: 'y.ouazzani@sothema.ma',
      },
    },
  ];

  const createdClients: Record<string, any> = {};
  const createdSites: Record<string, any> = {};
  const createdLines: Record<string, any> = {};

  for (const c of clientsData) {
    const client = await prisma.client.upsert({
      where: { code: c.code },
      update: {},
      create: {
        code: c.code,
        name: c.name,
        type: c.type,
        industrySector: c.industrySector,
        ice: c.ice,
        rc: c.rc,
        ifTax: c.ifTax,
        city: c.city,
        address: c.address,
        phone: c.phone,
        email: c.email,
        status: ClientStatus.ACTIF,
        defaultCurrency: 'MAD',
      },
    });
    createdClients[c.code] = client;

    // Contact
    await prisma.clientContact.create({
      data: {
        clientId: client.id,
        firstName: c.contact.firstName,
        lastName: c.contact.lastName,
        position: c.contact.position,
        phone: c.contact.phone,
        email: c.contact.email,
        isPrimary: true,
      },
    });

    // Sites & Lines
    for (const s of c.sites) {
      const site = await prisma.site.create({
        data: {
          clientId: client.id,
          name: s.name,
          city: s.city,
          address: s.address,
        },
      });
      createdSites[`${c.code}_${s.name}`] = site;

      for (const lineName of s.lines) {
        const line = await prisma.productionLine.create({
          data: {
            siteId: site.id,
            name: lineName,
            speedUnitsPerHour: 12000,
          },
        });
        createdLines[`${site.id}_${lineName}`] = line;
      }
    }
  }

  // 6. Machines in the Installed Base
  console.log('📠 Installation des machines dans le parc Videojet...');
  const danoneSite = createdSites['CLI-DAN-001_Usine Salé'];
  const danoneLine = await prisma.productionLine.findFirst({ where: { siteId: danoneSite.id } });

  const cosumarSite = createdSites['CLI-COS-002_Raffinerie Casablanca'];
  const cosumarLine = await prisma.productionLine.findFirst({ where: { siteId: cosumarSite.id } });

  const cooperSite = createdSites['CLI-COO-003_Site Tit Mellil'];
  const cooperLine = await prisma.productionLine.findFirst({ where: { siteId: cooperSite.id } });

  const qrDanone1 = await QRCode.toDataURL(JSON.stringify({ serial: 'VJ1880-MA-2023-0101', client: 'Centrale Danone' }));
  const qrDanone2 = await QRCode.toDataURL(JSON.stringify({ serial: 'VJ1580-MA-2022-0889', client: 'Centrale Danone' }));
  const qrCosumar = await QRCode.toDataURL(JSON.stringify({ serial: 'VJ3640-MA-2023-0042', client: 'Cosumar S.A.' }));
  const qrCooper = await QRCode.toDataURL(JSON.stringify({ serial: 'WOLKE-MA-2024-0019', client: 'Cooper Pharma' }));

  const machine1 = await prisma.machine.upsert({
    where: { serialNumber: 'VJ1880-MA-2023-0101' },
    update: {},
    create: {
      serialNumber: 'VJ1880-MA-2023-0101',
      modelId: createdModels['1880'].id,
      clientId: createdClients['CLI-DAN-001'].id,
      siteId: danoneSite.id,
      lineId: danoneLine?.id,
      status: MachineStatus.OPERATIONNELLE,
      installDate: new Date('2023-03-15'),
      totalOperatingHours: 4250.5,
      totalPrintsCount: BigInt(18500200),
      qrCodeData: qrDanone1,
      notes: 'Imprimante connectée en production 3x8 - marquage DLC sur bouchons Tetra Pak.',
    },
  });

  const machine2 = await prisma.machine.upsert({
    where: { serialNumber: 'VJ1580-MA-2022-0889' },
    update: {},
    create: {
      serialNumber: 'VJ1580-MA-2022-0889',
      modelId: createdModels['1580'].id,
      clientId: createdClients['CLI-DAN-001'].id,
      siteId: danoneSite.id,
      lineId: danoneLine?.id,
      status: MachineStatus.EN_PANNE,
      installDate: new Date('2022-09-10'),
      totalOperatingHours: 8120.0,
      totalPrintsCount: BigInt(34120900),
      qrCodeData: qrDanone2,
      notes: 'Arrêt intempestif détecté - défaut de viscosité encre.',
    },
  });

  const machine3 = await prisma.machine.upsert({
    where: { serialNumber: 'VJ3640-MA-2023-0042' },
    update: {},
    create: {
      serialNumber: 'VJ3640-MA-2023-0042',
      modelId: createdModels['3640'].id,
      clientId: createdClients['CLI-COS-002'].id,
      siteId: cosumarSite.id,
      lineId: cosumarLine?.id,
      status: MachineStatus.OPERATIONNELLE,
      installDate: new Date('2023-06-20'),
      totalOperatingHours: 3100.0,
      totalPrintsCount: BigInt(8900100),
      qrCodeData: qrCosumar,
      notes: 'Laser CO2 60W sur ligne grande vitesse conditionnement sucre.',
    },
  });

  const machine4 = await prisma.machine.upsert({
    where: { serialNumber: 'WOLKE-MA-2024-0019' },
    update: {},
    create: {
      serialNumber: 'WOLKE-MA-2024-0019',
      modelId: createdModels['Wolke-m610'].id,
      clientId: createdClients['CLI-COO-003'].id,
      siteId: cooperSite.id,
      lineId: cooperLine?.id,
      status: MachineStatus.OPERATIONNELLE,
      installDate: new Date('2024-01-15'),
      totalOperatingHours: 950.0,
      totalPrintsCount: BigInt(2450000),
      qrCodeData: qrCooper,
      notes: 'Marquage Datamatrix sérialisation conforme aux normes sanitaires pharma.',
    },
  });

  // 7. Products, Consumables & Spare Parts Catalog
  console.log('📦 Création du catalogue consommables et pièces de rechange Videojet...');
  const productsData = [
    {
      partNumber: 'V411-D',
      name: 'Encre Noire Standard MEK CIJ (750ml)',
      type: ProductType.ENCRE,
      technology: MachineTechnology.CIJ,
      description: 'Encre noire à séchage rapide à base de MEK pour surfaces plastiques, verre et métal.',
      unitPrice: 850.0,
      costPrice: 420.0,
      stockQuantity: 48,
      minStockThreshold: 15,
      unit: ProductUnit.CARTOUCHE,
    },
    {
      partNumber: 'V706-D',
      name: 'Solvant / Make-up Standard CIJ (750ml)',
      type: ProductType.SOLVANT_MAKEUP,
      technology: MachineTechnology.CIJ,
      description: 'Solvant de compensation actif pour encre V411-D.',
      unitPrice: 380.0,
      costPrice: 160.0,
      stockQuantity: 6, // Low stock alert trigger!
      minStockThreshold: 20,
      unit: ProductUnit.CARTOUCHE,
    },
    {
      partNumber: 'V420-D',
      name: 'Encre Sans MEK Éthanol Alimentaire (750ml)',
      type: ProductType.ENCRE,
      technology: MachineTechnology.CIJ,
      description: 'Encre sans solvants chlorés ni MEK, certifiée contact alimentaire indirect.',
      unitPrice: 990.0,
      costPrice: 510.0,
      stockQuantity: 25,
      minStockThreshold: 10,
      unit: ProductUnit.CARTOUCHE,
    },
    {
      partNumber: '408544',
      name: 'Ruban Transfert Thermique TTO Noir 55mm x 1000m',
      type: ProductType.RUBAN_TTO,
      technology: MachineTechnology.TTO,
      description: 'Ruban cire-résine premium pour emballages souples et sachets.',
      unitPrice: 320.0,
      costPrice: 140.0,
      stockQuantity: 80,
      minStockThreshold: 20,
      unit: ProductUnit.ROULEAU,
    },
    {
      partNumber: '500-0036-610',
      name: 'Cartouche TIJ Wolke Solvant Noir Pharma',
      type: ProductType.ENCRE,
      technology: MachineTechnology.TIJ,
      description: 'Cartouche HP 45si haute résolution pour cartons vernis pharmaceutiques.',
      unitPrice: 1250.0,
      costPrice: 700.0,
      stockQuantity: 32,
      minStockThreshold: 8,
      unit: ProductUnit.CARTOUCHE,
    },
    {
      partNumber: '215444',
      name: 'Core Module CIJ 1880 (Module Cœur)',
      type: ProductType.MODULE_COEUR,
      technology: MachineTechnology.CIJ,
      description: 'Système complet de filtration et pompe intégré sans maintenance pendant 14 000 h.',
      unitPrice: 18500.0,
      costPrice: 9800.0,
      stockQuantity: 4,
      minStockThreshold: 2,
      unit: ProductUnit.KIT,
    },
    {
      partNumber: '399180',
      name: 'Tête d\'impression CIJ 60 microns',
      type: ProductType.TETE_IMPRESSION,
      technology: MachineTechnology.CIJ,
      description: 'Tête d\'impression originale avec buse céramique et valve de purge automatique.',
      unitPrice: 14200.0,
      costPrice: 7500.0,
      stockQuantity: 3,
      minStockThreshold: 2,
      unit: ProductUnit.PIECE,
    },
    {
      partNumber: '503212',
      name: 'Filtre Principal d\'Encre 5 Microns',
      type: ProductType.FILTRE,
      technology: MachineTechnology.CIJ,
      description: 'Filtre capsule d\'origine Videojet pour ligne haute pression.',
      unitPrice: 650.0,
      costPrice: 280.0,
      stockQuantity: 22,
      minStockThreshold: 10,
      unit: ProductUnit.PIECE,
    },
  ];

  const createdProducts: Record<string, any> = {};
  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { partNumber: p.partNumber },
      update: {},
      create: p,
    });
    createdProducts[p.partNumber] = product;
  }

  // 8. Batches & Expiration Dates
  console.log('🧪 Création des lots avec traçabilité et alertes de péremption...');
  const expFuture = new Date();
  expFuture.setMonth(expFuture.getMonth() + 14);

  const expNear = new Date();
  expNear.setDate(expNear.getDate() + 25); // In 25 days -> ALERTE_PEREMPTION!

  const expPast = new Date();
  expPast.setDate(expPast.getDate() - 10); // Expired 10 days ago -> PERIME!

  await prisma.stockBatch.create({
    data: {
      productId: createdProducts['V411-D'].id,
      batchNumber: 'LOT-VJ-2024-034',
      expirationDate: expFuture,
      quantity: 40,
      warehouseLocation: 'Casablanca Dépôt Central - Allée 2 Travée B',
      status: BatchStatus.VALIDE,
    },
  });

  await prisma.stockBatch.create({
    data: {
      productId: createdProducts['V411-D'].id,
      batchNumber: 'LOT-VJ-2023-112',
      expirationDate: expNear,
      quantity: 8,
      warehouseLocation: 'Casablanca Dépôt Central - Rayon Alertes',
      status: BatchStatus.ALERTE_PEREMPTION,
    },
  });

  await prisma.stockBatch.create({
    data: {
      productId: createdProducts['V706-D'].id,
      batchNumber: 'LOT-SLV-2023-009',
      expirationDate: expPast,
      quantity: 2,
      warehouseLocation: 'Zone Quarantaine / Rebut',
      status: BatchStatus.PERIME,
    },
  });

  // 9. Maintenance Contracts
  console.log('📜 Création des contrats de maintenance industrielle...');
  await prisma.maintenanceContract.upsert({
    where: { contractNumber: 'CTR-DAN-2024-PLATINUM' },
    update: {},
    create: {
      contractNumber: 'CTR-DAN-2024-PLATINUM',
      clientId: createdClients['CLI-DAN-001'].id,
      type: ContractType.PLATINUM,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      annualCost: 145000.0,
      currency: 'MAD',
      visitsPerYear: 6,
      visitsCompleted: 4,
      responseTimeHours: 4, // SLA 4h garanti
      includesParts: true,
      includesConsumables: false,
      notes: 'Couverture 24/7 avec astreinte technique et révision préventive bimestrielle.',
    },
  });

  await prisma.maintenanceContract.upsert({
    where: { contractNumber: 'CTR-COO-2024-GOLD' },
    update: {},
    create: {
      contractNumber: 'CTR-COO-2024-GOLD',
      clientId: createdClients['CLI-COO-003'].id,
      type: ContractType.GOLD,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2025-01-31'),
      annualCost: 78000.0,
      currency: 'MAD',
      visitsPerYear: 4,
      visitsCompleted: 2,
      responseTimeHours: 8,
      includesParts: false,
      includesConsumables: false,
      notes: 'Visites préventives trimestrielles et audits d\'impression conformité pharma.',
    },
  });

  // 10. Maintenance Tickets & Interventions
  console.log('🚨 Création des tickets d\'incident et fiches d\'intervention SAV...');
  const techUser = createdUsers['technicien@videojet.ma'];
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000);

  const ticket1 = await prisma.maintenanceTicket.upsert({
    where: { ticketNumber: 'TCK-2024-001' },
    update: {},
    create: {
      ticketNumber: 'TCK-2024-001',
      machineId: machine2.id,
      clientId: createdClients['CLI-DAN-001'].id,
      assignedToId: techUser.id,
      priority: TicketPriority.CRITIQUE_LIGNE_ARRETEE,
      status: TicketStatus.EN_COURS,
      faultDescription: 'Arrêt d\'impression ligne Tetra Pak 1 : Voyant rouge d\'encre, pression fluctuante.',
      errorCode: 'E104-M (Viscosity Error)',
      reportedBy: 'Kabbaj (Chef d\'équipe embouteillage)',
      slaTargetResponseAt: oneHourLater,
      slaTargetResolutionAt: fourHoursLater,
      firstRespondedAt: new Date(now.getTime() + 20 * 60 * 1000),
    },
  });

  const intervention1 = await prisma.intervention.upsert({
    where: { interventionNumber: 'INT-2024-001' },
    update: {},
    create: {
      interventionNumber: 'INT-2024-001',
      ticketId: ticket1.id,
      machineId: machine2.id,
      technicianId: techUser.id,
      clientId: createdClients['CLI-DAN-001'].id,
      type: InterventionType.CURATIVE,
      status: InterventionStatus.EN_COURS,
      scheduledDate: new Date(),
      startedAt: new Date(),
      travelHours: 1.5,
      travelDistanceKm: 75.0,
      travelExpenses: 250.0,
      diagnosis: 'Buse obstruée partiellement par encre séchée suite à un arrêt prolongé du week-end sans cycle d\'arrêt automatique.',
      workDone: 'Rinçage sous pression au solvant V706-D, nettoyage par ultrasons du canon de buse.',
    },
  });

  // An already completed intervention with signature
  const ticket2 = await prisma.maintenanceTicket.upsert({
    where: { ticketNumber: 'TCK-2024-002' },
    update: {},
    create: {
      ticketNumber: 'TCK-2024-002',
      machineId: machine1.id,
      clientId: createdClients['CLI-DAN-001'].id,
      assignedToId: techUser.id,
      priority: TicketPriority.NORMALE,
      status: TicketStatus.RESOLU,
      faultDescription: 'Maintenance préventive des 4000 heures et remplacement préventif des filtres.',
      reportedBy: 'Direction Usine Salé',
      resolutionNotes: 'Maintenance préventive effectuée avec succès. Compteurs réinitialisés.',
      slaTargetResponseAt: new Date('2024-03-01T13:00:00Z'),
      slaTargetResolutionAt: new Date('2024-03-02T09:00:00Z'),
      firstRespondedAt: new Date('2024-03-01T09:30:00Z'),
      resolvedAt: new Date('2024-03-01T12:30:00Z'),
    },
  });

  await prisma.intervention.upsert({
    where: { interventionNumber: 'INT-2024-002' },
    update: {},
    create: {
      interventionNumber: 'INT-2024-002',
      ticketId: ticket2.id,
      machineId: machine1.id,
      technicianId: techUser.id,
      clientId: createdClients['CLI-DAN-001'].id,
      type: InterventionType.PREVENTIVE,
      status: InterventionStatus.TERMINEE,
      scheduledDate: new Date('2024-03-01'),
      startedAt: new Date('2024-03-01T09:00:00Z'),
      completedAt: new Date('2024-03-01T12:30:00Z'),
      hoursSpent: 3.5,
      travelHours: 1.0,
      travelDistanceKm: 45.0,
      travelExpenses: 150.0,
      meterReadingHours: 4250.5,
      meterReadingPrints: BigInt(18500200),
      diagnosis: 'Inspection régulière des 4000 heures. État d\'usure normal.',
      workDone: 'Remplacement du filtre principal d\'encre 503212, étalonnage de la déflexion du jet, vérification du temps de vol.',
      customerFeedback: 'Intervention soignée et rapide. Machine remise en ligne sans retard de production.',
      customerSignerName: 'Rachid El Mansouri',
      customerSignerTitle: 'Directeur Maintenance Centrale Danone',
    },
  });

  // 11. CRM Opportunities & Pipeline
  console.log('📈 Création des opportunités commerciales...');
  const commUser = createdUsers['commercial@videojet.ma'];

  await prisma.opportunity.create({
    data: {
      title: 'Renouvellement 3x CIJ 1880 Ligne Yaourts Danone',
      clientId: createdClients['CLI-DAN-001'].id,
      assignedToId: commUser.id,
      stage: OpportunityStage.NEGOCIATION,
      expectedValue: 345000.0,
      currency: 'MAD',
      probabilityPercent: 80,
      closeDate: new Date('2024-11-30'),
      notes: 'Remplacement d\'anciennes machines concurrentes Domino par des 1880 avec MAXIMiZE.',
    },
  });

  await prisma.opportunity.create({
    data: {
      title: 'Projet Sérialisation Datamatrix Blisters Cooper Pharma',
      clientId: createdClients['CLI-COO-003'].id,
      assignedToId: commUser.id,
      stage: OpportunityStage.DEMO_ESSAI,
      expectedValue: 210000.0,
      currency: 'MAD',
      probabilityPercent: 60,
      closeDate: new Date('2024-12-15'),
      notes: 'Test sur carton verni réussi avec la cartouche Wolke m610 solvant.',
    },
  });

  // 12. Quotation & Invoice
  console.log('💼 Création de devis multi-devises et facturation...');
  const quote1 = await prisma.quote.upsert({
    where: { quoteNumber: 'DEV-2024-001' },
    update: {},
    create: {
      quoteNumber: 'DEV-2024-001',
      clientId: createdClients['CLI-DAN-001'].id,
      createdById: commUser.id,
      taxRateId: tva20.id,
      status: QuoteStatus.ACCEPTE,
      currency: 'MAD',
      exchangeRate: 1.0,
      subtotalHt: 145000.0,
      discountPercent: 5.0,
      discountAmount: 7250.0,
      totalHt: 137750.0,
      taxAmount: 27550.0,
      totalTtc: 165300.0,
      totalCost: 75000.0,
      estimatedMargin: 62750.0,
      validUntil: new Date('2024-12-31'),
      paymentTerms: '30 jours fin de mois par virement bancaire',
      notes: 'Contrat de maintenance annuelle Platinum avec engagement SLA 4h.',
      items: {
        create: [
          {
            itemType: 'CONTRAT',
            description: 'Contrat de maintenance Platinum 2024 - Centrale Danone Usine Salé (6 visites préventives + pièces)',
            quantity: 1,
            unitPrice: 145000.0,
            costPrice: 75000.0,
            discountPercent: 5.0,
            totalLineHt: 137750.0,
          },
        ],
      },
    },
  });

  // Invoice generated from quote1
  await prisma.invoice.upsert({
    where: { invoiceNumber: 'FAC-2024-001' },
    update: {},
    create: {
      invoiceNumber: 'FAC-2024-001',
      quoteId: quote1.id,
      clientId: createdClients['CLI-DAN-001'].id,
      issueDate: new Date('2024-01-05'),
      dueDate: new Date('2024-02-05'),
      status: InvoiceStatus.PAYEE,
      currency: 'MAD',
      exchangeRate: 1.0,
      subtotalHt: 137750.0,
      taxAmount: 27550.0,
      totalTtc: 165300.0,
      paidAmount: 165300.0,
      paymentMethod: 'VIREMENT_BANCAIRE',
      notes: 'Règlement reçu par virement BMCE le 02/02/2024.',
    },
  });

  // Quote in EUR for export / foreign client or foreign currency quotation
  await prisma.quote.upsert({
    where: { quoteNumber: 'DEV-2024-002-EUR' },
    update: {},
    create: {
      quoteNumber: 'DEV-2024-002-EUR',
      clientId: createdClients['CLI-COS-002'].id,
      createdById: commUser.id,
      taxRateId: tva20.id,
      status: QuoteStatus.ENVOYE,
      currency: 'EUR',
      exchangeRate: 10.85,
      subtotalHt: 16500.0,
      discountPercent: 0.0,
      discountAmount: 0.0,
      totalHt: 16500.0,
      taxAmount: 3300.0,
      totalTtc: 19800.0,
      totalCost: 9200.0,
      estimatedMargin: 7300.0,
      validUntil: new Date('2024-11-30'),
      paymentTerms: 'Acompte 50% à la commande, solde à la livraison',
      notes: 'Offre pour Laser CO2 Videojet 3340 avec tête haute résolution.',
      items: {
        create: [
          {
            itemType: 'MACHINE',
            machineModelId: createdModels['3340'].id,
            description: 'Système de marquage laser CO2 Videojet 3340 (30 Watt) avec lentille SHC60',
            quantity: 1,
            unitPrice: 16500.0,
            costPrice: 9200.0,
            discountPercent: 0.0,
            totalLineHt: 16500.0,
          },
        ],
      },
    },
  });

  // 13. Competitors Intelligence
  console.log('⚔️ Initialisation de la veille concurrentielle...');
  const existingCompetitors = await prisma.competitor.count();
  if (existingCompetitors === 0) {
    await prisma.competitor.createMany({
      data: [
      {
        brand: 'Markem-Imaje',
        modelName: '9450',
        technology: MachineTechnology.CIJ,
        indicativePrice: 135000.0,
        currency: 'MAD',
        technicalPoints: 'Génération CIJ standard, tête d\'impression monojet, réservoirs sous pression.',
        commercialStrengths: 'Implantation historique dans le secteur agroalimentaire marocain.',
        reportedWeaknesses: 'Bouchage fréquent des buses lors des arrêts prolongés, coût élevé des modules d\'encre, pertes solvant importantes.',
        clientObjections: '"Nous avons l\'habitude de leurs consommables et nos techniciens sont formés."',
        videojetWinningPitch: 'Technologie Videojet 1880 CleanFlow™ avec rinçage automatique complet, capteur prédictif Smart Cell™ et économie de 20% sur la consommation de make-up.',
      },
      {
        brand: 'Domino',
        modelName: 'Ax350i',
        technology: MachineTechnology.CIJ,
        indicativePrice: 140000.0,
        currency: 'MAD',
        technicalPoints: 'Système i-Pulse, encres sans cétone disponibles.',
        commercialStrengths: 'Bonne réputation sur les encres à séchage rapide.',
        reportedWeaknesses: 'Sensibilité accrue aux environnements poussiéreux, SAV local moins réactif sur Tanger et Agadir.',
        clientObjections: '"Leur interface tactile QuickStep est conviviale."',
        videojetWinningPitch: 'Videojet SIMPLICiTY™ UI avec détection automatique d\'erreurs, indice de protection IP66 réel et stock local de pièces d\'origine au Maroc sous 4h SLA.',
      },
      {
        brand: 'Linx',
        modelName: '8900',
        technology: MachineTechnology.CIJ,
        indicativePrice: 115000.0,
        currency: 'MAD',
        technicalPoints: 'Tête scellée, interface tactile couleur.',
        commercialStrengths: 'Prix d\'appel machine agressif.',
        reportedWeaknesses: 'Cadence limitée à haute vitesse, coût de maintenance préventive élevé après 2 ans.',
        clientObjections: '"Offre tarifaire initiale inférieure de 15%."',
        videojetWinningPitch: 'TCO (coût total de possession) sur 5 ans inférieur de 28% grâce à la longévité des cœurs Videojet et l\'absence de surconsommation solvant.',
      },
    ],
  });
  }

  // 14. Industrial Audits & Technical Recommendations
  console.log('🏭 Création des audits industriels et recommandations...');
  const danoneClient = createdClients['CLI-DAN-001'];
  const danoneSaleSite = createdSites['CLI-DAN-001_Usine Salé'];
  const danoneYogurtLine = createdLines['CLI-DAN-001_Usine Salé_Ligne Yaourts Pots 125g'];

  let auditDanone = await prisma.industrialAudit.findUnique({
    where: { auditNumber: 'AUD-2024-0001' },
  });

  if (!auditDanone) {
    auditDanone = await prisma.industrialAudit.create({
    data: {
      auditNumber: 'AUD-2024-0001',
      clientId: danoneClient.id,
      siteId: danoneSaleSite ? danoneSaleSite.id : null,
      lineId: danoneYogurtLine ? danoneYogurtLine.id : null,
      createdById: createdUsers['commercial@videojet.ma'].id,
      status: AuditStatus.VALIDE,
      lineSpeedMpm: 45.0,
      unitsPerHour: 36000,
      packagingSubstrate: 'Pots Polystyrène (PS) + Opercule Aluminium étanche',
      ambientTempMin: 4.0,
      ambientTempMax: 14.0,
      dustLevel: 'Modéré',
      washdownExposure: true,
      printLocation: 'Fond de pot thermoformé et collerette opercule',
      messageHeightMm: 3.2,
      messageLinesCount: 2,
      opticalDistanceMm: 12.0,
      existingMachineBrand: 'Markem-Imaje',
      existingMachineModel: '9450',
      existingMachineAgeYears: 7,
      currentPainPoints: 'Arrêts fréquents pour nettoyage buse (4 fois par équipe), suintement encre dû au lavage à haute pression, lisibilité dégradée sur pots humides.',
      currentConsumableCostPerYear: 52000.0,
      currentDowntimeHoursPerYear: 62.0,
      photos: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'],
      notes: 'Ligne critique pour Centrale Danone. Arrêt d\'une heure = 36 000 pots perdus ou retardés. Besoin d\'étanchéité IP66 et encre résistante au froid.',
      recommendations: {
        create: [
          {
            recommendedTech: MachineTechnology.CIJ,
            recommendedModelId: createdModels['1880'].id,
            confidenceScore: 97.5,
            justification: 'La Videojet 1880 MAXIMiZE™ dispose d\'un indice IP66 en inox 316 lavable à grande eau, d\'une tête CleanFlow™ anti-encrassement et d\'un capteur d\'accumulation d\'encre avec alerte prédictive.',
            suggestedConsumable: 'Encre Videojet V411-D MEK Noire adhésion renforcée condensation (séchage < 1s sur PS froid).',
            assumptions: 'Lavage quotidien de la ligne au jet basse pression sans nécessité de couvrir la tête.',
            missingDataNotes: 'Vérifier la pression d\'air comprimé de l\'usine pour le dispositif de purge continue.',
          },
        ],
      },
    },
  });
  }

  // 15. TCO / ROI Calculations
  console.log('📈 Création des études TCO & ROI...');
  const existingTco = await prisma.tcoCalculation.findUnique({
    where: { calculationNumber: 'TCO-2024-0001' },
  });

  if (!existingTco && auditDanone) {
    await prisma.tcoCalculation.create({
      data: {
        calculationNumber: 'TCO-2024-0001',
        auditId: auditDanone.id,
        clientId: danoneClient.id,
        machineModelId: createdModels['1880'].id,
        calculationName: 'Étude TCO Centrale Danone - Remplacement CIJ Ligne Yaourts Salé',
        existingAnnualConsumableCost: 52000.0,
        existingAnnualMaintenanceCost: 38000.0,
        existingAnnualDowntimeLosses: 74400.0, // 62h * 1200 MAD coût horaire arrêt
        totalExistingAnnualCost: 164400.0,
        equipmentInvestmentPrice: 128000.0,
        installationAndTrainingPrice: 8500.0,
        videojetAnnualConsumableCost: 36000.0, // Économie solvant -30%
        videojetAnnualMaintenanceCost: 18000.0, // Contrat Platinum inclus
        totalVideojetFirstYearCost: 190500.0,
        totalVideojetSubsequentAnnualCost: 54000.0,
        estimatedAnnualSavings: 110400.0,
        paybackPeriodMonths: 14.8,
        costPerMarkedProductExisting: 0.00228,
        costPerMarkedProductVideojet: 0.00075,
        disclaimer: 'Estimation indicative basée sur 36 000 pots/h, 2 postes de 8h, 300 jours/an. Ne constitue pas un engagement contractuel ferme.',
      },
    });
  }

  // 16. Client Orders
  console.log('📦 Création des commandes fermes...');
  const cooperClient = createdClients['CLI-COO-003'];
  const acceptedQuote = await prisma.quote.findFirst({
    where: { clientId: cooperClient.id, status: QuoteStatus.ACCEPTE },
  });

  const existingOrder = await prisma.order.findUnique({
    where: { orderNumber: 'CMD-2024-0001' },
  });

  if (!existingOrder) {
    await prisma.order.create({
      data: {
        orderNumber: 'CMD-2024-0001',
        quoteId: acceptedQuote ? acceptedQuote.id : null,
        clientId: cooperClient.id,
        createdById: createdUsers['commercial@videojet.ma'].id,
        status: OrderStatus.CONFIRMEE,
        currency: 'EUR',
        exchangeRate: 10.85,
        subtotalHt: 16500.0,
        taxAmount: 3300.0,
        totalTtc: 19800.0,
        deliveryAddress: 'Cooper Pharma, Zone Industrielle Tit Mellil, Casablanca',
        estimatedDeliveryDate: new Date('2024-11-20'),
        trackingNumber: 'TRK-VJ-MA-2024-8891',
        notes: 'Commande validée suite au devis DEV-2024-0003. Installation programmée début décembre.',
        items: {
          create: [
            {
              itemType: 'MACHINE',
              machineModelId: createdModels['3340'].id,
              description: 'Système de marquage laser CO2 Videojet 3340 (30 Watt) avec lentille SHC60',
              quantity: 1,
              unitPrice: 16500.0,
              totalLineHt: 16500.0,
            },
          ],
        },
      },
    });
  }

  // 17. Customer Activity Timeline
  console.log('📅 Création des activités de la timeline client...');
  const existingActivities = await prisma.customerActivity.count();
  if (existingActivities === 0) {
    await prisma.customerActivity.createMany({
      data: [
        {
          clientId: danoneClient.id,
          userId: createdUsers['commercial@videojet.ma'].id,
          type: ActivityType.VISITE,
          title: 'Visite technique usine Salé',
          description: 'Audit sur ligne de conditionnement yaourts. Constat des pannes sur l\'imprimante concurrente.',
          performedAt: new Date('2024-09-10'),
        },
        {
          clientId: danoneClient.id,
          userId: createdUsers['commercial@videojet.ma'].id,
          type: ActivityType.AUDIT,
          title: 'Finalisation rapport d\'audit AUD-2024-0001',
          description: 'Présentation de la recommandation Videojet 1880 IP66 au Directeur Technique.',
          performedAt: new Date('2024-09-15'),
        },
        {
          clientId: cooperClient.id,
          userId: createdUsers['commercial@videojet.ma'].id,
          type: ActivityType.DEVIS,
          title: 'Envoi proposition Laser 3340',
          description: 'Devis DEV-2024-0003 envoyé à M. Karim Alami pour la ligne sirop flacons.',
          performedAt: new Date('2024-10-01'),
        },
        {
          clientId: cooperClient.id,
          userId: createdUsers['commercial@videojet.ma'].id,
          type: ActivityType.REUNION,
          title: 'Signature bon de commande CMD-2024-0001',
          description: 'Validation finale par la direction des achats Cooper Pharma.',
          performedAt: new Date('2024-10-15'),
        },
      ],
    });
  }

  // 18. Suppliers
  console.log('🏭 Création des fournisseurs industriels...');
  const supp1 = await prisma.supplier.upsert({
    where: { code: 'FRN-VJ-001' },
    update: {},
    create: {
      code: 'FRN-VJ-001',
      name: 'Videojet Technologies Inc. (HQ)',
      contactName: 'Mark Jenkins',
      email: 'supply-emea@videojet.com',
      phone: '+1 630 860 7300',
      address: '1500 Mittel Blvd',
      city: 'Wood Dale, IL',
      country: 'USA',
      paymentTerms: '60 jours fin de mois',
      currency: 'USD',
      rating: 4.9,
      notes: 'Maison mère constructeur Videojet - Encres, solvants, têtes d\'impression et modules cœur d\'origine.',
    },
  });

  const supp2 = await prisma.supplier.upsert({
    where: { code: 'FRN-MAR-002' },
    update: {},
    create: {
      code: 'FRN-MAR-002',
      name: 'Poly-Consommables Maroc SARL',
      contactName: 'Tariq Bennis',
      email: 'contact@poly-maroc.ma',
      phone: '+212 522 34 56 78',
      address: 'Zone Industrielle Ain Sebaâ',
      city: 'Casablanca',
      country: 'Maroc',
      paymentTerms: '30 jours net',
      currency: 'MAD',
      rating: 4.6,
      notes: 'Fournisseur local de solvants de nettoyage, solvants de rinçage et kits de maintenance atelier.',
    },
  });

  // Associer les produits au fournisseur principal Videojet
  await prisma.product.updateMany({
    where: {
      partNumber: { in: ['V411-D', 'V706-D', 'V420-D', '408544', '500-0036-610', '215444', '399180', '503212'] },
    },
    data: {
      supplierId: supp1.id,
    },
  });

  // 19. Purchase Orders (Commandes Fournisseurs)
  console.log('📦 Création des bons de commande d\'achat fournisseur...');
  const po1 = await prisma.purchaseOrder.upsert({
    where: { orderNumber: 'ACH-2024-0001' },
    update: {},
    create: {
      orderNumber: 'ACH-2024-0001',
      supplierId: supp1.id,
      createdById: createdUsers['superadmin@videojet.ma'].id,
      status: PurchaseOrderStatus.RECUE_COMPLETE,
      currency: 'MAD',
      exchangeRate: 1.0,
      subtotalHt: 28500.0,
      taxAmount: 5700.0,
      totalTtc: 34200.0,
      orderDate: new Date('2024-02-10'),
      expectedDeliveryDate: new Date('2024-02-25'),
      receivedDate: new Date('2024-02-24'),
      trackingNumber: 'DHL-EXPRESS-99281726',
      notes: 'Réapprovisionnement trimestriel encres et solvants CIJ.',
      items: {
        create: [
          {
            productId: createdProducts['V411-D'].id,
            quantity: 50,
            receivedQuantity: 50,
            unitPrice: 350.0,
            totalLineHt: 17500.0,
          },
          {
            productId: createdProducts['V706-D'].id,
            quantity: 80,
            receivedQuantity: 80,
            unitPrice: 137.5,
            totalLineHt: 11000.0,
          },
        ],
      },
    },
  });

  const po2 = await prisma.purchaseOrder.upsert({
    where: { orderNumber: 'ACH-2024-0002' },
    update: {},
    create: {
      orderNumber: 'ACH-2024-0002',
      supplierId: supp1.id,
      createdById: createdUsers['admin@videojet.ma'].id,
      status: PurchaseOrderStatus.EN_TRANSIT,
      currency: 'MAD',
      exchangeRate: 1.0,
      subtotalHt: 42000.0,
      taxAmount: 8400.0,
      totalTtc: 50400.0,
      orderDate: new Date('2024-10-10'),
      expectedDeliveryDate: new Date('2024-10-30'),
      trackingNumber: 'FEDEX-INTL-44810291',
      notes: 'Commande urgente têtes d\'impression 60 microns et modules cœur CIJ 1880.',
      items: {
        create: [
          {
            productId: createdProducts['399180'].id,
            quantity: 2,
            receivedQuantity: 0,
            unitPrice: 7500.0,
            totalLineHt: 15000.0,
          },
          {
            productId: createdProducts['215444'].id,
            quantity: 2,
            receivedQuantity: 0,
            unitPrice: 9800.0,
            totalLineHt: 19600.0,
          },
          {
            productId: createdProducts['503212'].id,
            quantity: 25,
            receivedQuantity: 0,
            unitPrice: 296.0,
            totalLineHt: 7400.0,
          },
        ],
      },
    },
  });

  // 20. Stock Movements
  console.log('🔄 Traçabilité des mouvements de stock...');
  await prisma.stockMovement.upsert({
    where: { movementNumber: 'MVT-2024-0001' },
    update: {},
    create: {
      movementNumber: 'MVT-2024-0001',
      productId: createdProducts['V411-D'].id,
      purchaseOrderId: po1.id,
      userId: createdUsers['admin@videojet.ma'].id,
      type: StockMovementType.ENTREE_ACHAT,
      quantity: 50,
      stockBefore: 0,
      stockAfter: 50,
      reason: 'Réception commande fournisseur ACH-2024-0001',
    },
  });

  await prisma.stockMovement.upsert({
    where: { movementNumber: 'MVT-2024-0002' },
    update: {},
    create: {
      movementNumber: 'MVT-2024-0002',
      productId: createdProducts['V706-D'].id,
      purchaseOrderId: po1.id,
      userId: createdUsers['admin@videojet.ma'].id,
      type: StockMovementType.ENTREE_ACHAT,
      quantity: 80,
      stockBefore: 0,
      stockAfter: 80,
      reason: 'Réception commande fournisseur ACH-2024-0001',
    },
  });

  await prisma.stockMovement.upsert({
    where: { movementNumber: 'MVT-2024-0003' },
    update: {},
    create: {
      movementNumber: 'MVT-2024-0003',
      productId: createdProducts['V411-D'].id,
      userId: techUser.id,
      type: StockMovementType.SORTIE_INTERVENTION,
      quantity: -2,
      stockBefore: 50,
      stockAfter: 48,
      reason: 'Consommable utilisé lors de l\'intervention INT-2024-0001',
    },
  });

  // 21. Audit Log Initial Events
  console.log('🛡️ Création des journaux d\'audit initiaux...');

  await prisma.auditLog.create({
    data: {
      userId: createdUsers['superadmin@videojet.ma'].id,
      userEmail: 'superadmin@videojet.ma',
      action: 'SYSTEM_INIT',
      entity: 'Platform',
      details: {
        event: 'Initialisation réussie de la plateforme VIDEOJET MAROC INDUSTRIAL PLATFORM',
        version: '1.0.0',
      },
    },
  });

  console.log('✅ Base de données VIDEOJET MAROC initialisée avec succès avec toutes les données réelles !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

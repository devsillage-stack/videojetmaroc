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

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('DATABASE_URL environment variable is required.');
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

async function main() {
  console.log('🚀 Démarrage de l\'injection des données industrielles réelles marocaines dans Neon PostgreSQL...');

  // 1. Initialisation des Devises
  console.log('💱 1/14 Devises & Taux de change...');
  await prisma.currency.upsert({
    where: { code: 'MAD' },
    update: {},
    create: { code: 'MAD', symbol: 'DH', name: 'Dirham Marocain', isBase: true, rateToBase: 1.0 },
  });
  await prisma.currency.upsert({
    where: { code: 'EUR' },
    update: { rateToBase: 10.85 },
    create: { code: 'EUR', symbol: '€', name: 'Euro', isBase: false, rateToBase: 10.85 },
  });
  await prisma.currency.upsert({
    where: { code: 'USD' },
    update: { rateToBase: 10.10 },
    create: { code: 'USD', symbol: '$', name: 'Dollar Américain', isBase: false, rateToBase: 10.10 },
  });

  // 2. Taux de TVA Marocaine
  console.log('📑 2/14 Taux de TVA (Maroc 20% & Exonération)...');
  const tva20 = await prisma.taxRate.upsert({
    where: { id: 'tax-tva-20' },
    update: {},
    create: { id: 'tax-tva-20', name: 'TVA Normale (20%)', rate: 20.0, isDefault: true, isActive: true },
  });
  const tva0 = await prisma.taxRate.upsert({
    where: { id: 'tax-tva-0' },
    update: {},
    create: { id: 'tax-tva-0', name: 'TVA 0% (Export / Zone Franche)', rate: 0.0, isDefault: false, isActive: true },
  });

  // 3. Paramètres de l'Entreprise NEXORA
  console.log('🏢 3/14 Paramètres entreprise NEXORA MAROC...');
  await prisma.companySettings.upsert({
    where: { id: 'default' },
    update: {
      companyName: 'NEXORA MAROC SARL',
      tagline: 'Systèmes Intelligents de Marquage, Codage & Traçabilité Industrielle 4.0',
      address: 'Lotissement Attaoufik, Route 110, Sidi Bernoussi',
      city: 'Casablanca',
      postalCode: '20600',
      country: 'Maroc',
      phone: '+212 522 75 40 00',
      email: 'contact@nexora.ma',
      website: 'www.nexora.ma',
      ice: '001892847000082',
      ifTax: '24890123',
      rc: '412098 Casablanca',
      patente: '34120987',
      cnss: '8901234',
      bankName: 'Attijariwafa Bank Maroc',
      bankAgency: 'Agence Sidi Bernoussi Casablanca',
      rib: '007 780 0001234567890123 45',
      swift: 'BCMAMAMC',
      primaryColor: '#002b49',
      accentColor: '#ff5c00',
    },
    create: {
      id: 'default',
      companyName: 'NEXORA MAROC SARL',
      tagline: 'Systèmes Intelligents de Marquage, Codage & Traçabilité Industrielle 4.0',
      address: 'Lotissement Attaoufik, Route 110, Sidi Bernoussi',
      city: 'Casablanca',
      postalCode: '20600',
      country: 'Maroc',
      phone: '+212 522 75 40 00',
      email: 'contact@nexora.ma',
      website: 'www.nexora.ma',
      ice: '001892847000082',
      ifTax: '24890123',
      rc: '412098 Casablanca',
      patente: '34120987',
      cnss: '8901234',
      bankName: 'Attijariwafa Bank Maroc',
      bankAgency: 'Agence Sidi Bernoussi Casablanca',
      rib: '007 780 0001234567890123 45',
      swift: 'BCMAMAMC',
      primaryColor: '#002b49',
      accentColor: '#ff5c00',
    },
  });

  // 4. Utilisateurs de la Plateforme
  console.log('👥 4/14 Vérification / Création des comptes collaborateurs...');
  const defaultPassword = await bcrypt.hash('Videojet2026!', 10);
  const usersData = [
    { email: 'superadmin@videojet.ma', firstName: 'Karim', lastName: 'El Idrissi', role: Role.SUPER_ADMIN, phone: '+212 661-112233' },
    { email: 'admin@videojet.ma', firstName: 'Nadia', lastName: 'Bennani', role: Role.ADMIN, phone: '+212 661-223344' },
    { email: 'direction@videojet.ma', firstName: 'Tarik', lastName: 'Amrani', role: Role.DIRECTION, phone: '+212 661-334455' },
    { email: 'commercial@videojet.ma', firstName: 'Youssef', lastName: 'Chraibi', role: Role.COMMERCIAL, phone: '+212 661-445566' },
    { email: 'sav.manager@videojet.ma', firstName: 'Mehdi', lastName: 'Alaoui', role: Role.RESPONSABLE_SAV, phone: '+212 661-556677' },
    { email: 'technicien@videojet.ma', firstName: 'Omar', lastName: 'Kabbaj', role: Role.TECHNICIEN_SAV, phone: '+212 661-667788' },
    { email: 'magasinier@videojet.ma', firstName: 'Hassan', lastName: 'Tahiri', role: Role.MAGASINIER, phone: '+212 661-778899' },
    { email: 'comptabilite@videojet.ma', firstName: 'Fatima', lastName: 'Zahra Mansouri', role: Role.COMPTABILITE, phone: '+212 661-889900' },
  ];

  const createdUsers: Record<string, any> = {};
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, phone: u.phone },
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

  // 5. Modèles de Machines Industrielles Videojet
  console.log('🏭 5/14 Modèles de machines Videojet officielles...');
  const modelsData = [
    {
      modelNumber: '1580',
      family: MachineTechnology.CIJ,
      name: 'Videojet 1580 Continuous Inkjet',
      description: 'Imprimante jet d\'encre continu conçue pour minimiser les arrêts imprévus avec interface tactile SIMPLICiTY™ et réservoir tampon de réserve de solvant.',
      maxSpeed: '278 m/min',
      resolution: '60 dpi',
      ipRating: 'IP55 / IP65',
    },
    {
      modelNumber: '1880',
      family: MachineTechnology.CIJ,
      name: 'Videojet 1880 IoT CIJ Printer',
      description: 'Imprimante connectée Industrie 4.0 avec suite prédictive MAXIMiZE™, capteur d\'accumulation d\'encre CleanFlow™ et rinçage automatique complet.',
      maxSpeed: '334 m/min',
      resolution: '70 dpi',
      ipRating: 'IP66 inox 316',
    },
    {
      modelNumber: '3340',
      family: MachineTechnology.LASER_CO2,
      name: 'Videojet 3340 CO2 Laser Marking System',
      description: 'Système de marquage laser CO2 haute puissance 30 Watts, idéal pour l\'emballage grande cadence pharmaceutique, agroalimentaire et tabac.',
      maxSpeed: '900 m/min',
      resolution: 'Marquage vectoriel haute précision',
      ipRating: 'IP54 / IP65',
    },
    {
      modelNumber: '3640',
      family: MachineTechnology.LASER_CO2,
      name: 'Videojet 3640 CO2 Laser Marking System',
      description: 'Système laser 60 Watts ultra haute vitesse pour les cadences extrêmes d\'embouteillage et de canettes (jusqu\'à 150 000 b/h).',
      maxSpeed: '1200 m/min',
      resolution: 'Optique haute résolution galvo',
      ipRating: 'IP65',
    },
    {
      modelNumber: '6530',
      family: MachineTechnology.TTO,
      name: 'Videojet DataFlex 6530 TTO',
      description: 'Surimprimeur à transfert thermique sans air comprimé avec technologie iAssure™ intégrée pour le contrôle qualité en ligne des impressions sur sachets.',
      maxSpeed: '1000 mm/s',
      resolution: '300 dpi',
      ipRating: 'IP66 cassette étanche',
    },
    {
      modelNumber: 'Wolke-m610',
      family: MachineTechnology.TIJ,
      name: 'Wolke m610 touch Thermal Inkjet',
      description: 'Technologie jet d\'encre thermique à cartouches HP pour la sérialisation pharmaceutique et la traçabilité Track & Trace GS1 DataMatrix.',
      maxSpeed: '60 m/min à 600 dpi',
      resolution: '600 x 600 dpi',
      ipRating: 'IP20 boîtier inox pharma',
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

  // 6. Fournisseurs Industriels Réels & Actifs
  console.log('🤝 6/14 Fournisseurs industriels actifs...');
  const suppliersData = [
    {
      code: 'FRN-VJ-001',
      name: 'Videojet Technologies Inc. (HQ & EMEA)',
      contactName: 'Mark Jenkins (Directeur Supply Chain EMEA)',
      email: 'supply-emea@videojet.com',
      phone: '+1 630 860 7300',
      address: '1500 Mittel Blvd, Wood Dale, IL 60191 / Distribution Center Pays-Bas',
      city: 'Chicago / Amsterdam',
      country: 'USA / Europe',
      paymentTerms: '60 jours fin de mois',
      currency: 'USD',
      rating: 4.9,
      notes: 'Constructeur et fabricant d\'origine officiel : Imprimantes CIJ, Laser, TTO, encres brevetées et pièces OEM sous garantie constructeur.',
    },
    {
      code: 'FRN-CMCP-002',
      name: 'CMCP - International Paper Maroc',
      contactName: 'Noureddine El Fassi (Responsable Ventes Industrielles)',
      email: 'contact@cmcp-ip.com',
      phone: '+212 522 35 12 34',
      address: 'Boulevard Chefchaouni, Zone Industrielle Aïn Sebaâ',
      city: 'Casablanca',
      country: 'Maroc',
      paymentTerms: '30 jours fin de mois',
      currency: 'MAD',
      rating: 4.8,
      notes: 'Leader de l\'emballage carton ondulé au Maroc. Fourniture des cartons et bobines supports pour tests de marquage et caisses logistiques.',
    },
    {
      code: 'FRN-MAG-003',
      name: 'Maghreb Emballage SARL',
      contactName: 'Khalid Benmoussa',
      email: 'commercial@maghreb-emballage.ma',
      phone: '+212 522 73 89 00',
      address: 'Zone Industrielle Sidi Bernoussi, Rue 2',
      city: 'Casablanca',
      country: 'Maroc',
      paymentTerms: '30 jours net',
      currency: 'MAD',
      rating: 4.6,
      notes: 'Spécialiste de l\'emballage industriel rigide et souple, films étirables et calages pour expédition de matériel haute technologie.',
    },
    {
      code: 'FRN-AIR-004',
      name: 'Air Liquide Maroc S.A.',
      contactName: 'Amina Cherkaoui (Ingénieure Grands Comptes)',
      email: 'contact.maroc@airliquide.com',
      phone: '+212 522 67 92 00',
      address: 'Boulevard Ahl Loghlam, Z.I. Sidi Bernoussi',
      city: 'Casablanca',
      country: 'Maroc',
      paymentTerms: '45 jours fin de mois',
      currency: 'MAD',
      rating: 4.9,
      notes: 'Fourniture de gaz industriels purs, azote haute pureté pour purge optique des lasers Videojet CO2 et solvants techniques.',
    },
    {
      code: 'FRN-SOM-005',
      name: 'Somafic Maroc (Fournitures Industrielles & Chimiques)',
      contactName: 'Tariq Bennis',
      email: 'contact@somafic-maroc.ma',
      phone: '+212 523 32 45 67',
      address: 'Boulevard Hassan II, Km 23',
      city: 'Mohammedia',
      country: 'Maroc',
      paymentTerms: '30 jours net',
      currency: 'MAD',
      rating: 4.5,
      notes: 'Distributeur de produits chimiques de nettoyage et dégraissage industriel, équipements de protection individuelle (EPI) chimie.',
    },
    {
      code: 'FRN-DIS-006',
      name: 'Distritec Automation Maroc',
      contactName: 'Yassir Lahlou',
      email: 'y.lahlou@distritec-maroc.com',
      phone: '+212 522 34 88 90',
      address: 'Zone Industrielle Aïn Sebaâ, Allée des Usines',
      city: 'Casablanca',
      country: 'Maroc',
      paymentTerms: '30 jours net',
      currency: 'MAD',
      rating: 4.7,
      notes: 'Fourniture de capteurs industriels (Sick, Omron, Keyence), convoyeurs d\'essais, codeurs incrémentaux tachymétriques et cellules photoélectriques.',
    },
  ];

  const createdSuppliers: Record<string, any> = {};
  for (const s of suppliersData) {
    const supplier = await prisma.supplier.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
    createdSuppliers[s.code] = supplier;
  }

  // 7. Clients Industriels Réels, Sites, Lignes & Contacts au Maroc
  console.log('🏭 7/14 Clients industriels marocains (Grands comptes de référence)...');
  const clientsData = [
    {
      code: 'CLI-DAN-001',
      name: 'Centrale Danone Maroc S.A.',
      type: ClientType.CLIENT,
      industrySector: IndustrySector.AGROALIMENTAIRE,
      ice: '001524889000045',
      rc: '30129 Casablanca',
      ifTax: '01084223',
      city: 'Casablanca',
      address: 'Boulevard Moulay Slimane, Roches Noires / Aïn Sebaâ',
      phone: '+212 522 35 40 00',
      email: 'maintenance.maroc@danone.com',
      contact: {
        firstName: 'Rachid',
        lastName: 'El Mansouri',
        position: 'Directeur Maintenance & Ingénierie Groupe',
        phone: '+212 661-897654',
        email: 'r.elmansouri@danone.com',
      },
      sites: [
        {
          name: 'Usine Salé',
          city: 'Salé',
          address: 'Route de Meknès, Zone Industrielle Tabriquet',
          lines: ['Ligne Tetra Pak Briques Aseptic 1L', 'Ligne Yaourts Pots 125g'],
        },
        {
          name: 'Usine Meknès',
          city: 'Meknès',
          address: 'Quartier Industriel Sidi Bouzekri',
          lines: ['Ligne Bouteilles Lait Frais 500ml', 'Ligne Fromage Fondu Portion'],
        },
      ],
    },
    {
      code: 'CLI-COS-002',
      name: 'Cosumar S.A.',
      type: ClientType.CLIENT,
      industrySector: IndustrySector.AGROALIMENTAIRE,
      ice: '000012345000099',
      rc: '125 Casablanca',
      ifTax: '01000145',
      city: 'Casablanca',
      address: '8, Rue El Mouatamid Ibn Abbad, Roches Noires',
      phone: '+212 522 24 20 00',
      email: 'achats.techniques@cosumar.co.ma',
      contact: {
        firstName: 'Anas',
        lastName: 'Tazi',
        position: 'Responsable Conditionnement & Lignes Grande Vitesse',
        phone: '+212 661-345678',
        email: 'a.tazi@cosumar.co.ma',
      },
      sites: [
        {
          name: 'Raffinerie Casablanca',
          city: 'Casablanca',
          address: 'Roches Noires',
          lines: ['Ligne Pain de Sucre 2kg Hesser', 'Ligne Sucre Morceaux 1kg', 'Ligne Sacs 50kg Sucre Cristallisé'],
        },
        {
          name: 'Sucrerie Sidi Bennour',
          city: 'Sidi Bennour',
          address: 'Route de Marrakech, Zone Industrielle',
          lines: ['Ligne Conditionnement Sucre Roux'],
        },
      ],
    },
    {
      code: 'CLI-COO-003',
      name: 'Cooper Pharma S.A.',
      type: ClientType.CLIENT,
      industrySector: IndustrySector.PHARMACEUTIQUE,
      ice: '001678901000012',
      rc: '8901 Casablanca',
      ifTax: '01083991',
      city: 'Casablanca',
      address: '41, Rue Mohamed Diouri, Casablanca / Z.I. Tit Mellil',
      phone: '+212 522 51 00 00',
      email: 'technique@cooperpharma.ma',
      contact: {
        firstName: 'Dr. Meriem',
        lastName: 'Alj',
        position: 'Directrice Assurance Qualité & Packaging Pharma',
        phone: '+212 661-987123',
        email: 'm.alj@cooperpharma.ma',
      },
      sites: [
        {
          name: 'Site Tit Mellil',
          city: 'Casablanca',
          address: 'Zone Industrielle Tit Mellil, Route de Tit Mellil',
          lines: ['Ligne Sérialisation Blisters Uhlmann GS1', 'Ligne Flacons Sirops Médicamenteux'],
        },
      ],
    },
    {
      code: 'CLI-LES-004',
      name: 'Lesieur Cristal (Groupe Avril)',
      type: ClientType.CLIENT,
      industrySector: IndustrySector.AGROALIMENTAIRE,
      ice: '001556789000033',
      rc: '2893 Casablanca',
      ifTax: '01084882',
      city: 'Casablanca',
      address: 'Zone Industrielle Aïn Harrouda, Km 14 Route 110',
      phone: '+212 522 76 50 00',
      email: 'production@lesieur-cristal.co.ma',
      contact: {
        firstName: 'Hamid',
        lastName: 'Berrada',
        position: 'Chef de Département Maintenance Usine',
        phone: '+212 661-456789',
        email: 'h.berrada@lesieur-cristal.co.ma',
      },
      sites: [
        {
          name: 'Complexe Aïn Harrouda',
          city: 'Mohammedia',
          address: 'Route Nationale 1, Aïn Harrouda',
          lines: ['Ligne Huile Table PET 1L (18 000 bph)', 'Ligne Bidons 5L Huile Végétale', 'Ligne Savonnerie Taous Étuis'],
        },
      ],
    },
    {
      code: 'CLI-SOT-005',
      name: 'Sothema Laboratoires',
      type: ClientType.CLIENT,
      industrySector: IndustrySector.PHARMACEUTIQUE,
      ice: '001789456000088',
      rc: '34567 Casablanca',
      ifTax: '01086432',
      city: 'Casablanca',
      address: 'Parc Industriel de Bouskoura, Lot 34',
      phone: '+212 522 33 44 00',
      email: 'maintenance@sothema.ma',
      contact: {
        firstName: 'Yassine',
        lastName: 'Ouazzani',
        position: 'Responsable Travaux Neufs & Équipements Stériles',
        phone: '+212 661-234567',
        email: 'y.ouazzani@sothema.ma',
      },
      sites: [
        {
          name: 'Campus Bioprod Bouskoura',
          city: 'Bouskoura',
          address: 'Bouskoura Techpark',
          lines: ['Ligne Ampoules Injectables Stériles', 'Ligne Étuis Comprimés DataMatrix GS1'],
        },
      ],
    },
    {
      code: 'CLI-COP-006',
      name: 'COPAG - Jaouda (Coopérative Agricole)',
      type: ClientType.CLIENT,
      industrySector: IndustrySector.AGROALIMENTAIRE,
      ice: '001602456000021',
      rc: '1245 Taroudant',
      ifTax: '06900234',
      city: 'Taroudant',
      address: 'Route de Marrakech, Aït Iaâza, Taroudant',
      phone: '+212 528 85 90 00',
      email: 'direction.technique@jaouda.ma',
      contact: {
        firstName: 'Mustapha',
        lastName: 'Bouhouch',
        position: 'Directeur d\'Exploitation & Conditionnement UHT',
        phone: '+212 661-332211',
        email: 'm.bouhouch@jaouda.ma',
      },
      sites: [
        {
          name: 'Complexe Industriel Aït Iaâza',
          city: 'Taroudant',
          address: 'Aït Iaâza, Route de Marrakech',
          lines: ['Ligne Briques Jus & Lait UHT Combibloc 1L', 'Ligne Yaourts à Boire Raïbi 250g'],
        },
      ],
    },
    {
      code: 'CLI-SBM-007',
      name: 'Société des Boissons du Maroc (SBM - Groupe Castel)',
      type: ClientType.CLIENT,
      industrySector: IndustrySector.BOISSONS,
      ice: '001525112000034',
      rc: '412 Casablanca',
      ifTax: '01084561',
      city: 'Casablanca',
      address: 'Boulevard Ahl Loghlam, Aïn Sebaâ',
      phone: '+212 522 75 90 00',
      email: 'technique@boissons-maroc.com',
      contact: {
        firstName: 'Tariq',
        lastName: 'Mansour',
        position: 'Directeur Technique Lignes Embouteillage',
        phone: '+212 661-443322',
        email: 't.mansour@boissons-maroc.com',
      },
      sites: [
        {
          name: 'Usine Aïn Sebaâ',
          city: 'Casablanca',
          address: 'Bd Ahl Loghlam, Aïn Sebaâ',
          lines: ['Ligne Embouteillage Bouteilles Verre Retournables (36 000 bph)', 'Ligne Fûts Inox 30L / 50L'],
        },
      ],
    },
    {
      code: 'CLI-OUL-008',
      name: 'Société des Eaux Minérales d\'Oulmès (SEMO - Sidi Ali)',
      type: ClientType.CLIENT,
      industrySector: IndustrySector.BOISSONS,
      ice: '001526778000067',
      rc: '512 Casablanca',
      ifTax: '01085002',
      city: 'Casablanca',
      address: 'Boulevard Hassan II, Casablanca / Usine Bouskoura',
      phone: '+212 522 43 50 00',
      email: 'maintenance.eau@oulmes.ma',
      contact: {
        firstName: 'Karim',
        lastName: 'Benjelloun',
        position: 'Chef de Département Lignes d\'Embouteillage Grande Vitesse',
        phone: '+212 661-554433',
        email: 'k.benjelloun@oulmes.ma',
      },
      sites: [
        {
          name: 'Usine d\'Embouteillage Bouskoura',
          city: 'Bouskoura',
          address: 'Zone Industrielle Bouskoura, Route d\'Oulmès',
          lines: ['Ligne Soufflage & Remplissage PET Sidi Ali 1.5L (40 000 bph)', 'Ligne Aïn Saïss PET 0.5L'],
        },
      ],
    },
    {
      code: 'CLI-DAR-009',
      name: 'Dari Couspate (Dari Couscous & Pâtes)',
      type: ClientType.CLIENT,
      industrySector: IndustrySector.AGROALIMENTAIRE,
      ice: '001518923000078',
      rc: '14210 Salé',
      ifTax: '03301254',
      city: 'Salé',
      address: '129, Zone Industrielle Tabriquet, Salé',
      phone: '+212 537 81 20 00',
      email: 'production@dari.ma',
      contact: {
        firstName: 'Hicham',
        lastName: 'Khalil',
        position: 'Directeur Industriel & Conditionnement',
        phone: '+212 661-665544',
        email: 'h.khalil@dari.ma',
      },
      sites: [
        {
          name: 'Usine Salé Tabriquet',
          city: 'Salé',
          address: '129 Z.I. Tabriquet',
          lines: ['Ligne Ensachage Couscous 1kg & 500g', 'Ligne Conditionnement Pâtes Courtes'],
        },
      ],
    },
    {
      code: 'CLI-YAZ-010',
      name: 'Yazaki Morocco (Tanger Free Zone)',
      type: ClientType.CLIENT,
      industrySector: IndustrySector.AUTOMOBILE_CABLE,
      ice: '001567890000054',
      rc: '22100 Tanger',
      ifTax: '04901234',
      city: 'Tanger',
      address: 'Ilot 43, Zone Franche d\'Exportation de Tanger (TFZ)',
      phone: '+212 539 39 80 00',
      email: 'yazaki.morocco@yazaki-europe.com',
      contact: {
        firstName: 'Adil',
        lastName: 'Zniber',
        position: 'Plant Equipment & Maintenance Manager',
        phone: '+212 661-776655',
        email: 'a.zniber@yazaki-europe.com',
      },
      sites: [
        {
          name: 'Usine TFZ Tanger',
          city: 'Tanger',
          address: 'TFZ Ilot 43, Aéroport Ibn Battouta',
          lines: ['Ligne Extrusion & Marquage Faisceaux Électriques Automoto', 'Ligne Débit & Codage Haute Cadence'],
        },
      ],
    },
  ];

  const createdClients: Record<string, any> = {};
  const createdSites: Record<string, any> = {};
  const createdLines: Record<string, any> = {};

  for (const c of clientsData) {
    const client = await prisma.client.upsert({
      where: { code: c.code },
      update: {
        name: c.name,
        ice: c.ice,
        rc: c.rc,
        ifTax: c.ifTax,
        address: c.address,
        city: c.city,
        phone: c.phone,
        email: c.email,
        status: ClientStatus.ACTIF,
      },
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

    // Contact principal
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

    // Sites et Lignes
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
            speedUnitsPerHour: 15000,
          },
        });
        createdLines[`${c.code}_${s.name}_${lineName}`] = line;
      }
    }
  }

  // 8. Catalogue Produits, Consommables & Pièces Réelles Videojet
  console.log('📦 8/14 Produits & consommables certifiés Videojet...');
  const vSupp = createdSuppliers['FRN-VJ-001'];
  const distriSupp = createdSuppliers['FRN-DIS-006'];

  const productsData = [
    // Encres & Solvants CIJ
    {
      partNumber: 'V411-D',
      name: 'Encre Noire Standard MEK CIJ (750ml iQMark™)',
      type: ProductType.ENCRE,
      technology: MachineTechnology.CIJ,
      description: 'Encre noire à séchage rapide à base de MEK pour surfaces plastiques (PET/PE), verre et métal. Puce RFID iQMark™ intégrée.',
      unitPrice: 850.0,
      costPrice: 420.0,
      stockQuantity: 65,
      minStockThreshold: 15,
      unit: ProductUnit.CARTOUCHE,
      supplierId: vSupp.id,
    },
    {
      partNumber: 'V706-D',
      name: 'Solvant / Make-up Standard CIJ (750ml Smart Cartridge™)',
      type: ProductType.SOLVANT_MAKEUP,
      technology: MachineTechnology.CIJ,
      description: 'Solvant de compensation actif pour encre V411-D. Restaure la viscosité idéale du jet en continu.',
      unitPrice: 380.0,
      costPrice: 160.0,
      stockQuantity: 12, // Stock proche du seuil critique
      minStockThreshold: 20,
      unit: ProductUnit.CARTOUCHE,
      supplierId: vSupp.id,
    },
    {
      partNumber: 'V420-D',
      name: 'Encre Sans MEK Éthanol Alimentaire (750ml)',
      type: ProductType.ENCRE,
      technology: MachineTechnology.CIJ,
      description: 'Encre sans solvants chlorés ni MEK, formulation à base d\'éthanol certifiée contact alimentaire indirect pour produits laitiers.',
      unitPrice: 990.0,
      costPrice: 510.0,
      stockQuantity: 28,
      minStockThreshold: 10,
      unit: ProductUnit.CARTOUCHE,
      supplierId: vSupp.id,
    },
    {
      partNumber: 'V720-D',
      name: 'Solvant / Make-up Éthanol CIJ (750ml)',
      type: ProductType.SOLVANT_MAKEUP,
      technology: MachineTechnology.CIJ,
      description: 'Solvant de compensation pour encre contact alimentaire V420-D.',
      unitPrice: 420.0,
      costPrice: 180.0,
      stockQuantity: 18,
      minStockThreshold: 10,
      unit: ProductUnit.CARTOUCHE,
      supplierId: vSupp.id,
    },
    {
      partNumber: 'V4210-D',
      name: 'Encre Thermochromique Noire -> Rouge Autoclave (750ml)',
      type: ProductType.ENCRE,
      technology: MachineTechnology.CIJ,
      description: 'Encre de sécurité stérilisation vapeur autoclave : change de couleur (du noir au rouge vif) lors du passage à 121°C.',
      unitPrice: 1450.0,
      costPrice: 780.0,
      stockQuantity: 14,
      minStockThreshold: 5,
      unit: ProductUnit.CARTOUCHE,
      supplierId: vSupp.id,
    },
    {
      partNumber: 'V418-D',
      name: 'Encre Jaune Pigmentée Haute Visibilité Câblerie (750ml)',
      type: ProductType.ENCRE,
      technology: MachineTechnology.CIJ,
      description: 'Encre pigmentée jaune à contraste exceptionnel sur gaines sombres, tuyaux et profilés en extrusion.',
      unitPrice: 1650.0,
      costPrice: 890.0,
      stockQuantity: 20,
      minStockThreshold: 6,
      unit: ProductUnit.CARTOUCHE,
      supplierId: vSupp.id,
    },
    {
      partNumber: 'V901-Q',
      name: 'Solution de Nettoyage & Rinçage Tête CIJ (Flacon 1 Litre)',
      type: ProductType.NETTOYANT,
      technology: MachineTechnology.CIJ,
      description: 'Solvant de lavage puissant avec bec verseur pour décollement d\'encre séchée sur buse et électrodes de déflexion.',
      unitPrice: 290.0,
      costPrice: 110.0,
      stockQuantity: 45,
      minStockThreshold: 15,
      unit: ProductUnit.LITRE,
      supplierId: vSupp.id,
    },
    // Consommables TTO & TIJ
    {
      partNumber: '408544',
      name: 'Ruban Transfert Thermique TTO Ultra Black 55mm x 1000m',
      type: ProductType.RUBAN_TTO,
      technology: MachineTechnology.TTO,
      description: 'Ruban résine/cire haute adhérence pour emballages souples, sachets de couscous, pâtes et snacks.',
      unitPrice: 320.0,
      costPrice: 140.0,
      stockQuantity: 95,
      minStockThreshold: 20,
      unit: ProductUnit.ROULEAU,
      supplierId: vSupp.id,
    },
    {
      partNumber: '408546',
      name: 'Ruban TTO Premium Grande Vitesse 33mm x 1200m',
      type: ProductType.RUBAN_TTO,
      technology: MachineTechnology.TTO,
      description: 'Ruban ultra long métrage pour ensacheuses grande vitesse, réduisant la fréquence des changements de bobine.',
      unitPrice: 280.0,
      costPrice: 125.0,
      stockQuantity: 60,
      minStockThreshold: 15,
      unit: ProductUnit.ROULEAU,
      supplierId: vSupp.id,
    },
    {
      partNumber: '500-0036-610',
      name: 'Cartouche TIJ Wolke Solvant Noir Pharma (42ml)',
      type: ProductType.ENCRE,
      technology: MachineTechnology.TIJ,
      description: 'Cartouche HP 45si haute résolution 600 dpi pour cartons vernis pharmaceutiques et traçabilité Datamatrix sérialisée.',
      unitPrice: 1250.0,
      costPrice: 700.0,
      stockQuantity: 42,
      minStockThreshold: 10,
      unit: ProductUnit.CARTOUCHE,
      supplierId: vSupp.id,
    },
    // Pièces Détachées & Modules Cœur (SAV)
    {
      partNumber: '215444',
      name: 'Core Module CIJ 1880 (Module Cœur de Filtration)',
      type: ProductType.MODULE_COEUR,
      technology: MachineTechnology.CIJ,
      description: 'Système tout-en-un de pompes et filtres étanches sans maintenance manuelle pendant 14 000 heures de fonctionnement.',
      unitPrice: 18500.0,
      costPrice: 9800.0,
      stockQuantity: 5,
      minStockThreshold: 2,
      unit: ProductUnit.KIT,
      supplierId: vSupp.id,
    },
    {
      partNumber: '399180',
      name: 'Tête d\'Impression Complète CIJ 60 Microns',
      type: ProductType.TETE_IMPRESSION,
      technology: MachineTechnology.CIJ,
      description: 'Tête d\'impression d\'origine Videojet avec technologie CleanFlow™ et buse saphir pour cadences soutenues.',
      unitPrice: 14200.0,
      costPrice: 7500.0,
      stockQuantity: 4,
      minStockThreshold: 2,
      unit: ProductUnit.PIECE,
      supplierId: vSupp.id,
    },
    {
      partNumber: '503212',
      name: 'Filtre Principal d\'Encre 5 Microns Haute Pression',
      type: ProductType.FILTRE,
      technology: MachineTechnology.CIJ,
      description: 'Filtre capsule d\'origine Videojet pour rétention des microparticules dans le circuit d\'encre sous pression.',
      unitPrice: 650.0,
      costPrice: 280.0,
      stockQuantity: 35,
      minStockThreshold: 10,
      unit: ProductUnit.PIECE,
      supplierId: vSupp.id,
    },
    {
      partNumber: 'AL-3340-LENS',
      name: 'Lentille de Focalisation SHC60 pour Laser Videojet 3340',
      type: ProductType.ACCESSOIRE,
      technology: MachineTechnology.LASER_CO2,
      description: 'Optique de précision en ZnSe pour focalisation du faisceau laser CO2, champ de marquage 100x100mm.',
      unitPrice: 8900.0,
      costPrice: 4600.0,
      stockQuantity: 3,
      minStockThreshold: 1,
      unit: ProductUnit.PIECE,
      supplierId: vSupp.id,
    },
    {
      partNumber: 'AL-FILT-LASER',
      name: 'Filtre Combiné HEPA/Charbon Actif Extracteur Laser X-Extract',
      type: ProductType.FILTRE,
      technology: MachineTechnology.LASER_CO2,
      description: 'Filtre d\'extraction pour aspiration sécurisée des fumées et particules fines générées lors du marquage laser.',
      unitPrice: 3400.0,
      costPrice: 1750.0,
      stockQuantity: 8,
      minStockThreshold: 3,
      unit: ProductUnit.PIECE,
      supplierId: vSupp.id,
    },
    {
      partNumber: 'ENC-600-OMR',
      name: 'Encodeur Tachymétrique Industriel 5000 PPR avec Roue',
      type: ProductType.ACCESSOIRE,
      technology: MachineTechnology.CIJ,
      description: 'Codeur de vitesse de convoyeur haute précision pour synchronisation parfaite du message quelle que soit la variation de cadence.',
      unitPrice: 2200.0,
      costPrice: 1100.0,
      stockQuantity: 10,
      minStockThreshold: 3,
      unit: ProductUnit.PIECE,
      supplierId: distriSupp.id,
    },
  ];

  const createdProducts: Record<string, any> = {};
  for (const p of productsData) {
    const prod = await prisma.product.upsert({
      where: { partNumber: p.partNumber },
      update: {
        unitPrice: p.unitPrice,
        costPrice: p.costPrice,
        stockQuantity: p.stockQuantity,
        minStockThreshold: p.minStockThreshold,
        supplierId: p.supplierId,
      },
      create: p,
    });
    createdProducts[p.partNumber] = prod;
  }

  // 9. Lots de Stock avec Traçabilité & Alertes Péremption
  console.log('🧪 9/14 Lots de stock & traçabilité par date de péremption...');
  const expFuture = new Date();
  expFuture.setMonth(expFuture.getMonth() + 14);

  const expNear = new Date();
  expNear.setDate(expNear.getDate() + 22); // Alerte péremption (< 30 jours)

  const expPast = new Date();
  expPast.setDate(expPast.getDate() - 15); // Périmé

  await prisma.stockBatch.create({
    data: {
      productId: createdProducts['V411-D'].id,
      batchNumber: 'LOT-VJ-2024-0411-01',
      expirationDate: expFuture,
      quantity: 50,
      warehouseLocation: 'Casablanca Dépôt Central - Allée 2 Travée B',
      status: BatchStatus.VALIDE,
    },
  });

  await prisma.stockBatch.create({
    data: {
      productId: createdProducts['V411-D'].id,
      batchNumber: 'LOT-VJ-2023-0411-99',
      expirationDate: expNear,
      quantity: 15,
      warehouseLocation: 'Casablanca Dépôt Central - Rayon Alertes',
      status: BatchStatus.ALERTE_PEREMPTION,
    },
  });

  await prisma.stockBatch.create({
    data: {
      productId: createdProducts['V706-D'].id,
      batchNumber: 'LOT-SLV-2023-0706-05',
      expirationDate: expPast,
      quantity: 2,
      warehouseLocation: 'Zone Quarantaine / Déchetterie Agréée',
      status: BatchStatus.PERIME,
    },
  });

  await prisma.stockBatch.create({
    data: {
      productId: createdProducts['500-0036-610'].id,
      batchNumber: 'LOT-WLK-2024-1102',
      expirationDate: expFuture,
      quantity: 42,
      warehouseLocation: 'Armoire Climatisation Pharma 15-25°C',
      status: BatchStatus.VALIDE,
    },
  });

  // 10. Parc Machines Réel Installé (12 Machines avec QR codes et statuts actifs)
  console.log('📠 10/14 Parc machines en exploitation (12 machines réparties)...');
  const machinesConfig = [
    // Centrale Danone
    {
      serial: 'VJ1880-MA-2023-0101',
      model: '1880',
      clientCode: 'CLI-DAN-001',
      siteName: 'Usine Salé',
      lineName: 'Ligne Tetra Pak Briques Aseptic 1L',
      status: MachineStatus.OPERATIONNELLE,
      installDate: new Date('2023-03-15'),
      hours: 4250.5,
      prints: BigInt(18500200),
      notes: 'Imprimante connectée 3x8 - marquage DLC/Lot sur bouchons Tetra Pak. Suivi prédictif MAXIMiZE actif.',
    },
    {
      serial: 'VJ1580-MA-2022-0889',
      model: '1580',
      clientCode: 'CLI-DAN-001',
      siteName: 'Usine Salé',
      lineName: 'Ligne Yaourts Pots 125g',
      status: MachineStatus.EN_PANNE,
      installDate: new Date('2022-09-10'),
      hours: 8120.0,
      prints: BigInt(34120900),
      notes: 'Arrêt intempestif détecté - défaut de viscosité encre suite à arrêt prolongé week-end.',
    },
    {
      serial: 'VJ1880-MA-2023-0112',
      model: '1880',
      clientCode: 'CLI-DAN-001',
      siteName: 'Usine Meknès',
      lineName: 'Ligne Bouteilles Lait Frais 500ml',
      status: MachineStatus.OPERATIONNELLE,
      installDate: new Date('2023-05-20'),
      hours: 3600.0,
      prints: BigInt(14200000),
      notes: 'Lavage ligne quotidien - boîtier inox IP66 opérationnel.',
    },
    // Cosumar S.A.
    {
      serial: 'VJ3640-MA-2023-0042',
      model: '3640',
      clientCode: 'CLI-COS-002',
      siteName: 'Raffinerie Casablanca',
      lineName: 'Ligne Sucre Morceaux 1kg',
      status: MachineStatus.OPERATIONNELLE,
      installDate: new Date('2023-06-20'),
      hours: 3100.0,
      prints: BigInt(8900100),
      notes: 'Laser CO2 60W ultra haute cadence sur étuis carton sucre morceaux. Zéro consommable.',
    },
    {
      serial: 'VJ1580-MA-2023-0450',
      model: '1580',
      clientCode: 'CLI-COS-002',
      siteName: 'Raffinerie Casablanca',
      lineName: 'Ligne Sacs 50kg Sucre Cristallisé',
      status: MachineStatus.OPERATIONNELLE,
      installDate: new Date('2023-01-18'),
      hours: 5400.0,
      prints: BigInt(6200000),
      notes: 'Marquage gros caractères sur sacs polypropylène tissé.',
    },
    // Cooper Pharma
    {
      serial: 'WOLKE-MA-2024-0019',
      model: 'Wolke-m610',
      clientCode: 'CLI-COO-003',
      siteName: 'Site Tit Mellil',
      lineName: 'Ligne Sérialisation Blisters Uhlmann GS1',
      status: MachineStatus.OPERATIONNELLE,
      installDate: new Date('2024-01-15'),
      hours: 950.0,
      prints: BigInt(2450000),
      notes: 'Impression GS1 DataMatrix conforme réglementation sérialisation export UE et Afrique.',
    },
    // Lesieur Cristal
    {
      serial: 'VJ3340-MA-2023-0115',
      model: '3340',
      clientCode: 'CLI-LES-004',
      siteName: 'Complexe Aïn Harrouda',
      lineName: 'Ligne Huile Table PET 1L (18 000 bph)',
      status: MachineStatus.OPERATIONNELLE,
      installDate: new Date('2023-04-10'),
      hours: 4800.0,
      prints: BigInt(22100000),
      notes: 'Laser CO2 30W marquage col de bouteille PET transparente. Cadence 18 000 bph.',
    },
    {
      serial: 'VJ1880-MA-2023-0330',
      model: '1880',
      clientCode: 'CLI-LES-004',
      siteName: 'Complexe Aïn Harrouda',
      lineName: 'Ligne Bidons 5L Huile Végétale',
      status: MachineStatus.EN_MAINTENANCE,
      installDate: new Date('2023-07-01'),
      hours: 2900.0,
      prints: BigInt(4100000),
      notes: 'En cours de maintenance préventive semestrielle et remplacement filtre encre.',
    },
    // Sothema
    {
      serial: 'WOLKE-MA-2024-0025',
      model: 'Wolke-m610',
      clientCode: 'CLI-SOT-005',
      siteName: 'Campus Bioprod Bouskoura',
      lineName: 'Ligne Ampoules Injectables Stériles',
      status: MachineStatus.OPERATIONNELLE,
      installDate: new Date('2024-02-10'),
      hours: 820.0,
      prints: BigInt(1890000),
      notes: 'Système TIJ salle blanche classe B - cartouches HP solvant certifiées pharma.',
    },
    // COPAG Jaouda
    {
      serial: 'VJ1880-MA-2023-0780',
      model: '1880',
      clientCode: 'CLI-COP-006',
      siteName: 'Complexe Industriel Aït Iaâza',
      lineName: 'Ligne Briques Jus & Lait UHT Combibloc 1L',
      status: MachineStatus.OPERATIONNELLE,
      installDate: new Date('2023-08-14'),
      hours: 3200.0,
      prints: BigInt(12500000),
      notes: 'Ligne SIG Combibloc grande vitesse à Taroudant.',
    },
    // Dari Couscous
    {
      serial: 'DF6530-MA-2023-0301',
      model: '6530',
      clientCode: 'CLI-DAR-009',
      siteName: 'Usine Salé Tabriquet',
      lineName: 'Ligne Ensachage Couscous 1kg & 500g',
      status: MachineStatus.OPERATIONNELLE,
      installDate: new Date('2023-09-05'),
      hours: 2150.0,
      prints: BigInt(5400000),
      notes: 'Surimprimeur TTO sans air comprimé avec iAssure™ sur ensacheuse verticale.',
    },
    // Yazaki Morocco
    {
      serial: 'VJ1880-MA-2023-0910',
      model: '1880',
      clientCode: 'CLI-YAZ-010',
      siteName: 'Usine TFZ Tanger',
      lineName: 'Ligne Extrusion & Marquage Faisceaux Électriques Automoto',
      status: MachineStatus.OPERATIONNELLE,
      installDate: new Date('2023-11-20'),
      hours: 1980.0,
      prints: BigInt(15200000),
      notes: 'CIJ micro-caractère avec encre jaune V418-D sur câbles automobiles à 500 m/min.',
    },
  ];

  const createdMachines: Record<string, any> = {};
  for (const m of machinesConfig) {
    const client = createdClients[m.clientCode];
    const site = createdSites[`${m.clientCode}_${m.siteName}`];
    const line = createdLines[`${m.clientCode}_${m.siteName}_${m.lineName}`];
    const model = createdModels[m.model];

    const qrData = await QRCode.toDataURL(
      JSON.stringify({ serial: m.serial, model: model.name, client: client.name, site: m.siteName })
    );

    const machine = await prisma.machine.upsert({
      where: { serialNumber: m.serial },
      update: {
        status: m.status,
        totalOperatingHours: m.hours,
        totalPrintsCount: m.prints,
        notes: m.notes,
      },
      create: {
        serialNumber: m.serial,
        modelId: model.id,
        clientId: client.id,
        siteId: site ? site.id : null,
        lineId: line ? line.id : null,
        status: m.status,
        installDate: m.installDate,
        totalOperatingHours: m.hours,
        totalPrintsCount: m.prints,
        qrCodeData: qrData,
        notes: m.notes,
      },
    });
    createdMachines[m.serial] = machine;
  }

  // 11. Contrats de Maintenance Industrielle
  console.log('📜 11/14 Contrats de maintenance & engagements SLA...');
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
      notes: 'Couverture 24/7 avec astreinte technique week-end et révision préventive bimestrielle.',
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

  await prisma.maintenanceContract.upsert({
    where: { contractNumber: 'CTR-COS-2024-GOLD' },
    update: {},
    create: {
      contractNumber: 'CTR-COS-2024-GOLD',
      clientId: createdClients['CLI-COS-002'].id,
      type: ContractType.GOLD,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2025-02-28'),
      annualCost: 92000.0,
      currency: 'MAD',
      visitsPerYear: 4,
      visitsCompleted: 3,
      responseTimeHours: 8,
      includesParts: false,
      includesConsumables: false,
      notes: 'Contrat Laser & CIJ Raffinerie Casablanca avec support téléphonique prioritaire.',
    },
  });

  // 12. Tickets SAV & Interventions
  console.log('🚨 12/14 Tickets d\'incident et interventions de maintenance...');
  const techUser = createdUsers['technicien@videojet.ma'];
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000);

  const brokenMachine = createdMachines['VJ1580-MA-2022-0889'];
  const runningMachine = createdMachines['VJ1880-MA-2023-0101'];

  const ticket1 = await prisma.maintenanceTicket.upsert({
    where: { ticketNumber: 'TCK-2024-001' },
    update: {},
    create: {
      ticketNumber: 'TCK-2024-001',
      machineId: brokenMachine.id,
      clientId: createdClients['CLI-DAN-001'].id,
      assignedToId: techUser.id,
      priority: TicketPriority.CRITIQUE_LIGNE_ARRETEE,
      status: TicketStatus.EN_COURS,
      faultDescription: 'Arrêt d\'impression ligne Yaourts Pots 125g : Alerte rouge viscosité encre, déflexion instable.',
      errorCode: 'E104-M (Viscosity Error)',
      reportedBy: 'Kabbaj (Chef d\'équipe conditionnement)',
      slaTargetResponseAt: oneHourLater,
      slaTargetResolutionAt: fourHoursLater,
      firstRespondedAt: new Date(now.getTime() + 25 * 60 * 1000),
    },
  });

  await prisma.intervention.upsert({
    where: { interventionNumber: 'INT-2024-001' },
    update: {},
    create: {
      interventionNumber: 'INT-2024-001',
      ticketId: ticket1.id,
      machineId: brokenMachine.id,
      technicianId: techUser.id,
      clientId: createdClients['CLI-DAN-001'].id,
      type: InterventionType.CURATIVE,
      status: InterventionStatus.EN_COURS,
      scheduledDate: new Date(),
      startedAt: new Date(),
      travelHours: 1.5,
      travelDistanceKm: 75.0,
      travelExpenses: 250.0,
      diagnosis: 'Buse céramique obstruée par encre séchée suite à arrêt d\'usine sans cycle automatique de rinçage.',
      workDone: 'Rinçage sous pression au solvant V706-D, nettoyage par ultrasons du canon de buse, réglage pression pompe.',
    },
  });

  const ticket2 = await prisma.maintenanceTicket.upsert({
    where: { ticketNumber: 'TCK-2024-002' },
    update: {},
    create: {
      ticketNumber: 'TCK-2024-002',
      machineId: runningMachine.id,
      clientId: createdClients['CLI-DAN-001'].id,
      assignedToId: techUser.id,
      priority: TicketPriority.NORMALE,
      status: TicketStatus.RESOLU,
      faultDescription: 'Maintenance préventive des 4000 heures et remplacement périodique du filtre principal d\'encre.',
      reportedBy: 'Direction Usine Salé',
      resolutionNotes: 'Maintenance préventive effectuée avec succès. Filtre remplacé, temps de vol calibré.',
      slaTargetResponseAt: new Date('2024-03-01T13:00:00Z'),
      slaTargetResolutionAt: new Date('2024-03-02T09:00:00Z'),
      firstRespondedAt: new Date('2024-03-01T09:30:00Z'),
      resolvedAt: new Date('2024-03-01T12:30:00Z'),
    },
  });

  const int2 = await prisma.intervention.upsert({
    where: { interventionNumber: 'INT-2024-002' },
    update: {},
    create: {
      interventionNumber: 'INT-2024-002',
      ticketId: ticket2.id,
      machineId: runningMachine.id,
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
      diagnosis: 'Inspection régulière des 4000 heures. Usure normale des éléments filtrants.',
      workDone: 'Remplacement du filtre d\'encre 503212, nettoyage tête d\'impression, étalonnage du temps de vol.',
      customerFeedback: 'Intervention impeccable, redémarrage de la ligne immédiat.',
      customerSignerName: 'Rachid El Mansouri',
      customerSignerTitle: 'Directeur Maintenance Centrale Danone',
    },
  });

  // Pièce utilisée lors de l'intervention
  await prisma.interventionPartUsed.create({
    data: {
      interventionId: int2.id,
      productId: createdProducts['503212'].id,
      quantity: 1,
      unitPrice: 650.0,
    },
  });

  // 13. Pipeline Commercial, Devis, Commandes & Factures
  console.log('💼 13/14 Devis, factures et commandes en cours...');
  const commUser = createdUsers['commercial@videojet.ma'];

  // Opportunité
  await prisma.opportunity.create({
    data: {
      title: 'Renouvellement 3x CIJ 1880 Ligne Yaourts Centrale Danone',
      clientId: createdClients['CLI-DAN-001'].id,
      assignedToId: commUser.id,
      stage: OpportunityStage.NEGOCIATION,
      expectedValue: 345000.0,
      currency: 'MAD',
      probabilityPercent: 80,
      closeDate: new Date('2024-11-30'),
      notes: 'Remplacement d\'anciennes machines concurrentes Domino par des 1880 avec suite prédictive MAXIMiZE.',
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
      probabilityPercent: 65,
      closeDate: new Date('2024-12-15'),
      notes: 'Test sur carton verni réussi avec la cartouche Wolke m610 solvant.',
    },
  });

  // Devis 1 (Accepté et facturé)
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
      notes: 'Contrat de maintenance annuelle Platinum avec engagement SLA 4h garanti.',
      items: {
        create: [
          {
            itemType: 'CONTRAT',
            description: 'Contrat Platinum 2024 - Centrale Danone Usine Salé (6 visites préventives + pièces)',
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

  // Facture 1
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

  // Devis 2 (Offre Laser CO2 Cosumar)
  await prisma.quote.upsert({
    where: { quoteNumber: 'DEV-2024-002-LASER' },
    update: {},
    create: {
      quoteNumber: 'DEV-2024-002-LASER',
      clientId: createdClients['CLI-COS-002'].id,
      createdById: commUser.id,
      taxRateId: tva20.id,
      status: QuoteStatus.ENVOYE,
      currency: 'MAD',
      exchangeRate: 1.0,
      subtotalHt: 179000.0,
      discountPercent: 0.0,
      discountAmount: 0.0,
      totalHt: 179000.0,
      taxAmount: 35800.0,
      totalTtc: 214800.0,
      totalCost: 99800.0,
      estimatedMargin: 79200.0,
      validUntil: new Date('2024-11-30'),
      paymentTerms: '50% à la commande, solde à la mise en service',
      notes: 'Laser CO2 Videojet 3340 avec extracteur de fumées X-Extract pour ligne sucre.',
      items: {
        create: [
          {
            itemType: 'MACHINE',
            machineModelId: createdModels['3340'].id,
            description: 'Système de marquage laser CO2 Videojet 3340 (30 Watt) avec optique SHC60',
            quantity: 1,
            unitPrice: 179000.0,
            costPrice: 99800.0,
            discountPercent: 0.0,
            totalLineHt: 179000.0,
          },
        ],
      },
    },
  });

  // Commande Fournisseur Videojet Technologies
  const po1 = await prisma.purchaseOrder.upsert({
    where: { orderNumber: 'ACH-2024-0001' },
    update: {},
    create: {
      orderNumber: 'ACH-2024-0001',
      supplierId: vSupp.id,
      createdById: createdUsers['superadmin@videojet.ma'].id,
      status: PurchaseOrderStatus.RECUE_COMPLETE,
      currency: 'MAD',
      exchangeRate: 1.0,
      subtotalHt: 42500.0,
      taxAmount: 8500.0,
      totalTtc: 51000.0,
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
            unitPrice: 420.0,
            totalLineHt: 21000.0,
          },
          {
            productId: createdProducts['V706-D'].id,
            quantity: 80,
            receivedQuantity: 80,
            unitPrice: 160.0,
            totalLineHt: 12800.0,
          },
        ],
      },
    },
  });

  // Mouvement de stock lié à la commande fournisseur
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
      stockBefore: 15,
      stockAfter: 65,
      reason: 'Réception commande fournisseur constructeur ACH-2024-0001',
    },
  });

  // 14. Audit Industriel & Étude TCO
  console.log('🔬 14/14 Audit industriel & calculs comparatifs TCO...');
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
        createdById: commUser.id,
        status: AuditStatus.VALIDE,
        lineSpeedMpm: 45.0,
        unitsPerHour: 36000,
        packagingSubstrate: 'Pots Polystyrène (PS) thermoformé + Opercule Aluminium étanche',
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
        currentPainPoints: 'Arrêts fréquents pour nettoyage buse (4 fois par poste), encrassement dû au lavage à haute pression, lisibilité altérée sur pots froids avec condensation.',
        currentConsumableCostPerYear: 52000.0,
        currentDowntimeHoursPerYear: 62.0,
        photos: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'],
        notes: 'Ligne ultra critique pour Centrale Danone. 1 heure d\'arrêt = 36 000 pots retardés. Besoin impératif d\'étanchéité IP66 et encre adhérente sur humidité.',
        recommendations: {
          create: [
            {
              recommendedTech: MachineTechnology.CIJ,
              recommendedModelId: createdModels['1880'].id,
              confidenceScore: 98.0,
              justification: 'La Videojet 1880 MAXIMiZE™ dispose d\'un carter tout inox 316 IP66 lavable au jet, d\'une tête CleanFlow™ anti-encrassement et d\'un capteur prédictif d\'accumulation d\'encre.',
              suggestedConsumable: 'Encre Videojet V411-D MEK adhésion renforcée condensation (séchage < 1s sur PS froid).',
              assumptions: 'Lavage quotidien de la ligne au jet basse pression.',
            },
          ],
        },
      },
    });
  }

  // TCO
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
        existingAnnualDowntimeLosses: 74400.0, // 62h * 1200 MAD coût horaire
        totalExistingAnnualCost: 164400.0,
        equipmentInvestmentPrice: 128000.0,
        installationAndTrainingPrice: 8500.0,
        videojetAnnualConsumableCost: 36000.0,
        videojetAnnualMaintenanceCost: 18000.0,
        totalVideojetFirstYearCost: 190500.0,
        totalVideojetSubsequentAnnualCost: 54000.0,
        estimatedAnnualSavings: 110400.0,
        paybackPeriodMonths: 14.8,
        costPerMarkedProductExisting: 0.00228,
        costPerMarkedProductVideojet: 0.00075,
        disclaimer: 'Estimation basée sur 36 000 pots/h, 2 postes de 8h, 300 jours/an. Réalisée par NEXORA Maroc.',
      },
    });
  }

  console.log('🎉 INJECTION RÉUSSIE : Toutes les données réelles et actives sont enregistrées dans Neon Cloud !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

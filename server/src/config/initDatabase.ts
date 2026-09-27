import prisma from './prisma.js';
import {
  Role,
  MachineTechnology,
  ProductType,
  ProductUnit,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

export const initializeCleanDatabase = async () => {
  try {
    // 1. Check if superadmin already exists
    const superAdmin = await prisma.user.findUnique({
      where: { email: 'superadmin@videojet.ma' },
    });

    if (superAdmin) {
      // Database already initialized
      return;
    }

    console.log('⚡ Base de données neuve détectée : Initialisation propre du système...');

    // 2. Currencies
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
      update: { rateToBase: 10.1 },
      create: {
        code: 'USD',
        symbol: '$',
        name: 'Dollar Américain',
        isBase: false,
        rateToBase: 10.1,
      },
    });

    // 3. Tax Rates
    await prisma.taxRate.upsert({
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

    await prisma.taxRate.upsert({
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

    // 4. Team Users
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

    for (const u of usersData) {
      await prisma.user.upsert({
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
    }

    // 5. Machine Models
    const modelsData = [
      {
        modelNumber: '1580',
        family: MachineTechnology.CIJ,
        name: 'Videojet 1580 Continuous Inkjet',
        description: 'Imprimante jet d\'encre continu conçue pour minimiser les arrêts imprévus avec interface tactile SIMPLICiTY™.',
        maxSpeed: '278 m/min',
        resolution: '60 dpi',
        ipRating: 'IP55 / IP65',
      },
      {
        modelNumber: '1880',
        family: MachineTechnology.CIJ,
        name: 'Videojet 1880 IoT CIJ Printer',
        description: 'Imprimante connectée de pointe avec suite prédictive MAXIMiZE™ et capteur d\'accumulation d\'encre.',
        maxSpeed: '334 m/min',
        resolution: '70 dpi',
        ipRating: 'IP66 inox 316',
      },
      {
        modelNumber: '3340',
        family: MachineTechnology.LASER_CO2,
        name: 'Videojet 3340 CO2 Laser Marking System',
        description: 'Système de marquage laser CO2 de 30 Watts, idéal pour l\'emballage grande cadence pharmaceutique et agroalimentaire.',
        maxSpeed: '900 m/min',
        resolution: 'Marquage vectoriel ultra précis',
        ipRating: 'IP54 / IP65',
      },
      {
        modelNumber: '3640',
        family: MachineTechnology.LASER_CO2,
        name: 'Videojet 3640 CO2 Laser Marking System',
        description: 'Système laser 60 Watts ultra haute vitesse pour cadences extrêmes.',
        maxSpeed: '1200 m/min',
        resolution: 'Optique haute résolution',
        ipRating: 'IP65',
      },
      {
        modelNumber: '6530',
        family: MachineTechnology.TTO,
        name: 'Videojet DataFlex 6530 TTO',
        description: 'Surimprimeur à transfert thermique sans air comprimé avec technologie iAssure™ intégrée.',
        maxSpeed: '1000 mm/s',
        resolution: '300 dpi',
        ipRating: 'IP66 cassette étanche',
      },
      {
        modelNumber: 'Wolke-m610',
        family: MachineTechnology.TIJ,
        name: 'Wolke m610 touch Thermal Inkjet',
        description: 'Technologie jet d\'encre thermique à cartouches HP pour sérialisation pharmaceutique.',
        maxSpeed: '60 m/min à 600 dpi',
        resolution: '600 x 600 dpi',
        ipRating: 'IP20 boîtier inox',
      },
    ];

    for (const m of modelsData) {
      await prisma.machineModel.upsert({
        where: { modelNumber: m.modelNumber },
        update: {},
        create: m,
      });
    }

    // 6. Products Catalog
    const productsData = [
      {
        partNumber: 'V411-D',
        name: 'Encre Noire Standard MEK CIJ (750ml)',
        type: ProductType.ENCRE,
        technology: MachineTechnology.CIJ,
        description: 'Encre noire à séchage rapide à base de MEK pour surfaces plastiques, verre et métal.',
        unitPrice: 850.0,
        costPrice: 420.0,
        stockQuantity: 50,
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
        stockQuantity: 40,
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
        stockQuantity: 30,
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
        stockQuantity: 35,
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
        stockQuantity: 5,
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
        stockQuantity: 4,
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
        stockQuantity: 25,
        minStockThreshold: 10,
        unit: ProductUnit.PIECE,
      },
    ];

    for (const p of productsData) {
      await prisma.product.upsert({
        where: { partNumber: p.partNumber },
        update: {},
        create: p,
      });
    }

    // 7. Company Settings
    await prisma.companySettings.upsert({
      where: { id: 'default' },
      update: {},
      create: {
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

    console.log('✅ Base de données initialisée avec succès (prête pour la production sans données fictives).');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
  }
};

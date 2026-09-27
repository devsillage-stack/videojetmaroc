import ExcelJS from 'exceljs';

export const styleHeaderRow = (row: ExcelJS.Row) => {
  row.height = 28;
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF002B49' }, // Videojet Blue
    };
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'medium', color: { argb: 'FFFF5C00' } }, // Videojet Orange bottom border
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };
  });
};

export const styleDataRow = (row: ExcelJS.Row, index: number) => {
  row.height = 20;
  const isEven = index % 2 === 0;
  row.eachCell((cell) => {
    if (isEven) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' },
      };
    }
    cell.font = { name: 'Calibri', size: 10 };
    cell.alignment = { vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };
  });
};

/**
 * Generate Excel workbook for Machines Installed Fleet
 */
export const generateMachinesExcel = async (machines: any[]): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'VIDEOJET MAROC INDUSTRIAL PLATFORM';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Parc Machines Videojet');

  worksheet.columns = [
    { header: 'N° de Série', key: 'serialNumber', width: 25 },
    { header: 'Modèle Videojet', key: 'modelName', width: 28 },
    { header: 'Technologie', key: 'technology', width: 16 },
    { header: 'Client Industriel', key: 'clientName', width: 30 },
    { header: 'Ville / Site', key: 'siteCity', width: 22 },
    { header: 'Statut Machine', key: 'status', width: 18 },
    { header: 'Garantie', key: 'warranty', width: 18 },
    { header: 'Heures Fonctionnement', key: 'hours', width: 22 },
    { header: 'Total Impressions', key: 'prints', width: 22 },
    { header: 'Date Installation', key: 'installDate', width: 18 },
  ];

  styleHeaderRow(worksheet.getRow(1));

  machines.forEach((m, index) => {
    const isWarrantyActive = m.warrantyEndDate ? new Date(m.warrantyEndDate) > new Date() : false;
    const row = worksheet.addRow({
      serialNumber: m.serialNumber,
      modelName: m.model?.name || m.modelId,
      technology: m.model?.family || 'CIJ',
      clientName: m.client?.name || '—',
      siteCity: m.site?.name ? `${m.site.name} (${m.client?.city || ''})` : m.client?.city || '—',
      status: m.status,
      warranty: isWarrantyActive ? 'Active' : 'Expirée',
      hours: m.totalOperatingHours || 0,
      prints: Number(m.totalPrintsCount || 0),
      installDate: new Date(m.installDate).toLocaleDateString('fr-FR'),
    });
    styleDataRow(row, index);
  });

  return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
};

/**
 * Generate Excel workbook for Products & Inventory
 */
export const generateInventoryExcel = async (products: any[], isPrivileged: boolean = false): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'VIDEOJET MAROC INDUSTRIAL PLATFORM';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Catalogue Consommables & Pièces');

  const columns: any[] = [
    { header: 'Référence Article', key: 'partNumber', width: 20 },
    { header: 'Désignation Technique', key: 'name', width: 38 },
    { header: 'Type de Produit', key: 'type', width: 20 },
    { header: 'Technologie', key: 'technology', width: 16 },
    { header: 'Prix Catalogue HT (MAD)', key: 'unitPrice', width: 22 },
  ];

  if (isPrivileged) {
    columns.push({ header: 'Coût Achat HT (MAD)', key: 'costPrice', width: 20 });
    columns.push({ header: 'Marge Est. (%)', key: 'margin', width: 16 });
  }

  columns.push(
    { header: 'Stock Magasin', key: 'stockQuantity', width: 16 },
    { header: 'Seuil Min. Sécurité', key: 'minThreshold', width: 18 },
    { header: 'Unité', key: 'unit', width: 14 },
    { header: 'Alerte Rupture', key: 'alert', width: 16 }
  );

  worksheet.columns = columns;
  styleHeaderRow(worksheet.getRow(1));

  products.forEach((p, index) => {
    const isLow = p.stockQuantity <= p.minStockThreshold;
    const rowData: any = {
      partNumber: p.partNumber,
      name: p.name,
      type: p.type,
      technology: p.technology,
      unitPrice: p.unitPrice,
      stockQuantity: p.stockQuantity,
      minThreshold: p.minStockThreshold,
      unit: p.unit,
      alert: isLow ? 'STOCK CRITIQUE' : 'Normal',
    };

    if (isPrivileged && p.costPrice !== undefined) {
      rowData.costPrice = p.costPrice;
      const margin = p.unitPrice > 0 ? (((p.unitPrice - p.costPrice) / p.unitPrice) * 100).toFixed(1) + '%' : '—';
      rowData.margin = margin;
    }

    const row = worksheet.addRow(rowData);
    styleDataRow(row, index);

    if (isLow) {
      row.getCell('alert').font = { bold: true, color: { argb: 'FFDC2626' } };
    }
  });

  return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
};

/**
 * Generate Excel workbook for Stock Movements Traceability
 */
export const generateStockMovementsExcel = async (movements: any[]): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'VIDEOJET MAROC INDUSTRIAL PLATFORM';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Mouvements de Stock');

  worksheet.columns = [
    { header: 'N° Mouvement', key: 'movementNumber', width: 20 },
    { header: 'Date & Heure', key: 'createdAt', width: 22 },
    { header: 'Type de Flux', key: 'type', width: 22 },
    { header: 'Référence Article', key: 'partNumber', width: 18 },
    { header: 'Désignation', key: 'productName', width: 34 },
    { header: 'Variation', key: 'quantity', width: 14 },
    { header: 'Stock Avant', key: 'stockBefore', width: 14 },
    { header: 'Stock Après', key: 'stockAfter', width: 14 },
    { header: 'Opérateur', key: 'operator', width: 22 },
    { header: 'Justificatif / Motif', key: 'reason', width: 35 },
  ];

  styleHeaderRow(worksheet.getRow(1));

  movements.forEach((m, index) => {
    const row = worksheet.addRow({
      movementNumber: m.movementNumber,
      createdAt: new Date(m.createdAt).toLocaleString('fr-FR'),
      type: m.type,
      partNumber: m.product?.partNumber || '—',
      productName: m.product?.name || '—',
      quantity: m.quantity > 0 ? `+${m.quantity}` : m.quantity,
      stockBefore: m.stockBefore,
      stockAfter: m.stockAfter,
      operator: m.user ? `${m.user.firstName} ${m.user.lastName}` : 'Système',
      reason: m.reason || '—',
    });
    styleDataRow(row, index);
  });

  return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
};

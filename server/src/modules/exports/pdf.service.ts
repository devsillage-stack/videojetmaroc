import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import prisma from '../../config/prisma.js';

export interface DocCompanySettings {
  companyName: string;
  tagline: string;
  formJuridique: string;
  capitalSocial: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  ice: string;
  ifTax: string;
  rc: string;
  patente: string;
  cnss: string;
  bankName: string;
  bankAgency: string;
  rib: string;
  swift: string;
  logoUrl?: string | null;
  logoWidth: number;
  primaryColor: string;
  accentColor: string;
  headerStyle: string;
  termsTemplate?: string | null;
}

const DEFAULT_SETTINGS: DocCompanySettings = {
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
  termsTemplate: 'Conditions : Règlement à 30 jours fin de mois. Matériel d\'origine garanti 12 mois pièces et main-d\'œuvre.',
};

/**
 * Loads company settings from database with fallback
 */
export const loadCompanySettings = async (): Promise<DocCompanySettings> => {
  try {
    const s = await prisma.companySettings.findUnique({
      where: { id: 'default' },
    });
    if (!s) return DEFAULT_SETTINGS;
    return {
      companyName: s.companyName || DEFAULT_SETTINGS.companyName,
      tagline: s.tagline || DEFAULT_SETTINGS.tagline,
      formJuridique: s.formJuridique || DEFAULT_SETTINGS.formJuridique,
      capitalSocial: s.capitalSocial || DEFAULT_SETTINGS.capitalSocial,
      address: s.address || DEFAULT_SETTINGS.address,
      city: s.city || DEFAULT_SETTINGS.city,
      postalCode: s.postalCode || DEFAULT_SETTINGS.postalCode,
      country: s.country || DEFAULT_SETTINGS.country,
      phone: s.phone || DEFAULT_SETTINGS.phone,
      email: s.email || DEFAULT_SETTINGS.email,
      website: s.website || DEFAULT_SETTINGS.website,
      ice: s.ice || DEFAULT_SETTINGS.ice,
      ifTax: s.ifTax || DEFAULT_SETTINGS.ifTax,
      rc: s.rc || DEFAULT_SETTINGS.rc,
      patente: s.patente || DEFAULT_SETTINGS.patente,
      cnss: s.cnss || DEFAULT_SETTINGS.cnss,
      bankName: s.bankName || DEFAULT_SETTINGS.bankName,
      bankAgency: s.bankAgency || DEFAULT_SETTINGS.bankAgency,
      rib: s.rib || DEFAULT_SETTINGS.rib,
      swift: s.swift || DEFAULT_SETTINGS.swift,
      logoUrl: s.logoUrl,
      logoWidth: Number(s.logoWidth) || 140,
      primaryColor: s.primaryColor || DEFAULT_SETTINGS.primaryColor,
      accentColor: s.accentColor || DEFAULT_SETTINGS.accentColor,
      headerStyle: s.headerStyle || DEFAULT_SETTINGS.headerStyle,
      termsTemplate: s.termsTemplate || DEFAULT_SETTINGS.termsTemplate,
    };
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
};

// Colors palette fallback
export const COLORS = {
  primary: '#002b49', // Videojet Blue
  secondary: '#0083cb', // Cyan
  accent: '#ff5c00', // Videojet Orange
  darkText: '#1e293b',
  lightText: '#64748b',
  border: '#cbd5e1',
  lightBorder: '#e2e8f0',
  success: '#059669',
  danger: '#e11d48',
  lightBg: '#f8fafc',
  white: '#ffffff',
};

/**
 * Draw Unified Header across all corporate documents
 */
export const drawUnifiedHeader = (
  doc: PDFKit.PDFDocument,
  settings: DocCompanySettings,
  docTypeTitle: string,
  docNumber: string,
  docDate: string,
  statusLabel?: string
) => {
  const primary = settings.primaryColor || COLORS.primary;
  const accent = settings.accentColor || COLORS.accent;

  // Top color accent bar
  doc.rect(0, 0, doc.page.width, 7).fill(accent);

  let brandY = 22;

  // Try rendering custom uploaded logo if present
  let hasImageLogo = false;
  if (settings.logoUrl && settings.logoUrl.startsWith('data:image')) {
    try {
      const base64Data = settings.logoUrl.replace(/^data:image\/\w+;base64,/, '');
      const imgBuffer = Buffer.from(base64Data, 'base64');
      const w = Math.min(220, Math.max(70, settings.logoWidth || 140));
      doc.image(imgBuffer, 40, brandY, { width: w });
      hasImageLogo = true;
      brandY += 46;
    } catch (e) {
      hasImageLogo = false;
    }
  }

  if (!hasImageLogo) {
    // Vector Brand Typography
    doc
      .fontSize(21)
      .font('Helvetica-Bold')
      .fillColor(primary)
      .text(settings.companyName.split(' ')[0] || 'VIDEOJET', 40, brandY, { continued: true });

    const remainingName = settings.companyName.split(' ').slice(1).join(' ');
    if (remainingName) {
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor(accent)
        .text(`  ${remainingName}`);
    } else {
      doc.text('');
    }

    doc
      .fontSize(7.5)
      .font('Helvetica')
      .fillColor(COLORS.lightText)
      .text(settings.tagline, 40, brandY + 24, { width: 300 });

    brandY += 38;
  } else {
    // Small tagline under image
    doc
      .fontSize(7)
      .font('Helvetica')
      .fillColor(COLORS.lightText)
      .text(settings.tagline, 40, brandY, { width: 300 });
    brandY += 14;
  }

  // Right-aligned Document Title & Metadata Box
  doc
    .fontSize(17)
    .font('Helvetica-Bold')
    .fillColor(primary)
    .text(docTypeTitle.toUpperCase(), 320, 20, { align: 'right', width: 235 });

  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor(COLORS.darkText)
    .text(`N° ${docNumber}`, 320, 42, { align: 'right', width: 235 });

  doc
    .fontSize(8.5)
    .font('Helvetica')
    .fillColor(COLORS.lightText)
    .text(`Date : ${docDate}`, 320, 56, { align: 'right', width: 235 });

  if (statusLabel) {
    // Small status badge in upper right
    const badgeW = 90;
    const badgeX = 555 - badgeW;
    doc.roundedRect(badgeX, 72, badgeW, 16, 3).fillAndStroke('#eff6ff', primary);
    doc
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .fillColor(primary)
      .text(statusLabel.toUpperCase(), badgeX, 76, { align: 'center', width: badgeW });
  }

  // Thin separator rule
  const sepY = Math.max(brandY + 4, 94);
  doc
    .strokeColor(COLORS.border)
    .lineWidth(0.8)
    .moveTo(40, sepY)
    .lineTo(555, sepY)
    .stroke();

  return sepY + 12;
};

/**
 * Draw Two-Column Entity Box: Client details (Left) vs. Transaction details (Right)
 */
export const drawTwoColumnEntityBox = (
  doc: PDFKit.PDFDocument,
  settings: DocCompanySettings,
  startY: number,
  clientData: {
    title?: string;
    name: string;
    city: string;
    address?: string;
    ice?: string;
    contactName?: string;
    phone?: string;
  },
  metaData: {
    title?: string;
    lines: { label: string; value: string; isBold?: boolean }[];
  }
): number => {
  const primary = settings.primaryColor || COLORS.primary;
  const boxW = 250;
  const leftX = 40;
  const rightX = 305;

  // Measure client name height accurately
  doc.fontSize(9.5).font('Helvetica-Bold');
  const nameH = doc.heightOfString(clientData.name, { width: boxW - 24 });

  let neededLeftH = 22 + nameH + 4;
  if (clientData.ice) neededLeftH += 13;
  neededLeftH += 13; // ville
  if (clientData.address) neededLeftH += 13;
  if (clientData.contactName || clientData.phone) neededLeftH += 13;
  neededLeftH += 8;

  const neededRightH = 22 + metaData.lines.length * 14 + 10;
  const boxH = Math.max(90, neededLeftH, neededRightH);

  // Left Box: Client
  doc.roundedRect(leftX, startY, boxW, boxH, 4).fillAndStroke(COLORS.lightBg, COLORS.border);
  doc
    .fontSize(8.5)
    .font('Helvetica-Bold')
    .fillColor(primary)
    .text((clientData.title || 'CLIENT DESTINATAIRE').toUpperCase(), leftX + 12, startY + 8);

  doc
    .fontSize(9.5)
    .font('Helvetica-Bold')
    .fillColor(COLORS.darkText)
    .text(clientData.name, leftX + 12, startY + 22, { width: boxW - 24 });

  let cy = startY + 22 + nameH + 4;
  doc.fontSize(8).font('Helvetica').fillColor(COLORS.lightText);
  if (clientData.ice) {
    doc.font('Helvetica-Bold').fillColor(COLORS.darkText).text(`ICE Client : ${clientData.ice}`, leftX + 12, cy);
    cy += 13;
  }
  doc.font('Helvetica').fillColor(COLORS.lightText);
  doc.text(`Ville : ${clientData.city || 'Maroc'}`, leftX + 12, cy);
  cy += 13;
  if (clientData.address) {
    doc.text(`Adresse : ${clientData.address}`, leftX + 12, cy, { width: boxW - 24, ellipsis: true });
    cy += 13;
  }
  if (clientData.contactName || clientData.phone) {
    doc.text(`Contact : ${clientData.contactName || ''} ${clientData.phone ? `(${clientData.phone})` : ''}`, leftX + 12, cy, { width: boxW - 24, ellipsis: true });
  }

  // Right Box: Meta Conditions
  doc.roundedRect(rightX, startY, boxW, boxH, 4).fillAndStroke(COLORS.lightBg, COLORS.border);
  doc
    .fontSize(8.5)
    .font('Helvetica-Bold')
    .fillColor(primary)
    .text((metaData.title || 'MODALITÉS & CONDITIONS').toUpperCase(), rightX + 12, startY + 8);

  let my = startY + 22;
  metaData.lines.forEach((l) => {
    doc.fontSize(8).font('Helvetica').fillColor(COLORS.lightText).text(`${l.label} :`, rightX + 12, my);
    doc
      .font(l.isBold ? 'Helvetica-Bold' : 'Helvetica')
      .fillColor(COLORS.darkText)
      .text(l.value, rightX + 110, my, { width: boxW - 122, align: 'right' });
    my += 14;
  });

  return startY + boxH;
};


/**
 * Draw Unified Fixed Footer at bottom of the page
 * Automatically prevents page overflow by zeroing bottom margin
 */
export const drawUnifiedFooter = (
  doc: PDFKit.PDFDocument,
  settings: DocCompanySettings,
  currentPage: number,
  totalPages: number
) => {
  const bottom = doc.page.height - 38;

  // Thin top border
  doc
    .strokeColor(COLORS.border)
    .lineWidth(0.5)
    .moveTo(40, bottom)
    .lineTo(555, bottom)
    .stroke();

  // Line 1: Corporate Legal Form & HQ
  const line1 = `${settings.companyName} — ${settings.formJuridique || 'SARL'} au capital de ${settings.capitalSocial || '1 000 000 DH'} — Siège Social : ${settings.address}, ${settings.postalCode || ''} ${settings.city} — ${settings.country}`;
  doc
    .fontSize(6.8)
    .font('Helvetica-Bold')
    .fillColor(COLORS.darkText)
    .text(line1, 40, bottom + 5, {
      align: 'center',
      width: 515,
      lineBreak: false,
    });

  // Line 2: Legal Moroccan Identifiers & Contacts
  const line2 = `ICE: ${settings.ice} | IF: ${settings.ifTax} | RC: ${settings.rc} | Patente: ${settings.patente} | CNSS: ${settings.cnss} | Tél: ${settings.phone} | ${settings.website}`;
  doc
    .fontSize(6.3)
    .font('Helvetica')
    .fillColor(COLORS.lightText)
    .text(line2, 40, bottom + 15, {
      align: 'center',
      width: 515,
      lineBreak: false,
    });

  // Page numbering in corner
  doc
    .fontSize(6.5)
    .font('Helvetica')
    .fillColor(COLORS.lightText)
    .text(`Page ${currentPage} / ${totalPages}`, 480, bottom + 24, {
      align: 'right',
      width: 75,
      lineBreak: false,
    });
};

/**
 * Attach footers to all buffered pages safely without triggering new pages
 */
const finalizeBufferedPagesWithFooters = (doc: PDFKit.PDFDocument, settings: DocCompanySettings) => {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    // Explicitly zero out bottom margin on this page so PDFKit doesn't auto-paginate
    doc.page.margins.bottom = 0;
    drawUnifiedFooter(doc, settings, i + 1, range.count);
  }
};

/**
 * Generate PDF for Official Invoice (Facture avec mentions légales marocaines)
 * Guaranteed 1-page fit for standard invoices, with proper spacing
 */
export const generateInvoicePdf = async (invoice: any): Promise<Buffer> => {
  const settings = await loadCompanySettings();

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margins: { top: 35, bottom: 35, left: 40, right: 40 },
        size: 'A4',
        autoFirstPage: true,
        bufferPages: true,
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const primary = settings.primaryColor || COLORS.primary;

      // 1. Header
      let y = drawUnifiedHeader(
        doc,
        settings,
        'FACTURE OFFICIELLE',
        invoice.invoiceNumber,
        new Date(invoice.createdAt || invoice.issueDate).toLocaleDateString('fr-FR'),
        invoice.status === 'PAYEE' ? 'Payée' : invoice.status
      );

      // 2. Client & Transaction Details
      y = drawTwoColumnEntityBox(
        doc,
        settings,
        y + 6,
        {
          name: invoice.client?.name || 'Client Industriel',
          city: invoice.client?.city || 'Casablanca',
          address: invoice.client?.address,
          ice: invoice.client?.ice,
          phone: invoice.client?.phone,
        },
        {
          title: 'RÈGLEMENT & ÉCHÉANCE',
          lines: [
            { label: 'Date d\'échéance', value: new Date(invoice.dueDate).toLocaleDateString('fr-FR'), isBold: true },
            { label: 'Mode règlement', value: invoice.paymentMethod || 'Virement / Chèque' },
            { label: 'Devise', value: invoice.currency || 'MAD' },
            { label: 'Statut', value: invoice.status === 'PAYEE' ? 'Soldée' : invoice.status },
          ],
        }
      );

      y += 18;

      // 3. Table Header
      const tableX = 40;
      const tableW = 515;
      const thH = 20;

      doc.rect(tableX, y, tableW, thH).fill(primary);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.white);
      doc.text('Désignation des Prestations & Équipements', tableX + 12, y + 6);
      doc.text('Qté', tableX + 330, y + 6, { width: 35, align: 'center' });
      doc.text('P.U. HT', tableX + 375, y + 6, { width: 55, align: 'right' });
      doc.text('Total Ligne HT', tableX + 440, y + 6, { width: 65, align: 'right' });
      y += thH;

      // 4. Items rows
      const items = invoice.quote?.items && invoice.quote.items.length > 0
        ? invoice.quote.items
        : [
            {
              description: "Fourniture d'équipements industriels de codage & prestations associées",
              quantity: 1,
              unitPrice: Number(invoice.subtotalHt),
              totalLineHt: Number(invoice.subtotalHt),
            },
          ];

      items.forEach((item: any, idx: number) => {
        const rowH = 26;
        const bg = idx % 2 === 0 ? COLORS.lightBg : COLORS.white;
        doc.rect(tableX, y, tableW, rowH).fill(bg);

        doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.darkText);
        doc.text(item.description, tableX + 12, y + 8, { width: 310, lineBreak: false, ellipsis: true });

        doc.font('Helvetica').fillColor(COLORS.darkText);
        doc.text(String(item.quantity || 1), tableX + 330, y + 8, { width: 35, align: 'center' });
        doc.text(`${Number(item.unitPrice || invoice.subtotalHt).toFixed(2)}`, tableX + 375, y + 8, { width: 55, align: 'right' });
        doc.font('Helvetica-Bold');
        doc.text(`${Number(item.totalLineHt || invoice.subtotalHt).toFixed(2)} ${invoice.currency}`, tableX + 440, y + 8, { width: 65, align: 'right' });

        y += rowH;
      });

      // Bottom border for table
      doc.strokeColor(COLORS.border).lineWidth(0.5).moveTo(tableX, y).lineTo(tableX + tableW, y).stroke();

      // =========================================================================
      // 5. Pin Bank Wire Information (Left) & Totals Card (Right) near the footer
      // =========================================================================
      const leftW = 270;
      const rightW = 230;
      const sumH = 100;
      const sumRightX = tableX + tableW - rightW;

      // Pin near bottom of page (safely above footer at 804pt)
      const bottomPinnedY = 665;
      y = Math.max(y + 20, bottomPinnedY);

      // Left Box: Bank Transfer Coordinates & Notes
      doc.roundedRect(tableX, y, leftW, sumH, 4).fillAndStroke(COLORS.lightBg, COLORS.border);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(primary).text('COORDONNÉES BANCAIRES POUR VIREMENT', tableX + 10, y + 8);

      doc.fontSize(7.5).font('Helvetica').fillColor(COLORS.darkText);
      doc.text(`Banque : ${settings.bankName}`, tableX + 10, y + 22, { width: leftW - 20, lineBreak: false });
      doc.text(`Agence : ${settings.bankAgency}`, tableX + 10, y + 34, { width: leftW - 20, lineBreak: false });
      doc.font('Helvetica-Bold').text(`RIB (24 chiffres) : ${settings.rib}`, tableX + 10, y + 46, { width: leftW - 20, lineBreak: false });
      doc.font('Helvetica').text(`Code SWIFT / BIC : ${settings.swift}`, tableX + 10, y + 58, { width: leftW - 20, lineBreak: false });

      doc.fontSize(6.8).font('Helvetica-Oblique').fillColor(COLORS.lightText);
      doc.text(settings.termsTemplate || 'Règlement par virement bancaire ou chèque barré à l\'ordre de VIDEOJET MAROC SARL.', tableX + 10, y + 72, { width: leftW - 20, height: 22, ellipsis: true });

      // Right Box: Totals Summary
      doc.roundedRect(sumRightX, y, rightW, sumH, 4).fillAndStroke(COLORS.white, COLORS.border);
      doc.rect(sumRightX, y, rightW, 5).fill(primary);

      let ty = y + 10;
      doc.fontSize(8).font('Helvetica').fillColor(COLORS.lightText).text('Total Brut HT :', sumRightX + 12, ty);
      doc.font('Helvetica-Bold').fillColor(COLORS.darkText).text(`${Number(invoice.subtotalHt).toFixed(2)} ${invoice.currency}`, sumRightX + 90, ty, { align: 'right', width: rightW - 102, lineBreak: false });

      ty += 16;
      doc.font('Helvetica').fillColor(COLORS.lightText).text('TVA (20%) :', sumRightX + 12, ty);
      doc.font('Helvetica-Bold').fillColor(COLORS.darkText).text(`${Number(invoice.taxAmount).toFixed(2)} ${invoice.currency}`, sumRightX + 90, ty, { align: 'right', width: rightW - 102, lineBreak: false });

      ty += 16;
      doc.strokeColor(COLORS.lightBorder).lineWidth(0.5).moveTo(sumRightX + 10, ty).lineTo(sumRightX + rightW - 10, ty).stroke();
      ty += 5;

      doc.fontSize(10.5).font('Helvetica-Bold').fillColor(primary).text('TOTAL TTC :', sumRightX + 12, ty);
      doc.fontSize(10.5).font('Helvetica-Bold').fillColor(primary).text(`${Number(invoice.totalTtc).toFixed(2)} ${invoice.currency}`, sumRightX + 75, ty, { align: 'right', width: rightW - 87, lineBreak: false });

      ty += 20;
      doc.fontSize(7.5).font('Helvetica').fillColor(COLORS.success).text('Montant Encaissé :', sumRightX + 12, ty);
      doc.font('Helvetica-Bold').text(`${Number(invoice.paidAmount || 0).toFixed(2)} ${invoice.currency}`, sumRightX + 90, ty, { align: 'right', width: rightW - 102, lineBreak: false });

      // 7. Attach single-page footers safely
      finalizeBufferedPagesWithFooters(doc, settings);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate PDF for Official Quotation (Devis Videojet)
 * Unified Layout Model matching Invoice template
 */
export const generateQuotePdf = async (quote: any): Promise<Buffer> => {
  const settings = await loadCompanySettings();

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margins: { top: 35, bottom: 35, left: 40, right: 40 },
        size: 'A4',
        autoFirstPage: true,
        bufferPages: true,
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const primary = settings.primaryColor || COLORS.primary;

      // 1. Header
      let y = drawUnifiedHeader(
        doc,
        settings,
        'OFFRE COMMERCIALE / DEVIS',
        quote.quoteNumber,
        new Date(quote.createdAt).toLocaleDateString('fr-FR'),
        quote.status === 'ACCEPTE' ? 'Accepté' : quote.status
      );

      // 2. Client & Validity
      y = drawTwoColumnEntityBox(
        doc,
        settings,
        y + 6,
        {
          name: quote.client?.name || 'Client Industriel',
          city: quote.client?.city || 'Casablanca',
          address: quote.client?.address,
          ice: quote.client?.ice,
          contactName: quote.client?.contacts?.[0]?.firstName ? `${quote.client.contacts[0].firstName} ${quote.client.contacts[0].lastName}` : undefined,
          phone: quote.client?.phone,
        },
        {
          title: 'VALIDITÉ & CONDITIONS',
          lines: [
            { label: 'Offre valable jusqu\'au', value: new Date(quote.validUntil).toLocaleDateString('fr-FR'), isBold: true },
            { label: 'Devise', value: quote.currency || 'MAD' },
            { label: 'Conditions règlement', value: quote.paymentTerms || '30 jours fin de mois' },
            { label: 'Statut offre', value: quote.status },
          ],
        }
      );

      y += 18;

      // 3. Table Header
      const tableX = 40;
      const tableW = 515;
      const thH = 20;

      doc.rect(tableX, y, tableW, thH).fill(primary);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.white);
      doc.text('Type', tableX + 10, y + 6, { width: 55 });
      doc.text('Désignation & Caractéristiques Techniques', tableX + 70, y + 6, { width: 250 });
      doc.text('Qté', tableX + 325, y + 6, { width: 35, align: 'center' });
      doc.text('P.U. HT', tableX + 370, y + 6, { width: 60, align: 'right' });
      doc.text('Total HT', tableX + 440, y + 6, { width: 65, align: 'right' });
      y += thH;

      // 4. Items Rows
      if (quote.items && quote.items.length > 0) {
        quote.items.forEach((item: any, idx: number) => {
          const rowH = 24;
          const bg = idx % 2 === 0 ? COLORS.lightBg : COLORS.white;
          doc.rect(tableX, y, tableW, rowH).fill(bg);

          doc.fontSize(7.5).font('Helvetica-Bold').fillColor(COLORS.secondary);
          doc.text(item.itemType || 'PRODUIT', tableX + 10, y + 7, { width: 55, lineBreak: false });

          doc.font('Helvetica').fillColor(COLORS.darkText);
          doc.text(item.description, tableX + 70, y + 7, { width: 250, lineBreak: false, ellipsis: true });

          doc.font('Helvetica-Bold').text(String(item.quantity), tableX + 325, y + 7, { width: 35, align: 'center' });
          doc.font('Helvetica').text(`${Number(item.unitPrice).toFixed(2)}`, tableX + 370, y + 7, { width: 60, align: 'right' });
          doc.font('Helvetica-Bold').text(`${Number(item.totalLineHt).toFixed(2)} ${quote.currency}`, tableX + 440, y + 7, { width: 65, align: 'right' });

          y += rowH;
        });
      }

      // Bottom border for table
      doc.strokeColor(COLORS.border).lineWidth(0.5).moveTo(tableX, y).lineTo(tableX + tableW, y).stroke();

      // =========================================================================
      // 5. Pin Commercial Warranties (Left) & Totals Card (Right) near the footer
      // =========================================================================
      const leftW = 270;
      const rightW = 230;
      const sumH = 100;
      const sumRightX = tableX + tableW - rightW;

      // Pin near bottom of page (safely above footer at 804pt)
      const bottomPinnedY = 665;
      y = Math.max(y + 20, bottomPinnedY);

      // Left Box: Warranties & Delivery
      doc.roundedRect(tableX, y, leftW, sumH, 4).fillAndStroke(COLORS.lightBg, COLORS.border);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(primary).text('ENGAGEMENTS & GARANTIE CONSTRUCTEUR', tableX + 10, y + 8);
      doc.fontSize(7.2).font('Helvetica').fillColor(COLORS.darkText);
      doc.text('• Matériel neuf Videojet Technologies certifié d\'origine.', tableX + 10, y + 22, { width: leftW - 20, lineBreak: false });
      doc.text('• Garantie 12 mois pièces, main-d\'œuvre et déplacement.', tableX + 10, y + 34, { width: leftW - 20, lineBreak: false });
      doc.text('• Installation, mise en service et formation opérateurs incluses.', tableX + 10, y + 46, { width: leftW - 20, lineBreak: false });
      doc.text('• Disponibilité garantie consommables & pièces sous 24h au Maroc.', tableX + 10, y + 58, { width: leftW - 20, lineBreak: false });
      doc.fontSize(6.8).font('Helvetica-Oblique').fillColor(COLORS.lightText);
      doc.text('Bon pour accord et commande — Date et signature client :', tableX + 10, y + 72, { width: leftW - 20, lineBreak: false });

      // Right Box: Totals Summary
      doc.roundedRect(sumRightX, y, rightW, sumH, 4).fillAndStroke(COLORS.white, COLORS.border);
      doc.rect(sumRightX, y, rightW, 5).fill(primary);

      let ty = y + 10;
      doc.fontSize(8).font('Helvetica').fillColor(COLORS.lightText).text('Total Brut HT :', sumRightX + 12, ty);
      doc.font('Helvetica-Bold').fillColor(COLORS.darkText).text(`${Number(quote.subtotalHt).toFixed(2)} ${quote.currency}`, sumRightX + 90, ty, { align: 'right', width: rightW - 102, lineBreak: false });

      if (quote.discountAmount && quote.discountAmount > 0) {
        ty += 15;
        doc.font('Helvetica').fillColor(COLORS.danger).text(`Remise (${quote.discountPercent}%) :`, sumRightX + 12, ty);
        doc.font('Helvetica-Bold').text(`-${Number(quote.discountAmount).toFixed(2)} ${quote.currency}`, sumRightX + 90, ty, { align: 'right', width: rightW - 102, lineBreak: false });
      }

      ty += 15;
      doc.font('Helvetica').fillColor(COLORS.lightText).text('TVA (20%) :', sumRightX + 12, ty);
      doc.font('Helvetica-Bold').fillColor(COLORS.darkText).text(`${Number(quote.taxAmount).toFixed(2)} ${quote.currency}`, sumRightX + 90, ty, { align: 'right', width: rightW - 102, lineBreak: false });

      ty += 15;
      doc.strokeColor(COLORS.lightBorder).lineWidth(0.5).moveTo(sumRightX + 10, ty).lineTo(sumRightX + rightW - 10, ty).stroke();
      ty += 5;

      doc.fontSize(10.5).font('Helvetica-Bold').fillColor(primary).text('TOTAL TTC :', sumRightX + 12, ty);
      doc.fontSize(10.5).font('Helvetica-Bold').fillColor(primary).text(`${Number(quote.totalTtc).toFixed(2)} ${quote.currency}`, sumRightX + 75, ty, { align: 'right', width: rightW - 87, lineBreak: false });

      // 7. Attach footers
      finalizeBufferedPagesWithFooters(doc, settings);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate PDF for Maintenance Intervention Sheet with Client Signature
 */
export const generateInterventionPdf = async (intervention: any): Promise<Buffer> => {
  const settings = await loadCompanySettings();

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margins: { top: 35, bottom: 35, left: 40, right: 40 },
        size: 'A4',
        autoFirstPage: true,
        bufferPages: true,
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const primary = settings.primaryColor || COLORS.primary;

      let y = drawUnifiedHeader(
        doc,
        settings,
        'RAPPORT D\'INTERVENTION SAV',
        intervention.interventionNumber,
        new Date(intervention.scheduledDate).toLocaleDateString('fr-FR'),
        intervention.status === 'TERMINEE' ? 'Terminée' : intervention.status
      );

      // Client & Machine boxes
      y = drawTwoColumnEntityBox(
        doc,
        settings,
        y + 6,
        {
          title: 'CLIENT INDUSTRIEL',
          name: intervention.client?.name || 'Client',
          city: intervention.client?.city || 'Maroc',
          address: intervention.client?.address,
          contactName: intervention.customerSignerName,
          phone: intervention.client?.phone,
        },
        {
          title: 'MACHINE CONCERNÉE',
          lines: [
            { label: 'Modèle', value: intervention.machine?.model?.name || 'Imprimante Videojet', isBold: true },
            { label: 'N° Série', value: intervention.machine?.serialNumber || '—', isBold: true },
            { label: 'Technologie', value: intervention.machine?.model?.family || 'CIJ' },
            { label: 'Heures fonct.', value: `${intervention.meterReadingHours || intervention.machine?.totalOperatingHours || 0} h` },
          ],
        }
      );

      y += 14;

      // Diagnostic & Work Done Box
      const fullW = 515;
      doc.roundedRect(40, y, fullW, 75, 4).stroke(COLORS.border);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(primary).text('DIAGNOSTIC & ACTIONS TECHNIQUES RÉALISÉES', 50, y + 8);
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(COLORS.darkText).text('Diagnostic :', 50, y + 22);
      doc.font('Helvetica').fillColor(COLORS.lightText).text(intervention.diagnosis || 'Maintenance préventive / curative standard.', 105, y + 22, { width: fullW - 120 });

      doc.font('Helvetica-Bold').fillColor(COLORS.darkText).text('Actions :', 50, y + 42);
      doc.font('Helvetica').fillColor(COLORS.lightText).text(intervention.workDone || 'Nettoyage des buses, réglage de viscosité, recalibrage et test d\'impression validé.', 105, y + 42, { width: fullW - 120 });

      y += 85;

      // Parts Table
      doc.rect(40, y, fullW, 18).fill(primary);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.white);
      doc.text('Réf. Pièce / Consommable', 50, y + 5);
      doc.text('Désignation', 160, y + 5);
      doc.text('Quantité', 450, y + 5, { width: 90, align: 'right' });
      y += 18;

      if (intervention.partsUsed && intervention.partsUsed.length > 0) {
        intervention.partsUsed.forEach((p: any, idx: number) => {
          const bg = idx % 2 === 0 ? COLORS.lightBg : COLORS.white;
          doc.rect(40, y, fullW, 18).fill(bg);
          doc.fontSize(7.5).font('Helvetica-Bold').fillColor(COLORS.darkText).text(p.product?.partNumber || '—', 50, y + 5);
          doc.font('Helvetica').text(p.product?.name || 'Pièce détachée', 160, y + 5, { width: 280, lineBreak: false });
          doc.font('Helvetica-Bold').text(`${p.quantity} ${p.product?.unit || 'PIECE'}`, 450, y + 5, { width: 90, align: 'right' });
          y += 18;
        });
      } else {
        doc.rect(40, y, fullW, 18).fill(COLORS.lightBg);
        doc.fontSize(7.5).font('Helvetica-Oblique').fillColor(COLORS.lightText).text('Aucune pièce remplacée (main-d\'œuvre seule).', 50, y + 5);
        y += 18;
      }

      // =========================================================================
      // Pin Signatures Box near footer (bottom of page)
      // =========================================================================
      const sigW = 250;
      const sigH = 88;
      const bottomPinnedY = doc.page.height - 50 - sigH;
      y = Math.max(y + 24, bottomPinnedY);

      // Signatures Box
      doc.roundedRect(40, y, sigW, sigH, 4).stroke(COLORS.border);
      doc.roundedRect(305, y, sigW, sigH, 4).stroke(COLORS.border);

      // Tech Visa
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(primary).text('TECHNICIEN INTERVENANT', 50, y + 8);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.darkText).text(`${intervention.technician?.firstName || ''} ${intervention.technician?.lastName || ''}`, 50, y + 22);
      doc.fontSize(7).font('Helvetica').fillColor(COLORS.lightText).text(`Temps passé : ${intervention.hoursSpent || 0} h | Frais déplacement : ${intervention.travelExpenses || 0} DH`, 50, y + 36);
      doc.text('Visa & Bon pour exécution technique', 50, y + 52);

      // Customer Visa
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(primary).text('BON POUR ACCORD & RÉCEPTION CLIENT', 315, y + 8);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.darkText).text(`Signataire : ${intervention.customerSignerName || 'Responsable de ligne'}`, 315, y + 22);
      if (intervention.customerSignerTitle) {
        doc.fontSize(7).font('Helvetica').fillColor(COLORS.lightText).text(`Fonction : ${intervention.customerSignerTitle}`, 315, y + 34);
      }

      if (intervention.customerSignature && intervention.customerSignature.startsWith('data:image')) {
        try {
          const base64Data = intervention.customerSignature.replace(/^data:image\/\w+;base64,/, '');
          const sigBuffer = Buffer.from(base64Data, 'base64');
          doc.image(sigBuffer, 315, y + 44, { width: 120, height: 38 });
        } catch (e) {
          doc.fontSize(7).fillColor(COLORS.lightText).text('[Signature tactile enregistrée]', 315, y + 50);
        }
      } else {
        doc.fontSize(7).font('Helvetica-Oblique').fillColor(COLORS.lightText).text('(Signature client sur écran tactile)', 315, y + 60);
      }

      finalizeBufferedPagesWithFooters(doc, settings);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate a Specimen Test PDF with live company settings
 */
export const generateSpecimenPdf = async (): Promise<Buffer> => {
  const dummyInvoice = {
    invoiceNumber: 'FAC-SPECIMEN-2026',
    issueDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    status: 'PAYEE',
    currency: 'MAD',
    subtotalHt: 145000.0,
    taxAmount: 29000.0,
    totalTtc: 174000.0,
    paidAmount: 174000.0,
    paymentMethod: 'Virement bancaire',
    client: {
      name: 'Centrale Danone Maroc (Exemple Client Spécimen)',
      city: 'Casablanca',
      address: 'Zone Industrielle Ain Sebaa',
      ice: '001524889000045',
      phone: '+212 522 35 10 20',
    },
    quote: {
      items: [
        {
          description: 'Imprimante industrielle Jet d\'Encre Dévié Videojet 1880 CIJ (Tête CleanFlow™)',
          quantity: 2,
          unitPrice: 65000.0,
          totalLineHt: 130000.0,
        },
        {
          description: 'Pack de mise en service & formation certifiée Videojet sur site',
          quantity: 1,
          unitPrice: 15000.0,
          totalLineHt: 15000.0,
        },
      ],
    },
  };

  return generateInvoicePdf(dummyInvoice);
};

/**
 * Generate PDF of QR Code labels sheet for machines
 */
export const generateQrLabelsPdf = async (machines: any[]): Promise<Buffer> => {
  const settings = await loadCompanySettings();

  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margins: { top: 30, bottom: 30, left: 35, right: 35 },
        size: 'A4',
        autoFirstPage: true,
        bufferPages: true,
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const primary = settings.primaryColor || COLORS.primary;
      const accent = settings.accentColor || COLORS.accent;

      drawUnifiedHeader(doc, settings, 'PARC MACHINES', 'ÉTIQUETTES QR', new Date().toLocaleDateString('fr-FR'));

      let x = 40;
      let y = 100;
      const labelW = 250;
      const labelH = 105;

      for (let i = 0; i < machines.length; i++) {
        const m = machines[i];

        const qrPayload = JSON.stringify({
          serial: m.serialNumber,
          model: m.model?.modelNumber || m.modelId,
          client: m.client?.name,
          url: `http://localhost:5173/machines/${m.id}/360`,
        });
        const qrBuffer = await QRCode.toBuffer(qrPayload, { width: 90, margin: 1 });

        // Label Card
        doc.roundedRect(x, y, labelW, labelH, 4).fillAndStroke(COLORS.white, COLORS.border);
        doc.rect(x, y, labelW, 5).fill(accent);

        // QR Image
        doc.image(qrBuffer, x + 8, y + 12, { width: 80 });

        // Text
        doc.fontSize(8).font('Helvetica-Bold').fillColor(primary).text(settings.companyName.split(' ')[0] || 'VIDEOJET', x + 95, y + 14);
        doc.fontSize(9.5).font('Helvetica-Bold').fillColor(COLORS.darkText).text(m.serialNumber, x + 95, y + 26, { width: 145 });
        doc.fontSize(8).font('Helvetica').fillColor(COLORS.secondary).text(`Modèle : ${m.model?.name || m.modelId}`, x + 95, y + 40, { width: 145 });
        doc.fontSize(7.5).font('Helvetica').fillColor(COLORS.lightText).text(`Client : ${m.client?.name || '—'}`, x + 95, y + 54, { width: 145, ellipsis: true });
        doc.text(`Site : ${m.site?.name || m.client?.city || 'Maroc'}`, x + 95, y + 66, { width: 145, ellipsis: true });
        doc.fontSize(6.5).font('Helvetica-Oblique').fillColor(COLORS.lightText).text('Scanner pour fiche Machine 360°', x + 95, y + 84);

        if (i % 2 === 0) {
          x += labelW + 15;
        } else {
          x = 40;
          y += labelH + 15;
        }

        if (y + labelH > doc.page.height - 40 && i < machines.length - 1) {
          doc.addPage();
          drawUnifiedHeader(doc, settings, 'PARC MACHINES', 'ÉTIQUETTES QR', new Date().toLocaleDateString('fr-FR'));
          x = 40;
          y = 100;
        }
      }

      finalizeBufferedPagesWithFooters(doc, settings);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

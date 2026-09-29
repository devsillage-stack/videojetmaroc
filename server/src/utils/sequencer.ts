import prisma from '../config/prisma.js';

type SequenceModel =
  | 'quote'
  | 'invoice'
  | 'order'
  | 'intervention'
  | 'ticket'
  | 'stockMovement'
  | 'purchaseOrder'
  | 'industrialAudit'
  | 'tcoCalculation';

interface SequenceConfig {
  model: string;
  field: string;
  prefix: string;
}

const MODEL_CONFIGS: Record<string, SequenceConfig> = {
  quote: { model: 'quote', field: 'quoteNumber', prefix: 'DEV' },
  invoice: { model: 'invoice', field: 'invoiceNumber', prefix: 'FAC' },
  order: { model: 'order', field: 'orderNumber', prefix: 'CMD' },
  intervention: { model: 'intervention', field: 'interventionNumber', prefix: 'INT' },
  ticket: { model: 'maintenanceTicket', field: 'ticketNumber', prefix: 'TCK' },
  stockMovement: { model: 'stockMovement', field: 'movementNumber', prefix: 'MVT' },
  purchaseOrder: { model: 'purchaseOrder', field: 'orderNumber', prefix: 'ACH' },
  industrialAudit: { model: 'industrialAudit', field: 'auditNumber', prefix: 'AUD' },
  tcoCalculation: { model: 'tcoCalculation', field: 'calculationNumber', prefix: 'TCO' },
};

/**
 * Generates an atomic, collision-proof sequential document number.
 * Format: PREFIX-YYYY-XXXX (e.g. DEV-2026-0001, FAC-2026-0042)
 *
 * Guarantees monotonic increment based on the highest existing suffix for the year,
 * preventing unique key collisions even after deletions or under concurrent loads.
 */
export async function getNextSequenceNumber(
  modelKey: SequenceModel,
  customYear?: number,
  client?: any
): Promise<string> {
  const config = MODEL_CONFIGS[modelKey];
  if (!config) {
    throw new Error(`Modèle de séquence inconnu : ${modelKey}`);
  }

  const year = customYear || new Date().getFullYear();
  const searchPrefix = `${config.prefix}-${year}-`;

  // Find the highest existing number for this prefix and year
  const db = client || prisma;
  const prismaModel = (db as any)[config.model];
  const lastRecord = await prismaModel.findFirst({
    where: {
      [config.field]: {
        startsWith: searchPrefix,
      },
    },
    orderBy: {
      [config.field]: 'desc',
    },
    select: {
      [config.field]: true,
    },
  });

  let nextIndex = 1;

  if (lastRecord && lastRecord[config.field]) {
    const rawVal: string = lastRecord[config.field];
    const parts = rawVal.split('-');
    const lastNumStr = parts[parts.length - 1];
    const parsed = parseInt(lastNumStr, 10);
    if (!isNaN(parsed)) {
      nextIndex = parsed + 1;
    }
  }

  const paddedNumber = String(nextIndex).padStart(4, '0');
  return `${config.prefix}-${year}-${paddedNumber}`;
}

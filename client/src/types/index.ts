export type Role =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'DIRECTION'
  | 'COMMERCIAL'
  | 'RESPONSABLE_SAV'
  | 'TECHNICIEN_SAV'
  | 'MAGASINIER'
  | 'COMPTABILITE';

export type MachineTechnology = 'CIJ' | 'LASER_CO2' | 'LASER_FIBRE' | 'TTO' | 'TIJ' | 'LPA';

export type MachineStatus =
  | 'OPERATIONNELLE'
  | 'EN_PANNE'
  | 'EN_MAINTENANCE'
  | 'ARRETEE'
  | 'RETIREE';

export type TicketPriority =
  | 'CRITIQUE_LIGNE_ARRETEE'
  | 'HAUTE'
  | 'NORMALE'
  | 'BASSE';

export type TicketStatus =
  | 'OUVERT'
  | 'ASSIGNE'
  | 'EN_COURS'
  | 'EN_ATTENTE_PIECE'
  | 'RESOLU'
  | 'CLOTURE';

export type InterventionType =
  | 'CURATIVE'
  | 'PREVENTIVE'
  | 'INSTALLATION'
  | 'AUDIT'
  | 'FORMATION';

export type InterventionStatus =
  | 'PLANIFIEE'
  | 'EN_COURS'
  | 'TERMINEE'
  | 'ANNULEE';

export type ProductType =
  | 'ENCRE'
  | 'SOLVANT_MAKEUP'
  | 'NETTOYANT'
  | 'RUBAN_TTO'
  | 'TETE_IMPRESSION'
  | 'FILTRE'
  | 'VALVE'
  | 'MODULE_COEUR'
  | 'PIECE_MECANIQUE'
  | 'CARTE_ELECTRONIQUE'
  | 'ACCESSOIRE'
  | 'AUTRE';

export type BatchStatus = 'VALIDE' | 'ALERTE_PEREMPTION' | 'PERIME' | 'EPUISE';

export type QuoteStatus =
  | 'BROUILLON'
  | 'EN_ATTENTE_VALIDATION'
  | 'ENVOYE'
  | 'ACCEPTE'
  | 'REFUSE'
  | 'EXPIRE';

export type InvoiceStatus =
  | 'EMISE'
  | 'PAYEE_PARTIEL'
  | 'PAYEE'
  | 'EN_RETARD'
  | 'ANNULEE';

export type ContractType = 'SILVER' | 'GOLD' | 'PLATINUM' | 'GARANTIE';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Client {
  id: string;
  code: string;
  name: string;
  type: 'PROSPECT' | 'CLIENT';
  industrySector: string;
  ice?: string;
  rc?: string;
  ifTax?: string;
  address?: string;
  city: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  status: 'ACTIF' | 'INACTIF' | 'EN_PROSPECTION';
  defaultCurrency: string;
  contacts?: ClientContact[];
  sites?: Site[];
  machines?: Machine[];
  contracts?: MaintenanceContract[];
  _count?: {
    machines: number;
    contracts: number;
    tickets: number;
    quotes: number;
  };
}

export interface ClientContact {
  id: string;
  clientId: string;
  firstName: string;
  lastName: string;
  position?: string;
  phone?: string;
  email?: string;
  isPrimary: boolean;
}

export interface Site {
  id: string;
  clientId: string;
  name: string;
  address?: string;
  city: string;
  contactPerson?: string;
  phone?: string;
  productionLines?: ProductionLine[];
}

export interface ProductionLine {
  id: string;
  siteId: string;
  name: string;
  speedUnitsPerHour?: number;
  productType?: string;
}

export interface MachineModel {
  id: string;
  modelNumber: string;
  family: MachineTechnology;
  name: string;
  description?: string;
  maxSpeed?: string;
  resolution?: string;
  ipRating?: string;
  standardWarrantyMonths: number;
}

export interface Machine {
  id: string;
  serialNumber: string;
  modelId: string;
  clientId: string;
  siteId?: string;
  lineId?: string;
  status: MachineStatus;
  installDate: string;
  warrantyEndDate?: string;
  totalOperatingHours: number;
  totalPrintsCount: number;
  qrCodeData?: string;
  notes?: string;
  model: MachineModel;
  client: { id: string; name: string; city: string };
  site?: { id: string; name: string };
  line?: { id: string; name: string };
  tickets?: MaintenanceTicket[];
  interventions?: Intervention[];
  _count?: { tickets: number; interventions: number };
}

export interface MaintenanceTicket {
  id: string;
  ticketNumber: string;
  machineId: string;
  clientId: string;
  assignedToId?: string;
  priority: TicketPriority;
  status: TicketStatus;
  faultDescription: string;
  errorCode?: string;
  reportedBy?: string;
  resolutionNotes?: string;
  slaTargetResponseAt?: string;
  slaTargetResolutionAt?: string;
  firstRespondedAt?: string;
  resolvedAt?: string;
  createdAt: string;
  machine?: Machine;
  client?: { id: string; name: string; city: string };
  assignedTo?: { id: string; firstName: string; lastName: string; phone?: string };
}

export interface Intervention {
  id: string;
  interventionNumber: string;
  ticketId?: string;
  machineId: string;
  technicianId: string;
  clientId: string;
  type: InterventionType;
  status: InterventionStatus;
  scheduledDate: string;
  startedAt?: string;
  completedAt?: string;
  hoursSpent: number;
  travelHours?: number;
  travelDistanceKm?: number;
  travelExpenses?: number;
  meterReadingHours?: number;
  meterReadingPrints?: number;
  diagnosis?: string;
  workDone?: string;
  customerFeedback?: string;
  customerSignature?: string;
  customerSignerName?: string;
  customerSignerTitle?: string;
  technician: { id: string; firstName: string; lastName: string; phone?: string };
  client: { id: string; name: string; city: string };
  machine: Machine;
  ticket?: { ticketNumber: string; priority: TicketPriority };
  partsUsed?: InterventionPartUsed[];
}

export interface Product {
  id: string;
  partNumber: string;
  name: string;
  type: ProductType;
  technology: MachineTechnology;
  description?: string;
  unitPrice: number;
  costPrice?: number;
  currency: string;
  stockQuantity: number;
  minStockThreshold: number;
  unit: string;
  batches?: StockBatch[];
}

export interface StockBatch {
  id: string;
  productId: string;
  batchNumber: string;
  expirationDate: string;
  quantity: number;
  warehouseLocation?: string;
  status: BatchStatus;
  product?: { id: string; partNumber: string; name: string; unit: string };
}

export interface InterventionPartUsed {
  id: string;
  interventionId: string;
  productId: string;
  batchId?: string;
  quantity: number;
  unitPrice: number;
  product: Product;
  batch?: StockBatch;
}

export interface Opportunity {
  id: string;
  title: string;
  clientId: string;
  assignedToId: string;
  stage: string;
  expectedValue: number;
  currency: string;
  probabilityPercent: number;
  closeDate?: string;
  notes?: string;
  client: { id: string; name: string; city: string };
  assignedTo?: { id: string; firstName: string; lastName: string };
}

export interface Quote {
  id: string;
  quoteNumber: string;
  clientId: string;
  opportunityId?: string;
  createdById: string;
  taxRateId: string;
  status: QuoteStatus;
  currency: string;
  exchangeRate: number;
  subtotalHt: number;
  discountPercent: number;
  discountAmount: number;
  totalHt: number;
  taxAmount: number;
  totalTtc: number;
  totalCost?: number;
  estimatedMargin?: number;
  validUntil: string;
  paymentTerms?: string;
  notes?: string;
  createdAt: string;
  client: { id: string; name: string; city: string; defaultCurrency: string };
  createdBy: { id: string; firstName: string; lastName: string };
  taxRate: { id: string; name: string; rate: number };
  items?: QuoteItem[];
}

export interface QuoteItem {
  id: string;
  quoteId: string;
  itemType: string;
  machineModelId?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  discountPercent: number;
  totalLineHt: number;
  machineModel?: MachineModel;
  product?: Product;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  quoteId?: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  currency: string;
  exchangeRate: number;
  subtotalHt: number;
  taxAmount: number;
  totalTtc: number;
  paidAmount: number;
  paymentMethod?: string;
  notes?: string;
  client: { id: string; name: string; city: string };
  quote?: { id: string; quoteNumber: string };
}

export interface MaintenanceContract {
  id: string;
  contractNumber: string;
  clientId: string;
  type: ContractType;
  startDate: string;
  endDate: string;
  status: string;
  annualCost: number;
  currency: string;
  visitsPerYear: number;
  visitsCompleted: number;
  responseTimeHours: number;
  includesParts: boolean;
  includesConsumables: boolean;
  notes?: string;
  client: { id: string; name: string; city: string; machines?: Machine[] };
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  isBase: boolean;
  rateToBase: number;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: { firstName: string; lastName: string; role: Role };
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  paymentTerms?: string;
  currency: string;
  rating: number;
  notes?: string;
  createdAt: string;
  products?: Product[];
  _count?: { products: number; purchaseOrders: number };
}

export type PurchaseOrderStatus =
  | 'BROUILLON'
  | 'SOUMISE'
  | 'APPROUVEE'
  | 'EN_TRANSIT'
  | 'RECUE_COMPLETE'
  | 'RECUE_PARTIELLE'
  | 'ANNULEE';

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  totalLineHt: number;
  product?: Product;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  createdById: string;
  status: PurchaseOrderStatus;
  currency: string;
  exchangeRate: number;
  subtotalHt: number;
  taxAmount: number;
  totalTtc: number;
  orderDate: string;
  expectedDeliveryDate?: string;
  receivedDate?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  supplier: Supplier;
  createdBy?: { id: string; firstName: string; lastName: string };
  items: PurchaseOrderItem[];
  stockMovements?: StockMovement[];
}

export type StockMovementType =
  | 'ENTREE_ACHAT'
  | 'SORTIE_INTERVENTION'
  | 'SORTIE_VENTE'
  | 'TRANSFERT_DEPOT'
  | 'AJUSTEMENT_INVENTAIRE'
  | 'REBUT_PERIME';

export interface StockMovement {
  id: string;
  movementNumber: string;
  productId: string;
  batchId?: string;
  purchaseOrderId?: string;
  userId?: string;
  type: StockMovementType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reason?: string;
  createdAt: string;
  product: { id: string; partNumber: string; name: string; unit: string };
  batch?: { id: string; batchNumber: string };
  purchaseOrder?: { id: string; orderNumber: string };
  user?: { id: string; firstName: string; lastName: string };
}

export interface ReplenishmentSuggestion {
  product: Product;
  supplier: Supplier | null;
  deficit: number;
  suggestedReorderQuantity: number;
  estimatedCost: number;
}

export interface CompanySettings {
  id?: string;
  companyName: string;
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
  updatedAt?: string;
}


import request from 'supertest';
import { createApp } from '../src/app.js';
import prisma from '../src/config/prisma.js';

const app = createApp();

describe('VIDEOJET MAROC - PHASES 4 & 5 TESTS (Planning, SLA, Purchasing, Stock Movements)', () => {
  let adminToken = '';
  let techToken = '';
  let technicianId = '';
  let machineId = '';
  let clientId = '';
  let supplierId = '';
  let productId = '';
  let createdPurchaseOrderId = '';
  let createdTicketId = '';

  beforeAll(async () => {
    // Authenticate as Super Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'superadmin@videojet.ma', password: 'Videojet2026!' });
    adminToken = adminRes.body.token;

    // Authenticate as Technicien
    const techRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'technicien@videojet.ma', password: 'Videojet2026!' });
    techToken = techRes.body.token;
    technicianId = techRes.body.user.id;

    // Get a machine, client, supplier, product
    const client = await prisma.client.findFirst({
      where: { code: 'CLI-DAN-001' },
      include: { machines: true },
    });
    clientId = client!.id;
    machineId = client!.machines[0].id;

    const supplier = await prisma.supplier.findFirst({
      where: { code: 'FRN-VJ-001' },
    });
    supplierId = supplier!.id;

    const product = await prisma.product.findFirst({
      where: { partNumber: 'V706-D' },
    });
    productId = product!.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // --- PHASE 4 TESTS: PLANNING & SLA ---
  test('GET /api/planning/technicians should list technicians with active workload', async () => {
    const res = await request(app)
      .get('/api/planning/technicians')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.technicians).toBeDefined();
    expect(res.body.technicians.length).toBeGreaterThan(0);
    const tech = res.body.technicians.find((t: any) => t.id === technicianId);
    expect(tech).toBeDefined();
    expect(tech.interventions).toBeDefined();
  });

  test('GET /api/planning/interventions should return scheduled interventions', async () => {
    const res = await request(app)
      .get('/api/planning/interventions')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.interventions).toBeDefined();
    expect(res.body.interventions.length).toBeGreaterThan(0);
    expect(res.body.interventions[0].technician).toBeDefined();
  });

  test('POST /api/planning/check-conflicts should detect existing appointment overlaps', async () => {
    // Find an active intervention for the technician
    const existingIntervention = await prisma.intervention.findFirst({
      where: {
        technicianId,
        status: { in: ['PLANIFIEE', 'EN_COURS'] },
      },
    });

    const targetDate = existingIntervention
      ? new Date(existingIntervention.scheduledDate.getTime() + 15 * 60 * 1000).toISOString()
      : new Date().toISOString();

    const resConflict = await request(app)
      .post('/api/planning/check-conflicts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        technicianId,
        scheduledDate: targetDate,
        estimatedHours: 2.0,
      });

    expect(resConflict.status).toBe(200);
    expect(resConflict.body.hasConflict).toBe(true);
    expect(resConflict.body.conflictingIntervention).toBeDefined();

    // Check future date far away (no conflict)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90);

    const resNoConflict = await request(app)
      .post('/api/planning/check-conflicts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        technicianId,
        scheduledDate: futureDate.toISOString(),
        estimatedHours: 2.0,
      });

    expect(resNoConflict.status).toBe(200);
    expect(resNoConflict.body.hasConflict).toBe(false);
  });

  test('POST /api/maintenance/tickets should automatically compute SLA target response & resolution deadlines', async () => {
    const res = await request(app)
      .post('/api/maintenance/tickets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        machineId,
        clientId,
        priority: 'CRITIQUE_LIGNE_ARRETEE',
        faultDescription: 'Arrêt de production imprévu : alerte pression pompe CIJ',
        errorCode: 'E204-P',
        reportedBy: 'Directeur Usine',
      });

    expect(res.status).toBe(201);
    expect(res.body.ticket).toBeDefined();
    expect(res.body.ticket.slaTargetResponseAt).toBeDefined();
    expect(res.body.ticket.slaTargetResolutionAt).toBeDefined();

    // For CRITIQUE: response target is ~1h, resolution target is ~4h
    const created = new Date(res.body.ticket.createdAt).getTime();
    const respTarget = new Date(res.body.ticket.slaTargetResponseAt).getTime();
    const diffHours = (respTarget - created) / (1000 * 3600);
    expect(Math.round(diffHours)).toBe(1);

    createdTicketId = res.body.ticket.id;
  });

  test('PATCH /api/maintenance/tickets/:id should record firstRespondedAt when status changes to EN_COURS', async () => {
    const res = await request(app)
      .put(`/api/maintenance/tickets/${createdTicketId}`)
      .set('Authorization', `Bearer ${techToken}`)
      .send({
        status: 'EN_COURS',
        assignedToId: technicianId,
      });

    expect(res.status).toBe(200);
    expect(res.body.ticket.status).toBe('EN_COURS');
    expect(res.body.ticket.firstRespondedAt).toBeDefined();
  });

  // --- PHASE 5 TESTS: PURCHASING, STOCK & RECEPTION ---
  test('GET /api/purchasing/suppliers should return supplier directory', async () => {
    const res = await request(app)
      .get('/api/purchasing/suppliers')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.suppliers.length).toBeGreaterThan(0);
    const vTech = res.body.suppliers.find((s: any) => s.code === 'FRN-VJ-001');
    expect(vTech).toBeDefined();
    expect(vTech._count.purchaseOrders).toBeGreaterThan(0);
  });

  test('POST /api/purchasing/orders should generate ACH order with items and 20% TVA', async () => {
    const res = await request(app)
      .post('/api/purchasing/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        supplierId,
        currency: 'MAD',
        notes: 'Commande réassort Solvants CIJ',
        items: [
          {
            productId,
            quantity: 20,
            unitPrice: 160.0,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.purchaseOrder).toBeDefined();
    expect(res.body.purchaseOrder.orderNumber).toMatch(/^ACH-\d{4}-\d{4}$/);
    expect(res.body.purchaseOrder.subtotalHt).toBe(3200.0);
    expect(res.body.purchaseOrder.taxAmount).toBe(640.0);
    expect(res.body.purchaseOrder.totalTtc).toBe(3840.0);
    createdPurchaseOrderId = res.body.purchaseOrder.id;
  });

  test('POST /api/purchasing/orders/:id/receive should receive items, increment stock and create StockMovement', async () => {
    // Get product initial stock
    const productBefore = await prisma.product.findUnique({ where: { id: productId } });
    const initialQty = productBefore!.stockQuantity;

    // Get order item ID
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: createdPurchaseOrderId },
      include: { items: true },
    });
    const itemId = order!.items[0].id;

    // Receive 20 units
    const res = await request(app)
      .post(`/api/purchasing/orders/${createdPurchaseOrderId}/receive`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        receivedItems: [
          {
            itemId,
            receivedQuantity: 20,
            batchNumber: 'LOT-TEST-REC-001',
            expirationDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
            warehouseLocation: 'Casablanca Dépôt A',
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.purchaseOrder.status).toBe('RECUE_COMPLETE');

    // Verify product stock incremented
    const productAfter = await prisma.product.findUnique({ where: { id: productId } });
    expect(productAfter!.stockQuantity).toBe(initialQty + 20);

    // Verify StockMovement created
    const movement = await prisma.stockMovement.findFirst({
      where: { purchaseOrderId: createdPurchaseOrderId },
    });
    expect(movement).toBeDefined();
    expect(movement!.type).toBe('ENTREE_ACHAT');
    expect(movement!.quantity).toBe(20);
  });

  test('GET /api/inventory/replenishment-suggestions should detect products under minimum threshold', async () => {
    const res = await request(app)
      .get('/api/inventory/replenishment-suggestions')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.suggestions).toBeDefined();
    expect(Array.isArray(res.body.suggestions)).toBe(true);
    for (const sugg of res.body.suggestions) {
      expect(sugg.product.stockQuantity).toBeLessThanOrEqual(sugg.product.minStockThreshold);
      expect(sugg.suggestedReorderQuantity).toBeGreaterThan(0);
    }
  });

  test('GET /api/inventory/movements should return stock movements audit trail', async () => {
    const res = await request(app)
      .get('/api/inventory/movements')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.movements).toBeDefined();
    expect(res.body.movements.length).toBeGreaterThan(0);
    expect(res.body.movements[0].movementNumber).toMatch(/^MVT-\d{4}-\d{4}$/);
  });
});

import request from 'supertest';
import { createApp } from '../src/app.js';
import prisma from '../src/config/prisma.js';

const app = createApp();

describe('VIDEOJET MAROC - PHASES 2 & 3 TESTS (Commercial, Audits, TCO, Orders, Fleet 360)', () => {
  let adminToken = '';
  let commercialToken = '';
  let danoneClientId = '';
  let machineId = '';
  let auditId = '';

  beforeAll(async () => {
    // Authenticate as Super Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'superadmin@videojet.ma', password: 'Videojet2026!' });
    adminToken = adminRes.body.token;

    // Authenticate as Commercial
    const commRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'commercial@videojet.ma', password: 'Videojet2026!' });
    commercialToken = commRes.body.token;

    // Retrieve Danone Client
    const client = await prisma.client.findFirst({
      where: { code: 'CLI-DAN-001' },
      include: { machines: true },
    });
    danoneClientId = client!.id;
    machineId = client!.machines[0].id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('GET /api/audits should return industrial audits with technical recommendations', async () => {
    const res = await request(app)
      .get('/api/audits')
      .set('Authorization', `Bearer ${commercialToken}`);

    expect(res.status).toBe(200);
    expect(res.body.audits.length).toBeGreaterThan(0);
    const danoneAudit = res.body.audits.find((a: any) => a.auditNumber === 'AUD-2024-0001');
    expect(danoneAudit).toBeDefined();
    expect(danoneAudit.recommendations.length).toBeGreaterThan(0);
    expect(danoneAudit.recommendations[0].recommendedTech).toBe('CIJ');
    auditId = danoneAudit.id;
  });

  test('POST /api/audits should automatically recommend TTO 6530 for flexible film packaging', async () => {
    const res = await request(app)
      .post('/api/audits')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({
        clientId: danoneClientId,
        packagingSubstrate: 'Film PE opercule thermoformé pour fromage fondu',
        unitsPerHour: 18000,
        washdownExposure: false,
        dustLevel: 'Faible',
        messageLinesCount: 2,
        notes: 'Test recommandation TTO',
      });

    expect(res.status).toBe(201);
    expect(res.body.audit.recommendations[0].recommendedTech).toBe('TTO');
    expect(res.body.audit.recommendations[0].justification).toContain('DataFlex 6530');
  });

  test('POST /api/audits/:id/tco should calculate TCO, annual savings and payback period', async () => {
    const res = await request(app)
      .post(`/api/audits/${auditId}/tco`)
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({
        calculationName: 'Test TCO Chiffré Danone Salé',
        existingAnnualConsumableCost: 48000,
        existingAnnualMaintenanceCost: 30000,
        existingAnnualDowntimeHours: 40,
        hourlyDowntimeCost: 1500,
        equipmentInvestmentPrice: 125000,
        installationAndTrainingPrice: 7000,
        videojetAnnualConsumableCost: 32000,
        videojetAnnualMaintenanceCost: 16000,
        annualUnitsProduced: 12000000,
      });

    expect(res.status).toBe(201);
    expect(res.body.tco.estimatedAnnualSavings).toBeGreaterThan(0);
    expect(res.body.tco.paybackPeriodMonths).toBeGreaterThan(0);
    expect(res.body.tco.disclaimer).toContain('Estimation indicative');
  });

  test('GET /api/competitors should return competitive intelligence benchmarks', async () => {
    const res = await request(app)
      .get('/api/competitors')
      .set('Authorization', `Bearer ${commercialToken}`);

    expect(res.status).toBe(200);
    expect(res.body.competitors.length).toBeGreaterThanOrEqual(3);
    const markem = res.body.competitors.find((c: any) => c.brand === 'Markem-Imaje');
    expect(markem).toBeDefined();
    expect(markem.videojetWinningPitch).toContain('CleanFlow');
  });

  test('GET /api/orders should return orders list', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${commercialToken}`);

    expect(res.status).toBe(200);
    expect(res.body.orders.length).toBeGreaterThan(0);
    expect(res.body.orders[0].orderNumber).toBeDefined();
  });

  test('GET /api/fleet360/machines/:id should return complete Machine 360 data with warranty and risk score', async () => {
    const res = await request(app)
      .get(`/api/fleet360/machines/${machineId}`)
      .set('Authorization', `Bearer ${commercialToken}`);

    expect(res.status).toBe(200);
    expect(res.body.machine.serialNumber).toBeDefined();
    expect(res.body.metrics).toBeDefined();
    expect(typeof res.body.metrics.isUnderWarranty).toBe('boolean');
    expect(typeof res.body.metrics.replacementScore).toBe('number');
  });

  test('GET /api/fleet360/clients/:id should return Customer 360 with financial & fleet metrics', async () => {
    const res = await request(app)
      .get(`/api/fleet360/clients/${danoneClientId}`)
      .set('Authorization', `Bearer ${commercialToken}`);

    expect(res.status).toBe(200);
    expect(res.body.client.name).toContain('Danone');
    expect(res.body.financialSummary).toBeDefined();
    expect(res.body.fleetSummary.totalMachines).toBeGreaterThan(0);
  });

  test('GET /api/fleet360/replacement-alerts should flag machines with high age or breakdowns', async () => {
    const res = await request(app)
      .get('/api/fleet360/replacement-alerts')
      .set('Authorization', `Bearer ${commercialToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.alerts)).toBe(true);
  });

  test('POST /api/fleet360/clients/:id/activities should add an activity to client timeline', async () => {
    const res = await request(app)
      .post(`/api/fleet360/clients/${danoneClientId}/activities`)
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({
        type: 'VISITE',
        title: 'Entretien annuel de performance de ligne',
        description: 'Vérification de la satisfaction sur la Videojet 1880.',
      });

    expect(res.status).toBe(201);
    expect(res.body.activity.title).toBe('Entretien annuel de performance de ligne');
  });
});

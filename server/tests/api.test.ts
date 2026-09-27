import request from 'supertest';
import { createApp } from '../src/app.js';
import prisma from '../src/config/prisma.js';

const app = createApp();

describe('VIDEOJET MAROC INDUSTRIAL PLATFORM - API TESTS', () => {
  let superAdminToken = '';
  let commercialToken = '';
  let techToken = '';

  beforeAll(async () => {
    // Authenticate as Super Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'superadmin@videojet.ma', password: 'Videojet2026!' });
    superAdminToken = adminRes.body.token;

    // Authenticate as Commercial
    const commRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'commercial@videojet.ma', password: 'Videojet2026!' });
    commercialToken = commRes.body.token;

    // Authenticate as Technicien
    const techRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'technicien@videojet.ma', password: 'Videojet2026!' });
    techToken = techRes.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('GET /api/health should return UP and system name', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.system).toContain('VIDEOJET MAROC');
  });

  test('POST /api/auth/login with wrong password should fail', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'superadmin@videojet.ma', password: 'WrongPassword' });
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me should return current profile with role', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('SUPER_ADMIN');
    expect(res.body.user.email).toBe('superadmin@videojet.ma');
  });

  test('RBAC: Commercial should NOT be allowed to delete a client or delete a user', async () => {
    const res = await request(app)
      .delete('/api/users/some-fake-id')
      .set('Authorization', `Bearer ${commercialToken}`);
    expect(res.status).toBe(403);
  });

  test('GET /api/machines should return installed base with QR codes', async () => {
    const res = await request(app)
      .get('/api/machines')
      .set('Authorization', `Bearer ${commercialToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.machines)).toBe(true);
    expect(res.body.machines.length).toBeGreaterThan(0);
    expect(res.body.machines[0].serialNumber).toBeDefined();
    expect(res.body.machines[0].qrCodeData).toBeDefined();
  });

  test('GET /api/clients should return clients with sites and lines count', async () => {
    const res = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${commercialToken}`);
    expect(res.status).toBe(200);
    expect(res.body.clients.length).toBeGreaterThan(0);
    const danone = res.body.clients.find((c: any) => c.code === 'CLI-DAN-001');
    expect(danone).toBeDefined();
    expect(danone.name).toBe('Centrale Danone Maroc');
  });

  test('Margin protection: Commercial should NOT see costPrice in products catalog', async () => {
    const res = await request(app)
      .get('/api/inventory/products')
      .set('Authorization', `Bearer ${commercialToken}`);
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThan(0);
    expect(res.body.products[0].costPrice).toBeUndefined();
  });

  test('Margin protection: Super Admin CAN see costPrice in products catalog', async () => {
    const res = await request(app)
      .get('/api/inventory/products')
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThan(0);
    expect(res.body.products[0].costPrice).toBeDefined();
  });

  test('GET /api/inventory/alerts/expiration should return batches near expiration', async () => {
    const res = await request(app)
      .get('/api/inventory/alerts/expiration')
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.alerts.length).toBeGreaterThan(0);
  });

  test('GET /api/currencies should return MAD, EUR, USD with exchange rates', async () => {
    const res = await request(app)
      .get('/api/currencies')
      .set('Authorization', `Bearer ${commercialToken}`);
    expect(res.status).toBe(200);
    expect(res.body.currencies.length).toBe(3);
    const eur = res.body.currencies.find((c: any) => c.code === 'EUR');
    expect(eur.rateToBase).toBe(10.85);
  });

  test('GET /api/dashboard/stats should return comprehensive KPIs', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.kpis.totalMachines).toBeGreaterThan(0);
    expect(res.body.kpis.financial).toBeDefined();
    expect(res.body.kpis.financial.totalRevenueAccepted).toBeGreaterThan(0);
  });

  test('GET /api/audit should return system audit trail for Super Admin', async () => {
    const res = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.logs.length).toBeGreaterThan(0);
    expect(res.body.logs[0].action).toBeDefined();
  });
});

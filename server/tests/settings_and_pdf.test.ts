import request from 'supertest';
import { createApp } from '../src/app.js';
import prisma from '../src/config/prisma.js';

const app = createApp();

describe('SETTINGS & PDF ENGINE TESTS', () => {
  let adminToken = '';
  let commToken = '';
  let testInvoiceId = '';

  beforeAll(async () => {
    // Admin login
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'superadmin@videojet.ma', password: 'Videojet2026!' });
    adminToken = adminRes.body.token;

    // Commercial login
    const commRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'commercial@videojet.ma', password: 'Videojet2026!' });
    commToken = commRes.body.token;

    // Find an invoice
    const inv = await prisma.invoice.findFirst();
    if (inv) {
      testInvoiceId = inv.id;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('GET /api/settings/company should return default or existing company settings', async () => {
    const res = await request(app)
      .get('/api/settings/company')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.settings).toBeDefined();
    expect(res.body.settings.companyName).toContain('VIDEOJET');
    expect(res.body.settings.ice).toBeDefined();
    expect(res.body.settings.rib).toBeDefined();
    expect(res.body.settings.logoWidth).toBeGreaterThan(0);
  });

  test('Commercial should NOT be allowed to update company settings (RBAC)', async () => {
    const res = await request(app)
      .put('/api/settings/company')
      .set('Authorization', `Bearer ${commToken}`)
      .send({ companyName: 'Hacked Name' });

    expect(res.status).toBe(403);
  });

  test('Admin CAN update company settings and document studio properties', async () => {
    const res = await request(app)
      .put('/api/settings/company')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyName: 'VIDEOJET MAROC SARL',
        tagline: 'Solutions Industrielles de Marquage & Traçabilité 4.0',
        logoWidth: 160,
        primaryColor: '#002b49',
        accentColor: '#ff5c00',
        bankName: 'Attijariwafa Bank Maroc',
      });

    expect(res.status).toBe(200);
    expect(res.body.settings.logoWidth).toBe(160);
    expect(res.body.settings.tagline).toBe('Solutions Industrielles de Marquage & Traçabilité 4.0');
  });

  test('GET /api/exports/specimen-pdf should generate a valid PDF', async () => {
    const res = await request(app)
      .get('/api/exports/specimen-pdf')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.header['content-type']).toBe('application/pdf');
    expect(res.body).toBeInstanceOf(Buffer);

    const pdfString = res.body.toString('latin1');
    expect(pdfString.startsWith('%PDF-')).toBe(true);

    // Count pages in generated PDF: /Type /Page (excluding /Pages)
    const pageMatches = pdfString.match(/\/Type\s*\/Page\b/g);
    expect(pageMatches).toBeDefined();
    expect(pageMatches!.length).toBe(1); // STRICTLY 1 PAGE!
  });

  test('GET /api/exports/invoices/:id/pdf should generate strictly 1-page PDF for standard invoice', async () => {
    if (!testInvoiceId) return;

    const res = await request(app)
      .get(`/api/exports/invoices/${testInvoiceId}/pdf`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.header['content-type']).toBe('application/pdf');

    const pdfString = res.body.toString('latin1');
    expect(pdfString.startsWith('%PDF-')).toBe(true);

    const pageMatches = pdfString.match(/\/Type\s*\/Page\b/g);
    expect(pageMatches).toBeDefined();
    // Must be exactly 1 page (fixing the 3-page bug forever!)
    expect(pageMatches!.length).toBe(1);
  });

  test('GET /api/settings/database-stats should return counts of all entities', async () => {
    const res = await request(app)
      .get('/api/settings/database-stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.stats).toBeDefined();
    expect(res.body.stats.clients).toBeGreaterThan(0);
    expect(res.body.stats.machines).toBeGreaterThan(0);
    expect(res.body.stats.totalRecords).toBeGreaterThan(0);
  });

  test('Commercial should NOT be allowed to access database-stats or purge (RBAC)', async () => {
    const statsRes = await request(app)
      .get('/api/settings/database-stats')
      .set('Authorization', `Bearer ${commToken}`);
    expect(statsRes.status).toBe(403);

    const purgeRes = await request(app)
      .post('/api/settings/purge-database')
      .set('Authorization', `Bearer ${commToken}`)
      .send({ confirmation: 'PURGE' });
    expect(purgeRes.status).toBe(403);
  });

  test('Purge without exact confirmation string "PURGE" should fail with 400', async () => {
    const res = await request(app)
      .post('/api/settings/purge-database')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ confirmation: 'WRONG' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Confirmation incorrecte');
  });
});

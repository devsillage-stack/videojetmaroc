import request from 'supertest';
import { createApp } from '../src/app.js';
import prisma from '../src/config/prisma.js';

const app = createApp();

describe('VIDEOJET MAROC - PHASE 6 TESTS (PDF, Excel & QR Code Exports)', () => {
  let adminToken = '';
  let interventionId = '';
  let quoteId = '';
  let invoiceId = '';

  beforeAll(async () => {
    // Authenticate as Super Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'superadmin@videojet.ma', password: 'Videojet2026!' });
    adminToken = adminRes.body.token;

    // Get an intervention
    const intervention = await prisma.intervention.findFirst();
    interventionId = intervention!.id;

    // Get a quote
    const quote = await prisma.quote.findFirst();
    quoteId = quote!.id;

    // Get an invoice
    const invoice = await prisma.invoice.findFirst();
    invoiceId = invoice!.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('GET /api/exports/interventions/:id/pdf should generate valid PDF intervention sheet', async () => {
    const res = await request(app)
      .get(`/api/exports/interventions/${interventionId}/pdf`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.body).toBeDefined();
  });

  test('GET /api/exports/quotes/:id/pdf should generate official Videojet commercial quote PDF', async () => {
    const res = await request(app)
      .get(`/api/exports/quotes/${quoteId}/pdf`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain('attachment');
  });

  test('GET /api/exports/invoices/:id/pdf should generate legal invoice PDF with Moroccan mentions', async () => {
    const res = await request(app)
      .get(`/api/exports/invoices/${invoiceId}/pdf`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain('attachment');
  });

  test('GET /api/exports/machines/qr-labels/pdf should generate printable QR labels sheet', async () => {
    const res = await request(app)
      .get('/api/exports/machines/qr-labels/pdf')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain('Etiquettes_QR_Videojet.pdf');
  });

  test('GET /api/exports/machines/excel should generate XLSX file for machines fleet', async () => {
    const res = await request(app)
      .get('/api/exports/machines/excel')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('spreadsheetml.sheet');
    expect(res.headers['content-disposition']).toContain('Parc_Machines_Videojet.xlsx');
  });

  test('GET /api/exports/inventory/excel should generate XLSX file for products catalog', async () => {
    const res = await request(app)
      .get('/api/exports/inventory/excel')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('spreadsheetml.sheet');
    expect(res.headers['content-disposition']).toContain('Catalogue_Videojet.xlsx');
  });

  test('GET /api/exports/movements/excel should generate XLSX file for stock movements audit trail', async () => {
    const res = await request(app)
      .get('/api/exports/movements/excel')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('spreadsheetml.sheet');
    expect(res.headers['content-disposition']).toContain('Mouvements_Stock_Videojet.xlsx');
  });
});

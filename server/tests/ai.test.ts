import request from 'supertest';
import { createApp } from '../src/app.js';
import prisma from '../src/config/prisma.js';

const app = createApp();

describe('VIDEOJET MAROC - AI INDUSTRIAL COPILOT TESTS', () => {
  let token = '';

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'superadmin@videojet.ma', password: 'Videojet2026!' });
    token = res.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('POST /api/ai/chat should return intelligent copilot response', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        messages: [
          { role: 'user', content: 'Bonjour, quelles sont les capacités de la Videojet 1880 ?' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('reply');
    expect(typeof res.body.reply).toBe('string');
    expect(res.body.reply.length).toBeGreaterThan(20);
  });

  test('POST /api/ai/diagnose should diagnose E52 Viscosity Fault with correct steps and parts', async () => {
    const res = await request(app)
      .post('/api/ai/diagnose')
      .set('Authorization', `Bearer ${token}`)
      .send({
        model: 'Videojet 1580',
        errorCode: 'E52',
        symptoms: 'Message alerte viscosité rouge sur écran tactile',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('diagnostic');
    const diag = res.body.diagnostic;
    expect(diag.severity).toBe('HAUTE');
    expect(diag.probableCauses.length).toBeGreaterThan(0);
    expect(diag.actionSteps.length).toBeGreaterThan(0);
    expect(diag.requiredParts.some((p: any) => p.partNumber === 'V706-D')).toBe(true);
  });

  test('POST /api/ai/diagnose should diagnose FA10 Gutter Fault as CRITIQUE with CleanFlow procedure', async () => {
    const res = await request(app)
      .post('/api/ai/diagnose')
      .set('Authorization', `Bearer ${token}`)
      .send({
        model: 'Videojet 1880',
        errorCode: 'FA10',
        symptoms: 'Arrêt de ligne, jet dévié hors gouttière',
      });

    expect(res.status).toBe(200);
    const diag = res.body.diagnostic;
    expect(diag.severity).toBe('CRITIQUE');
    expect(diag.actionSteps.some((s: any) => s.action.includes('CleanFlow') || s.action.includes('gouttière'))).toBe(true);
  });

  test('POST /api/ai/ink-advisor should recommend V411-D MEK ink for PEHD substrate', async () => {
    const res = await request(app)
      .post('/api/ai/ink-advisor')
      .set('Authorization', `Bearer ${token}`)
      .send({
        substrate: 'Bouteille PEHD huile alimentaire',
        temperature: '25°C',
        foodContact: true,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('recommendation');
    const rec = res.body.recommendation;
    expect(rec.primaryInk.partNumber).toBe('V411-D');
    expect(rec.associatedMakeUp.partNumber).toBe('V706-D');
    expect(rec.regulatoryCompliance.length).toBeGreaterThan(0);
  });

  test('POST /api/ai/sales-pitch should generate competitive battlecard vs Markem-Imaje', async () => {
    const res = await request(app)
      .post('/api/ai/sales-pitch')
      .set('Authorization', `Bearer ${token}`)
      .send({
        competitor: 'Markem-Imaje 9450',
        targetIndustry: 'Agroalimentaire Centrale Danone Maroc',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('pitch');
    const pitch = res.body.pitch;
    expect(pitch.targetCompetitor).toContain('Markem-Imaje');
    expect(pitch.keyDifferentiators.length).toBeGreaterThan(0);
    expect(pitch.keyDifferentiators.some((d: any) => d.videojetAdvantage.includes('CleanFlow') || d.videojetAdvantage.includes('Smart Cell'))).toBe(true);
  });

  test('Audit log should register AI queries for traceability', async () => {
    const auditLogs = await prisma.auditLog.findMany({
      where: { action: { in: ['AI_CHAT_QUERY', 'AI_DIAGNOSTIC_QUERY', 'AI_INK_ADVISOR_QUERY', 'AI_SALES_PITCH_QUERY'] } },
      take: 5,
    });

    expect(auditLogs.length).toBeGreaterThan(0);
  });
});

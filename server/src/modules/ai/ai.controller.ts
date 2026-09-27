import { Response } from 'express';
import { AuthRequest } from '../../types/index.js';
import { logAuditAction } from '../../middlewares/audit.middleware.js';
import {
  chatWithCopilot,
  runDiagnostic,
  recommendInkAndSolvent,
  generateSalesPitch,
} from './ai.service.js';

export const handleAiChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'La liste des messages est requise.' });
      return;
    }

    const reply = await chatWithCopilot(messages, req.user?.role);

    await logAuditAction(req, 'AI_CHAT_QUERY', 'AI_Copilot', undefined, {
      lastMessageLength: messages[messages.length - 1]?.content?.length || 0,
      role: req.user?.role,
    });

    res.json({ reply });
  } catch (err: any) {
    console.error('[AI Controller] Chat error:', err);
    res.status(500).json({ error: 'Erreur lors du traitement de la requête IA' });
  }
};

export const handleAiDiagnose = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { model, errorCode, symptoms, lineContext } = req.body;

    if (!model && !symptoms && !errorCode) {
      res.status(400).json({ error: 'Le modèle ou la description du problème est requis.' });
      return;
    }

    const result = await runDiagnostic({
      model: model || 'Videojet CIJ 1580 / 1880',
      errorCode,
      symptoms: symptoms || '',
      lineContext,
    });

    await logAuditAction(req, 'AI_DIAGNOSTIC_QUERY', 'Machine', undefined, {
      model,
      errorCode,
      severity: result.severity,
    });

    res.json({ diagnostic: result });
  } catch (err: any) {
    console.error('[AI Controller] Diagnose error:', err);
    res.status(500).json({ error: 'Erreur lors du diagnostic IA' });
  }
};

export const handleAiInkAdvisor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { substrate, lineSpeed, temperature, humidity, foodContact, industry } = req.body;

    if (!substrate) {
      res.status(400).json({ error: 'Le type de substrat est requis (ex: PEHD, Verre, Carton, etc.).' });
      return;
    }

    const result = await recommendInkAndSolvent({
      substrate,
      lineSpeed: lineSpeed ? Number(lineSpeed) : undefined,
      temperature,
      humidity,
      foodContact: Boolean(foodContact),
      industry,
    });

    await logAuditAction(req, 'AI_INK_ADVISOR_QUERY', 'Product', undefined, {
      substrate,
      recommendedTech: result.recommendedTechnology,
      recommendedInk: result.primaryInk.partNumber,
    });

    res.json({ recommendation: result });
  } catch (err: any) {
    console.error('[AI Controller] Ink advisor error:', err);
    res.status(500).json({ error: 'Erreur lors de la recommandation d\'encre' });
  }
};

export const handleAiSalesPitch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { competitor, targetIndustry, clientConcerns, budgetSensitivity } = req.body;

    if (!competitor) {
      res.status(400).json({ error: 'Le concurrent cible est requis (ex: Markem-Imaje, Domino, Linx).' });
      return;
    }

    const result = await generateSalesPitch({
      competitor,
      targetIndustry: targetIndustry || 'Industrie Agroalimentaire Maroc',
      clientConcerns,
      budgetSensitivity,
    });

    await logAuditAction(req, 'AI_SALES_PITCH_QUERY', 'Competitor', undefined, {
      competitor,
      targetIndustry,
    });

    res.json({ pitch: result });
  } catch (err: any) {
    console.error('[AI Controller] Sales pitch error:', err);
    res.status(500).json({ error: 'Erreur lors de la génération du pitch commercial' });
  }
};

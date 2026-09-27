import { Response } from 'express';
import { AuthRequest } from '../../types/index.js';
import * as settingsService from './settings.service.js';
import { logAuditAction } from '../../middlewares/audit.middleware.js';

export const getCompanySettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const settings = await settingsService.getCompanySettings();
    res.json({ settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erreur lors du chargement des paramètres' });
  }
};

export const updateCompanySettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updated = await settingsService.updateCompanySettings(req.body);

    await logAuditAction(req, 'UPDATE', 'CompanySettings', 'default', {
      updatedFields: Object.keys(req.body),
    });

    res.json({
      message: 'Paramètres d\'entreprise mis à jour avec succès',
      settings: updated,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erreur lors de la mise à jour des paramètres' });
  }
};

export const getDatabaseStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await settingsService.getDatabaseStats();
    res.json({ stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erreur lors de la récupération des statistiques' });
  }
};

export const purgeDatabase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { mode = 'TRANSACTIONAL', confirmation, keepAdminUsers = true } = req.body;

    const result = await settingsService.purgeDatabase({
      mode,
      confirmation,
      keepAdminUsers,
    });

    await logAuditAction(req, 'PURGE_DATABASE', 'System', undefined, {
      mode,
      keepAdminUsers,
      userId: req.user?.userId,
      userEmail: req.user?.email,
    });

    res.json({
      message: 'Base de données purgée avec succès.',
      result,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erreur lors de la purge de la base de données' });
  }
};

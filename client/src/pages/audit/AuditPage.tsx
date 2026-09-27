import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, Search, Filter, Clock, User, Activity } from 'lucide-react';
import api from '../../services/api.js';
import { AuditLog } from '../../types/index.js';

export const AuditPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', selectedAction, selectedEntity],
    queryFn: async () => {
      const params: any = { limit: 100 };
      if (selectedAction) params.action = selectedAction;
      if (selectedEntity) params.entity = selectedEntity;
      const res = await api.get('/audit', { params });
      return res.data;
    },
  });

  const logs = data?.logs as AuditLog[] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {t('nav.audit')} & Journalisation de Sécurité
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Traçabilité immuable de l'ensemble des créations, modifications, approbations et connexions système
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Toutes les actions</option>
          <option value="LOGIN">LOGIN (Connexions)</option>
          <option value="CREATE">CREATE (Créations)</option>
          <option value="UPDATE">UPDATE (Modifications)</option>
          <option value="DELETE">DELETE (Suppressions)</option>
          <option value="START">START (Démarrage interventions)</option>
          <option value="COMPLETE">COMPLETE (Clôture SAV)</option>
          <option value="STATUS_CHANGE">STATUS_CHANGE (Changement statut)</option>
          <option value="RECORD_PAYMENT">RECORD_PAYMENT (Règlements)</option>
        </select>

        <select
          value={selectedEntity}
          onChange={(e) => setSelectedEntity(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Toutes les entités</option>
          <option value="Machine">Machines</option>
          <option value="Client">Clients</option>
          <option value="Intervention">Interventions SAV</option>
          <option value="MaintenanceTicket">Tickets</option>
          <option value="Quote">Devis</option>
          <option value="Invoice">Factures</option>
          <option value="Product">Consommables & Pièces</option>
          <option value="StockBatch">Lots en stock</option>
          <option value="User">Utilisateurs</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Horodatage</th>
                <th className="py-3 px-4">Utilisateur</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entité Cible</th>
                <th className="py-3 px-4">Détails & Modifications</th>
                <th className="py-3 px-4 text-right">Adresse IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Chargement des journaux d'audit...
                  </td>
                </tr>
              ) : logs && logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {log.userEmail || 'Système'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.action === 'CREATE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : log.action === 'DELETE'
                            ? 'bg-rose-50 text-rose-700'
                            : log.action === 'LOGIN'
                            ? 'bg-cyan-50 text-cyan-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{log.entity}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 max-w-md truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Aucun événement d'audit enregistré.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

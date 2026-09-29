import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, Search, Filter, Clock, User, Activity, FileSpreadsheet, Eye } from 'lucide-react';
import api from '../../services/api.js';
import { AuditLog } from '../../types/index.js';
import { Modal } from '../../components/common/Modal.js';

export const AuditPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

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

  const exportCsv = () => {
    if (!logs || logs.length === 0) return;
    const headers = ['Horodatage', 'Utilisateur', 'Action', 'Entite', 'EntityId', 'Details', 'IP'];
    const rows = logs.map(l => [
      `"${new Date(l.createdAt).toLocaleString('fr-FR')}"`,
      `"${l.userEmail || 'Systeme'}"`,
      `"${l.action}"`,
      `"${l.entity}"`,
      `"${l.entityId || ''}"`,
      `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`,
      `"${l.ipAddress || ''}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Audit_Logs_Videojet_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('nav.audit')} & Journalisation de Sécurité
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Traçabilité immuable de l'ensemble des créations, modifications, approbations et connexions système
          </p>
        </div>

        <button
          onClick={exportCsv}
          disabled={logs.length === 0}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Exporter CSV Audit
        </button>
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
                <th className="py-3 px-4">Adresse IP</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
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
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                        title="Inspecter le payload complet de cet événement"
                      >
                        <Eye className="w-3.5 h-3.5 text-videojet-blue" />
                        Inspecter
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Aucun événement d'audit enregistré.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspector Modal */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Inspecteur d'Événement d'Audit de Sécurité"
        maxWidth="lg"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <p className="text-slate-400 text-[11px]">Horodatage officiel</p>
                <p className="font-bold text-slate-800 mt-0.5">{new Date(selectedLog.createdAt).toLocaleString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[11px]">Auteur de l'action</p>
                <p className="font-bold text-slate-800 mt-0.5">{selectedLog.userEmail || 'Système / Automate'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[11px]">Nature de l'action</p>
                <p className="font-bold text-slate-800 mt-0.5">{selectedLog.action} sur {selectedLog.entity}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[11px]">Adresse IP Source</p>
                <p className="font-mono font-bold text-slate-800 mt-0.5">{selectedLog.ipAddress || '127.0.0.1'}</p>
              </div>
              {selectedLog.entityId && (
                <div className="col-span-2">
                  <p className="text-slate-400 text-[11px]">Identifiant Technique (UUID)</p>
                  <p className="font-mono text-cyan-700 mt-0.5">{selectedLog.entityId}</p>
                </div>
              )}
            </div>

            <div>
              <p className="font-bold text-slate-800 mb-1.5">Données transmises & Modifications (Payload JSON)</p>
              <pre className="p-3 bg-slate-900 text-cyan-300 font-mono text-[11px] rounded-xl overflow-x-auto max-h-64">
                {JSON.stringify(selectedLog.details, null, 2) || '{}'}
              </pre>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl font-semibold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

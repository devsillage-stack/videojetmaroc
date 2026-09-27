import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  FileCheck2,
  Shield,
  Clock,
  Calendar,
  Plus,
  CheckCircle,
  Building2,
  Printer,
} from 'lucide-react';
import api from '../../services/api.js';
import { MaintenanceContract, Client } from '../../types/index.js';
import { useCurrency } from '../../contexts/CurrencyContext.js';
import { Modal } from '../../components/common/Modal.js';
import { PermissionGate } from '../../components/common/PermissionGate.js';

export const ContractsPage: React.FC = () => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    contractNumber: '',
    clientId: '',
    type: 'GOLD',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    annualCost: 75000,
    visitsPerYear: 4,
    responseTimeHours: 8,
    includesParts: false,
    includesConsumables: false,
    notes: '',
  });

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const res = await api.get('/contracts');
      return res.data.contracts as MaintenanceContract[];
    },
  });

  const { data: clients } = useQuery({
    queryKey: ['clients-for-contracts'],
    queryFn: async () => {
      const res = await api.get('/clients');
      return res.data.clients as Client[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/contracts', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setIsAddModalOpen(false);
    },
  });

  const recordVisitMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/contracts/${id}/visit`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      annualCost: Number(formData.annualCost),
      visitsPerYear: Number(formData.visitsPerYear),
      responseTimeHours: Number(formData.responseTimeHours),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('nav.contracts')} & Engagements SLA
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Contrats Platinum, Gold, Silver avec visites préventives incluses et astreinte technique
          </p>
        </div>

        <PermissionGate roles={['SUPER_ADMIN', 'ADMIN', 'RESPONSABLE_SAV', 'COMMERCIAL']}>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-videojet-blue hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouveau Contrat de Maintenance
          </button>
        </PermissionGate>
      </div>

      {/* Contracts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            Chargement des contrats...
          </div>
        ) : contracts && contracts.length > 0 ? (
          contracts.map((ctr) => (
            <div
              key={ctr.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {ctr.contractNumber}
                    </span>
                    <h3 className="font-bold text-sm text-slate-800 mt-0.5">
                      {ctr.client.name}
                    </h3>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      ctr.type === 'PLATINUM'
                        ? 'bg-purple-100 text-purple-800'
                        : ctr.type === 'GOLD'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {ctr.type}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5" /> SLA Réponse garantie :
                    </span>
                    <span className="font-bold text-slate-900">{ctr.responseTimeHours}h</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5" /> Échéance annuelle :
                    </span>
                    <span className="font-semibold text-slate-800">
                      {new Date(ctr.endDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  {/* Visits Progress Tracker */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-medium text-slate-600">Visites préventives :</span>
                      <span className="font-bold text-brand-700">
                        {ctr.visitsCompleted} / {ctr.visitsPerYear} effectuées
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-brand-600 h-full rounded-full transition-all"
                        style={{ width: `${Math.min((ctr.visitsCompleted / ctr.visitsPerYear) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {ctr.notes && (
                    <p className="text-[11px] text-slate-500 pt-1 italic">{ctr.notes}</p>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Forfait Annuel</span>
                  <span className="font-bold text-sm text-slate-900">
                    {formatPrice(ctr.annualCost, ctr.currency)}
                  </span>
                </div>

                <PermissionGate roles={['SUPER_ADMIN', 'ADMIN', 'RESPONSABLE_SAV', 'TECHNICIEN_SAV']}>
                  <button
                    onClick={() => recordVisitMutation.mutate(ctr.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    + 1 Visite
                  </button>
                </PermissionGate>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400">
            Aucun contrat de maintenance configuré.
          </div>
        )}
      </div>

      {/* Add Contract Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Créer un nouveau contrat de maintenance industrielle"
        subtitle="Définissez les SLA, le forfait annuel et le nombre de visites préventives"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Numéro du contrat *
              </label>
              <input
                type="text"
                value={formData.contractNumber}
                onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                placeholder="Ex: CTR-DAN-2024-GOLD"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Client Industriel *
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              >
                <option value="">Sélectionner un client...</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Formule de Service *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none font-bold"
              >
                <option value="PLATINUM">PLATINUM (24/7 - Pièces incluses - SLA 4h)</option>
                <option value="GOLD">GOLD (Visites préventives - SLA 8h)</option>
                <option value="SILVER">SILVER (SLA 24h)</option>
                <option value="GARANTIE">Garantie Constructeur Videojet</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                SLA Réponse d'intervention (heures) *
              </label>
              <input
                type="number"
                value={formData.responseTimeHours}
                onChange={(e) => setFormData({ ...formData, responseTimeHours: parseInt(e.target.value, 10) || 8 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Forfait Annuel (MAD) *
              </label>
              <input
                type="number"
                value={formData.annualCost}
                onChange={(e) => setFormData({ ...formData, annualCost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nombre de visites préventives annuelles *
              </label>
              <input
                type="number"
                value={formData.visitsPerYear}
                onChange={(e) => setFormData({ ...formData, visitsPerYear: parseInt(e.target.value, 10) || 4 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 font-bold bg-videojet-blue text-white hover:bg-slate-800 rounded-xl shadow-xs"
            >
              {createMutation.isPending ? 'Enregistrement...' : 'Créer le contrat de service'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Kanban,
  Plus,
  ArrowRight,
  ArrowLeft,
  Building2,
  User,
  Calendar,
  CheckCircle2,
  FileText,
  ExternalLink,
} from 'lucide-react';
import api from '../../services/api.js';
import { Opportunity, Client } from '../../types/index.js';
import { useCurrency } from '../../contexts/CurrencyContext.js';
import { Modal } from '../../components/common/Modal.js';

const STAGES = [
  { id: 'QUALIFICATION', label: '1. Qualification', color: 'border-slate-300' },
  { id: 'DEMO_ESSAI', label: '2. Démo / Essai Ligne', color: 'border-blue-400' },
  { id: 'DEVIS_ENVOYE', label: '3. Devis Envoyé', color: 'border-cyan-400' },
  { id: 'NEGOCIATION', label: '4. Négociation', color: 'border-amber-400' },
  { id: 'GAGNE', label: '5. Gagné (Deal Closed)', color: 'border-emerald-500' },
];

export const CRMPipelinePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    clientId: '',
    expectedValue: 150000,
    probabilityPercent: 50,
    stage: 'QUALIFICATION',
    notes: '',
  });

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const res = await api.get('/opportunities');
      return res.data.opportunities as Opportunity[];
    },
  });

  const { data: clients } = useQuery({
    queryKey: ['clients-for-crm'],
    queryFn: async () => {
      const res = await api.get('/clients');
      return res.data.clients as Client[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/opportunities', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      setIsAddModalOpen(false);
      setFormData({
        title: '',
        clientId: '',
        expectedValue: 150000,
        probabilityPercent: 50,
        stage: 'QUALIFICATION',
        notes: '',
      });
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const res = await api.put(`/opportunities/${id}/stage`, { stage });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      expectedValue: Number(formData.expectedValue),
      probabilityPercent: Number(formData.probabilityPercent),
    });
  };

  const moveStage = (opp: Opportunity, direction: 'forward' | 'backward') => {
    const currentIndex = STAGES.findIndex((s) => s.id === opp.stage);
    const newIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < STAGES.length) {
      updateStageMutation.mutate({ id: opp.id, stage: STAGES[newIndex].id });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Pipeline Commercial & Opportunités
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Suivi des affaires machines neuves, essais sur ligne de conditionnement et projets de sérialisation
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-videojet-blue hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvelle Opportunité
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto min-h-[600px] pb-4">
        {STAGES.map((col) => {
          const colOpps = opportunities?.filter((o) => o.stage === col.id) || [];
          const colTotal = colOpps.reduce((acc, curr) => acc + curr.expectedValue, 0);

          return (
            <div
              key={col.id}
              className="bg-slate-100/70 p-3 rounded-2xl border border-slate-200 flex flex-col min-w-[240px]"
            >
              {/* Column Header */}
              <div className="pb-3 border-b border-slate-200 mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs text-slate-800">{col.label}</h3>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {formatPrice(colTotal)}
                  </span>
                </div>
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                  {colOpps.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {colOpps.map((opp) => (
                  <div
                    key={opp.id}
                    className={`bg-white p-3.5 rounded-xl border-l-4 ${col.color} border border-slate-200 shadow-2xs hover:shadow-xs transition-all space-y-2`}
                  >
                    <div className="font-bold text-xs text-slate-900 leading-snug">
                      {opp.title}
                    </div>

                    <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{opp.client.name}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">
                        {formatPrice(opp.expectedValue, opp.currency)}
                      </span>
                      <span className="text-[10px] font-semibold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full">
                        {opp.probabilityPercent}%
                      </span>
                    </div>

                    {/* Move buttons & Quick Actions */}
                    <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveStage(opp, 'backward')}
                          disabled={opp.stage === 'QUALIFICATION'}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                          title="Reculer d'étape"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveStage(opp, 'forward')}
                          disabled={opp.stage === 'GAGNE'}
                          className="p-1 text-slate-400 hover:text-cyan-600 disabled:opacity-20 cursor-pointer"
                          title="Avancer d'étape"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/quotes?new=true&clientId=${opp.clientId}`)}
                          className="inline-flex items-center gap-1 py-1 px-1.5 text-[10px] font-semibold bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-md transition-colors cursor-pointer"
                          title="Créer un devis pour cette opportunité"
                        >
                          <FileText className="w-3 h-3 text-cyan-600" />
                          <span>Devis</span>
                        </button>
                        <button
                          onClick={() => navigate(`/clients/${opp.clientId}/360`)}
                          className="inline-flex items-center p-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors cursor-pointer"
                          title="Ouvrir la vue Client 360°"
                        >
                          <ExternalLink className="w-3 h-3 text-slate-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {colOpps.length === 0 && (
                  <div className="h-28 flex items-center justify-center text-slate-400 text-xs italic">
                    Aucune opportunité
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Opportunity Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Créer une opportunité commerciale"
        subtitle="Ajoutez une affaire au pipeline commercial Videojet Maroc"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Titre de l'opportunité *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Projet 2x Laser 3640 Embouteillage"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Client ou Prospect *
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Valeur estimée (MAD) *
              </label>
              <input
                type="number"
                value={formData.expectedValue}
                onChange={(e) => setFormData({ ...formData, expectedValue: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Probabilité (%) *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.probabilityPercent}
                onChange={(e) => setFormData({ ...formData, probabilityPercent: parseInt(e.target.value, 10) || 50 })}
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
              disabled={createMutation.isPending || !formData.clientId}
              className="px-5 py-2 font-bold bg-videojet-blue text-white hover:bg-slate-800 rounded-xl shadow-xs"
            >
              {createMutation.isPending ? 'Enregistrement...' : 'Ajouter au pipeline'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

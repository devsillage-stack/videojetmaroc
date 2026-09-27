import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ClipboardCheck,
  Plus,
  Search,
  Factory,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Calculator,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Thermometer,
  Zap,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal.js';
import { useAuth } from '../../contexts/AuthContext.js';

export const AuditsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAuditForDetails, setSelectedAuditForDetails] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    clientId: '',
    packagingSubstrate: '',
    unitsPerHour: 24000,
    lineSpeedMpm: 35,
    dustLevel: 'Modéré',
    washdownExposure: false,
    messageLinesCount: 2,
    existingMachineBrand: '',
    existingMachineModel: '',
    existingMachineAgeYears: 5,
    currentPainPoints: '',
    currentConsumableCostPerYear: 45000,
    currentDowntimeHoursPerYear: 35,
    notes: '',
  });

  // Fetch audits
  const { data: auditsData, isLoading } = useQuery({
    queryKey: ['audits'],
    queryFn: async () => {
      const res = await axios.get('/api/audits', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.audits;
    },
  });

  // Fetch clients for dropdown
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await axios.get('/api/clients', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.clients;
    },
  });

  // Create audit mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axios.post('/api/audits', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      setIsModalOpen(false);
      setSelectedAuditForDetails(data.audit);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const audits = auditsData || [];
  const filteredAudits = audits.filter(
    (a: any) =>
      a.auditNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.packagingSubstrate?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-cyan-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Audits Industriels de Lignes & Recommandations
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Analyse des contraintes terrain de ligne (cadence, substrat, lavage IP66) et moteur de prescription technique Videojet
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-videojet-blue text-white text-xs font-semibold hover:bg-slate-800 transition-all shadow-sm shadow-blue-900/20"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvel Audit Industriel</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Audits Réalisés</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{audits.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Solutions Prescrites</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">
              {audits.reduce((acc: number, a: any) => acc + (a.recommendations?.length || 0), 0)}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Lignes Sévères (IP66)</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">
              {audits.filter((a: any) => a.washdownExposure).length}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Études TCO Liées</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">
              {audits.reduce((acc: number, a: any) => acc + (a.tcoCalculations?.length || 0), 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par n° d'audit, client, substrat (verre, film, carton)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Audits Cards List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Chargement des audits industriels...</div>
      ) : filteredAudits.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
          <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600">Aucun audit industriel trouvé</p>
          <p className="text-[11px] text-slate-400 mt-1">Cliquez sur "Nouvel Audit Industriel" pour enregistrer les paramètres d'une ligne.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredAudits.map((audit: any) => {
            const recommendation = audit.recommendations?.[0];
            return (
              <div
                key={audit.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 hover:border-cyan-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded-lg">
                        {audit.auditNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{audit.client?.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(audit.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  {/* Line info */}
                  <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px] text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Substrat</p>
                      <p className="font-medium text-slate-800 truncate">{audit.packagingSubstrate}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Cadence</p>
                      <p className="font-medium text-slate-800">{audit.unitsPerHour ? `${audit.unitsPerHour.toLocaleString()} p/h` : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Ambiance</p>
                      <p className="font-medium text-slate-800">
                        {audit.washdownExposure ? 'Lavage IP66' : audit.dustLevel || 'Standard'}
                      </p>
                    </div>
                  </div>

                  {/* Existing machine pain points */}
                  {audit.existingMachineBrand && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-[11px] text-amber-900 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Machine actuelle : {audit.existingMachineBrand} {audit.existingMachineModel} ({audit.existingMachineAgeYears || '?'} ans)</span>
                        <p className="text-[10px] text-amber-800/80 mt-0.5">{audit.currentPainPoints || 'Pertes de disponibilité constatées.'}</p>
                      </div>
                    </div>
                  )}

                  {/* Technical recommendation card */}
                  {recommendation && (
                    <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-br from-cyan-900 to-slate-900 text-white shadow-sm">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-cyan-400" />
                          <span className="text-[10px] tracking-wider uppercase font-bold text-cyan-300">
                            Recommandation Videojet
                          </span>
                        </div>
                        <span className="text-[10px] font-bold bg-cyan-400/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-400/30">
                          {recommendation.confidenceScore}% pertinence
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white">
                        {recommendation.recommendedModel?.name || `Technologie ${recommendation.recommendedTech}`}
                      </p>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        {recommendation.justification}
                      </p>
                      {recommendation.suggestedConsumable && (
                        <p className="text-[10px] text-cyan-200 mt-2 font-mono bg-white/5 p-1.5 rounded-lg border border-white/10">
                          Consommable : {recommendation.suggestedConsumable}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedAuditForDetails(audit)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Voir la fiche complète
                  </button>

                  <button
                    onClick={() => navigate(`/tco?auditId=${audit.id}`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 text-cyan-700 hover:bg-cyan-100 text-xs font-semibold transition-colors"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Calculer ROI / TCO</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal New Audit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouvel Audit Industriel de Ligne"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Client Industriel *</label>
              <select
                required
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
              >
                <option value="">Sélectionner un client...</option>
                {clientsData?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Substrat d'Emballage *</label>
              <input
                required
                type="text"
                placeholder="Ex: Pots PS, Bouteilles Verre, Film PE..."
                value={formData.packagingSubstrate}
                onChange={(e) => setFormData({ ...formData, packagingSubstrate: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cadence (pièces/h)</label>
              <input
                type="number"
                value={formData.unitsPerHour}
                onChange={(e) => setFormData({ ...formData, unitsPerHour: Number(e.target.value) })}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vitesse (m/min)</label>
              <input
                type="number"
                value={formData.lineSpeedMpm}
                onChange={(e) => setFormData({ ...formData, lineSpeedMpm: Number(e.target.value) })}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Poussière</label>
              <select
                value={formData.dustLevel}
                onChange={(e) => setFormData({ ...formData, dustLevel: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
              >
                <option value="Faible">Faible (Standard)</option>
                <option value="Modéré">Modéré</option>
                <option value="Sévère">Sévère / Poussiéreux (Ciment, Farine, Sucre)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              id="washdown"
              checked={formData.washdownExposure}
              onChange={(e) => setFormData({ ...formData, washdownExposure: e.target.checked })}
              className="w-4 h-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500"
            />
            <label htmlFor="washdown" className="text-xs text-slate-700 font-medium">
              Lavage à grande eau / Nettoyage haute pression de la ligne (Indice IP66 Requis)
            </label>
          </div>

          {/* Existing Machine Info */}
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
            <p className="text-xs font-bold text-slate-800">Équipement Concurrent Existant sur Ligne</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Marque (Markem, Domino...)"
                value={formData.existingMachineBrand}
                onChange={(e) => setFormData({ ...formData, existingMachineBrand: e.target.value })}
                className="text-xs rounded-lg border border-slate-200 p-2"
              />
              <input
                type="text"
                placeholder="Modèle (ex: 9450)"
                value={formData.existingMachineModel}
                onChange={(e) => setFormData({ ...formData, existingMachineModel: e.target.value })}
                className="text-xs rounded-lg border border-slate-200 p-2"
              />
              <input
                type="number"
                placeholder="Âge en années"
                value={formData.existingMachineAgeYears}
                onChange={(e) => setFormData({ ...formData, existingMachineAgeYears: Number(e.target.value) })}
                className="text-xs rounded-lg border border-slate-200 p-2"
              />
            </div>
            <textarea
              placeholder="Problèmes constatés (bouchages de buse, pannes, consommation solvant...)"
              value={formData.currentPainPoints}
              onChange={(e) => setFormData({ ...formData, currentPainPoints: e.target.value })}
              rows={2}
              className="w-full text-xs rounded-lg border border-slate-200 p-2"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 text-xs font-semibold text-white bg-videojet-blue hover:bg-slate-800 rounded-xl shadow-sm"
            >
              {createMutation.isPending ? 'Analyse en cours...' : 'Générer la Recommandation Videojet'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal View Audit Details */}
      {selectedAuditForDetails && (
        <Modal
          isOpen={Boolean(selectedAuditForDetails)}
          onClose={() => setSelectedAuditForDetails(null)}
          title={`Audit Industriel ${selectedAuditForDetails.auditNumber}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-900">{selectedAuditForDetails.client?.name}</p>
              <p className="text-slate-500 mt-0.5">
                Substrat : <span className="font-semibold text-slate-800">{selectedAuditForDetails.packagingSubstrate}</span>
              </p>
              <p className="text-slate-500">
                Cadence : <span className="font-semibold text-slate-800">{selectedAuditForDetails.unitsPerHour?.toLocaleString()} p/h</span>
              </p>
            </div>

            {selectedAuditForDetails.recommendations?.[0] && (
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>Prescription Technique : {selectedAuditForDetails.recommendations[0].recommendedModel?.name || selectedAuditForDetails.recommendations[0].recommendedTech}</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {selectedAuditForDetails.recommendations[0].justification}
                </p>
                <p className="text-cyan-200 font-mono text-[11px] pt-1">
                  Encre/Consommable : {selectedAuditForDetails.recommendations[0].suggestedConsumable}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  const id = selectedAuditForDetails.id;
                  setSelectedAuditForDetails(null);
                  navigate(`/tco?auditId=${id}`);
                }}
                className="px-4 py-2 bg-cyan-600 text-white font-semibold rounded-xl text-xs hover:bg-cyan-700"
              >
                Lancer le Simulateur TCO / ROI pour cet Audit
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

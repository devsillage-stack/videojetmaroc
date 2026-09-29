import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Building2,
  ArrowLeft,
  Coins,
  Receipt,
  FileSpreadsheet,
  Printer,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  Plus,
  CheckCircle2,
  Wrench,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { useCurrency } from '../../contexts/CurrencyContext.js';
import { Modal } from '../../components/common/Modal.js';

export const Customer360Page: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { formatMoney } = useCurrency();

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState('VISITE');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDesc, setActivityDesc] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['customer360', id],
    queryFn: async () => {
      const res = await axios.get(`/api/fleet360/clients/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: Boolean(id),
  });

  const addActivityMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(
        `/api/fleet360/clients/${id}/activities`,
        { type: activityType, title: activityTitle, description: activityDesc },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer360', id] });
      setIsActivityModalOpen(false);
      setActivityTitle('');
      setActivityDesc('');
    },
  });

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400 text-xs">Chargement de la vue Client 360°...</div>;
  }

  if (!data?.client) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-xs font-semibold text-slate-600">Client introuvable</p>
        <button
          onClick={() => navigate('/clients')}
          className="mt-3 px-4 py-2 bg-slate-100 text-xs font-semibold rounded-xl text-slate-700"
        >
          Retour à la liste des clients
        </button>
      </div>
    );
  }

  const { client, financialSummary, fleetSummary } = data;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/clients')}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Customer 360° : {client.name}
              </h1>
              <span className="font-mono text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200">
                {client.code}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Secteur : <span className="font-semibold text-slate-800">{client.industrySector}</span> • Ville : {client.city} • ICE : {client.ice || 'Non renseigné'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate(`/quotes?new=true&clientId=${client.id}`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Coins className="w-4 h-4" />
            <span>Nouveau Devis</span>
          </button>

          <button
            onClick={() => navigate(`/maintenance?tab=tickets&new=true&clientId=${client.id}`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Wrench className="w-4 h-4" />
            <span>Ticket SAV</span>
          </button>

          <button
            onClick={() => setIsActivityModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-videojet-blue text-white text-xs font-semibold hover:bg-slate-800 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter Interaction</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Total Invoiced, Balance Due, Fleet Operational Rate, Audits */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Facturé</span>
            <Receipt className="w-5 h-5 text-cyan-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">
            {formatMoney(financialSummary.totalBilled)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Chiffre d'affaires cumulé</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Solde Dû</span>
            <Coins className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-amber-600 mt-2">
            {formatMoney(financialSummary.balanceDue)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Encaissements en attente</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Parc Machines</span>
            <Printer className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">
            {fleetSummary.totalMachines} machines ({fleetSummary.fleetAvailabilityRate}% actives)
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            {fleetSummary.operationalMachines} opérationnelles
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Devis en Négociation</span>
            <FileSpreadsheet className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-xl font-bold text-purple-700 mt-2">
            {formatMoney(financialSummary.pendingQuotesValue)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Potentiel commercial en cours</p>
        </div>
      </div>

      {/* Main Grid: Installed Fleet & Sites vs Timeline Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Installed Fleet */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <h2 className="font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <span>Parc Machines Installé chez {client.name}</span>
              <span className="text-xs font-normal text-slate-400 font-mono">
                {client.machines?.length || 0} machine(s)
              </span>
            </h2>

            {client.machines?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Aucune machine enregistrée pour ce client.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {client.machines?.map((m: any) => (
                  <div key={m.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-700">{m.serialNumber}</span>
                        <span className="font-bold text-slate-800">{m.model?.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Heures : {Math.round(m.totalOperatingHours)} h • Installée le {new Date(m.installDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>

                    <button
                      onClick={() => navigate(`/machines/${m.id}/360`)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                    >
                      <span>Machine 360°</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sites & Production Lines */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <h2 className="font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3 mb-4">
              Sites Industriels & Lignes de Conditionnement
            </h2>
            <div className="space-y-3">
              {client.sites?.map((site: any) => (
                <div key={site.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <MapPin className="w-4 h-4 text-cyan-600" />
                    <span>{site.name} ({site.city})</span>
                  </div>
                  <div className="mt-2 pl-6 space-y-1">
                    {site.productionLines?.map((line: any) => (
                      <p key={line.id} className="text-slate-600 text-[11px]">
                        • <span className="font-semibold">{line.name}</span> {line.productType ? `(${line.productType})` : ''}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Timeline Activities */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <h2 className="font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <span>Journal & Timeline des Activités</span>
              <Clock className="w-4 h-4 text-slate-400" />
            </h2>

            {client.activities?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Aucune interaction enregistrée.</p>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {client.activities?.map((act: any) => (
                  <div key={act.id} className="relative text-xs space-y-1">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-cyan-600 ring-4 ring-white" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{act.title}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(act.performedAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {act.description && (
                      <p className="text-[11px] text-slate-600 leading-relaxed">{act.description}</p>
                    )}
                    <p className="text-[10px] text-cyan-700 font-medium">
                      Par : {act.user ? `${act.user.firstName} ${act.user.lastName}` : 'Commercial'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Add Activity */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title="Ajouter une Interaction Commerciale ou Technique"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addActivityMutation.mutate();
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Type d'interaction</label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
            >
              <option value="VISITE">Visite sur site / usine</option>
              <option value="REUNION">Réunion commerciale / technique</option>
              <option value="APPEL">Appel téléphonique</option>
              <option value="EMAIL">Email / Correspondance</option>
              <option value="AUDIT">Audit de ligne</option>
              <option value="NOTE">Note interne</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Objet de l'interaction *</label>
            <input
              required
              type="text"
              placeholder="Ex: Présentation de la Videojet 1880 pour la ligne yaourt"
              value={activityTitle}
              onChange={(e) => setActivityTitle(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Compte-rendu & Détails</label>
            <textarea
              rows={3}
              placeholder="Détails de l'échange, prochaines étapes, points d'attention..."
              value={activityDesc}
              onChange={(e) => setActivityDesc(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsActivityModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={addActivityMutation.isPending}
              className="px-5 py-2 text-xs font-semibold text-white bg-videojet-blue hover:bg-slate-800 rounded-xl shadow-sm"
            >
              {addActivityMutation.isPending ? 'Enregistrement...' : 'Ajouter à la Timeline'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

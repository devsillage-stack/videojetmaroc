import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Printer,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Wrench,
  AlertTriangle,
  QrCode,
  CheckCircle2,
  Calendar,
  Building2,
  FileCheck2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { QRCodeModal } from '../../components/common/QRCodeModal.js';

export const Machine360Page: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['machine360', id],
    queryFn: async () => {
      const res = await axios.get(`/api/fleet360/machines/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: Boolean(id),
  });

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400 text-xs">Chargement de la vue Machine 360°...</div>;
  }

  if (!data?.machine) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-xs font-semibold text-slate-600">Machine introuvable</p>
        <button
          onClick={() => navigate('/machines')}
          className="mt-3 px-4 py-2 bg-slate-100 text-xs font-semibold rounded-xl text-slate-700"
        >
          Retour au parc machines
        </button>
      </div>
    );
  }

  const { machine, metrics, contract } = data;

  return (
    <div className="space-y-6">
      {/* Top Bar with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/machines')}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Machine 360° : {machine.model?.name}
              </h1>
              <span className="font-mono text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200">
                {machine.serialNumber}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Client : <span className="font-semibold text-slate-800">{machine.client?.name}</span> • Site : {machine.site?.name || 'Usine Principale'} • Ligne : {machine.line?.name || 'Standard'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsQrModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-videojet-blue text-white text-xs font-semibold hover:bg-slate-800 shadow-sm"
        >
          <QrCode className="w-4 h-4" />
          <span>Afficher / Imprimer QR Code</span>
        </button>
      </div>

      {/* KPI Cards: Warranty, Replacement Score, Operating Hours, Tickets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Warranty Status Card */}
        <div className={`p-4 rounded-2xl border shadow-sm ${
          metrics.isUnderWarranty ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Garantie Constructeur</span>
            {metrics.isUnderWarranty ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            )}
          </div>
          <p className={`text-xl font-black mt-2 ${metrics.isUnderWarranty ? 'text-emerald-700' : 'text-rose-700'}`}>
            {metrics.isUnderWarranty ? 'Garantie Active' : 'Garantie Expirée'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {metrics.isUnderWarranty
              ? `${metrics.warrantyDaysRemaining} jours restants`
              : 'Sous contrat de service recommandé'}
          </p>
        </div>

        {/* Replacement Risk Score Card */}
        <div className={`p-4 rounded-2xl border shadow-sm ${
          metrics.replacementScore >= 60 ? 'bg-amber-50/70 border-amber-300' : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Score de Remplacement</span>
            <AlertTriangle className={`w-5 h-5 ${metrics.replacementScore >= 60 ? 'text-amber-600' : 'text-slate-400'}`} />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{metrics.replacementScore} / 100</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {metrics.isReplacementRecommended ? 'Alerte : Opportunité de remplacement' : 'Parc sain & performant'}
          </p>
        </div>

        {/* Operating Hours */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Compteur Horaire</span>
            <Clock className="w-5 h-5 text-cyan-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {Math.round(machine.totalOperatingHours).toLocaleString()} h
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Âge : {metrics.ageYears} ans</p>
        </div>

        {/* Interventions count */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Interventions SAV</span>
            <Wrench className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{metrics.totalInterventionsCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics.criticalBreakdownsCount} pannes critiques enregistrées
          </p>
        </div>
      </div>

      {/* Main Grid: Machine Specs & Contract vs Interventions History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Identity & Contract */}
        <div className="lg:col-span-5 space-y-5">
          {/* Technical Specs Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3 text-xs">
            <h2 className="font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              Caractéristiques Techniques
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Technologie</span>
                <span className="font-semibold text-slate-800">{machine.model?.family}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Vitesse maximale</span>
                <span className="font-semibold text-slate-800">{machine.model?.maxSpeed || '334 m/min'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Indice de protection</span>
                <span className="font-semibold text-slate-800">{machine.model?.ipRating || 'IP66'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Date d'installation</span>
                <span className="font-semibold text-slate-800">
                  {new Date(machine.installDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>

          {/* Maintenance Contract Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3 text-xs">
            <h2 className="font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              Contrat de Service & SLA
            </h2>
            {contract ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-cyan-700">{contract.contractNumber}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Formule {contract.type}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Temps de réponse garanti (SLA)</span>
                  <span className="font-bold text-slate-900">{contract.responseTimeHours}h max</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Visites préventives</span>
                  <span className="font-semibold text-slate-800">
                    {contract.visitsCompleted} / {contract.visitsPerYear} effectuées
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-slate-400">Aucun contrat de maintenance actif pour ce client.</p>
            )}
          </div>
        </div>

        {/* Right Column: Interventions History with Digital Signatures */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <h2 className="font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <span>Historique des Interventions SAV</span>
              <span className="text-xs font-normal text-slate-400 font-mono">
                {machine.interventions?.length || 0} intervention(s)
              </span>
            </h2>

            {machine.interventions?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Aucune intervention enregistrée.</p>
            ) : (
              <div className="space-y-3">
                {machine.interventions?.map((inv: any) => (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 hover:border-cyan-500/40 transition-all text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">{inv.interventionNumber}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                          {inv.type}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(inv.scheduledDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    <p className="text-slate-600 text-[11px]">
                      <span className="font-semibold text-slate-800">Travaux effectués :</span> {inv.workDone || inv.diagnosis || 'Maintenance standard'}
                    </p>

                    {inv.customerSignature && (
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          Signé par le client : {inv.customerSignerName || 'Responsable Ligne'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {isQrModalOpen && (
        <QRCodeModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          machine={machine}
        />
      )}
    </div>
  );
};

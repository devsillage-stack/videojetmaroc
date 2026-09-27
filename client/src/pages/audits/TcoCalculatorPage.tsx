import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Calculator,
  TrendingDown,
  Clock,
  Coins,
  ShieldCheck,
  AlertCircle,
  FileCheck2,
  Sparkles,
  ArrowRight,
  Printer,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext.js';
import { useCurrency } from '../../contexts/CurrencyContext.js';

export const TcoCalculatorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { formatMoney } = useCurrency();

  const auditIdParam = searchParams.get('auditId');

  // Input states
  const [calculationName, setCalculationName] = useState('Simulation TCO Ligne Industrielle');
  const [existingConsumableCost, setExistingConsumableCost] = useState(52000);
  const [existingMaintenanceCost, setExistingMaintenanceCost] = useState(38000);
  const [existingDowntimeHours, setExistingDowntimeHours] = useState(62);
  const [hourlyDowntimeCost, setHourlyDowntimeCost] = useState(1200);

  const [equipmentPrice, setEquipmentPrice] = useState(128000);
  const [installationPrice, setInstallationPrice] = useState(8500);
  const [videojetConsumableCost, setVideojetConsumableCost] = useState(36000);
  const [videojetMaintenanceCost, setVideojetMaintenanceCost] = useState(18000);
  const [annualUnits, setAnnualUnits] = useState(10000000);

  // Fetch audit if provided in query param
  const { data: auditData } = useQuery({
    queryKey: ['audit', auditIdParam],
    queryFn: async () => {
      if (!auditIdParam) return null;
      const res = await axios.get(`/api/audits/${auditIdParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.audit;
    },
    enabled: Boolean(auditIdParam),
  });

  useEffect(() => {
    if (auditData) {
      setCalculationName(`Étude TCO - ${auditData.client?.name} (${auditData.auditNumber})`);
      if (auditData.currentConsumableCostPerYear) {
        setExistingConsumableCost(auditData.currentConsumableCostPerYear);
        setVideojetConsumableCost(Math.round(auditData.currentConsumableCostPerYear * 0.7)); // 30% savings
      }
      if (auditData.currentDowntimeHoursPerYear) {
        setExistingDowntimeHours(auditData.currentDowntimeHoursPerYear);
      }
    }
  }, [auditData]);

  // Financial calculations
  const existingDowntimeLosses = existingDowntimeHours * hourlyDowntimeCost;
  const totalExistingAnnualCost = existingConsumableCost + existingMaintenanceCost + existingDowntimeLosses;

  const totalVideojetFirstYear = equipmentPrice + installationPrice + videojetConsumableCost + videojetMaintenanceCost;
  const totalVideojetSubsequentAnnual = videojetConsumableCost + videojetMaintenanceCost;

  const annualSavings = totalExistingAnnualCost - totalVideojetSubsequentAnnual;
  const initialInvestment = equipmentPrice + installationPrice;
  const paybackMonths = annualSavings > 0 ? (initialInvestment / annualSavings) * 12 : 999;

  const costPerUnitExisting = annualUnits > 0 ? totalExistingAnnualCost / annualUnits : 0;
  const costPerUnitVideojet = annualUnits > 0 ? totalVideojetSubsequentAnnual / annualUnits : 0;

  // Chart data
  const chartData = [
    {
      category: 'Consommables',
      'Solution Actuelle': existingConsumableCost,
      'Solution Videojet': videojetConsumableCost,
    },
    {
      category: 'Maintenance & Pièces',
      'Solution Actuelle': existingMaintenanceCost,
      'Solution Videojet': videojetMaintenanceCost,
    },
    {
      category: 'Arrêts de Ligne',
      'Solution Actuelle': existingDowntimeLosses,
      'Solution Videojet': 0, // CleanFlow eliminates downtime
    },
    {
      category: 'Coût Annuel Total',
      'Solution Actuelle': totalExistingAnnualCost,
      'Solution Videojet': totalVideojetSubsequentAnnual,
    },
  ];

  // Save TCO mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        calculationName,
        existingAnnualConsumableCost: existingConsumableCost,
        existingAnnualMaintenanceCost: existingMaintenanceCost,
        existingAnnualDowntimeHours: existingDowntimeHours,
        hourlyDowntimeCost,
        equipmentInvestmentPrice: equipmentPrice,
        installationAndTrainingPrice: installationPrice,
        videojetAnnualConsumableCost: videojetConsumableCost,
        videojetAnnualMaintenanceCost: videojetMaintenanceCost,
        annualUnitsProduced: annualUnits,
      };

      const url = auditIdParam ? `/api/audits/${auditIdParam}/tco` : `/api/audits`;
      const res = await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: () => {
      alert('Étude TCO enregistrée avec succès dans le dossier client !');
      navigate('/audits');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-6 h-6 text-cyan-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Simulateur ROI & TCO Industriel Videojet
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Comparatif financier complet : Solution actuelle en place vs Nouvelle technologie Videojet
          </p>
        </div>

        <div className="flex items-center gap-2">
          {auditData && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200">
              Audit lié : {auditData.auditNumber} ({auditData.client?.name})
            </span>
          )}
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-videojet-blue text-white text-xs font-semibold hover:bg-slate-800 transition-all shadow-sm shadow-blue-900/20"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>{saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer l\'Étude TCO'}</span>
          </button>
        </div>
      </div>

      {/* Mandatory Legal Disclaimer Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
        <p className="text-xs font-medium">
          <span className="font-bold">Avertissement méthodologique :</span> Estimation indicative basée sur les paramètres de production et coûts saisis. Ne constitue pas un engagement contractuel ferme de performance ou d'économie.
        </p>
      </div>

      {/* Main KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Économie Annuelle</span>
            <TrendingDown className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{formatMoney(annualSavings)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Économie opérationnelle nette / an</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Délai Payback</span>
            <Clock className="w-5 h-5 text-cyan-600" />
          </div>
          <p className="text-2xl font-black text-cyan-600 mt-2">
            {paybackMonths > 0 && paybackMonths < 100 ? `${Math.round(paybackMonths * 10) / 10} mois` : 'N/A'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Retour sur investissement matériel</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Coût / Produit Actuel</span>
            <Coins className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">
            {(costPerUnitExisting * 100).toFixed(3)} cts
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Centimes MAD par produit marqué</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Coût / Produit Videojet</span>
            <Sparkles className="w-5 h-5 text-cyan-500" />
          </div>
          <p className="text-2xl font-black text-cyan-700 mt-2">
            {(costPerUnitVideojet * 100).toFixed(3)} cts
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Gains de {Math.round(((costPerUnitExisting - costPerUnitVideojet) / (costPerUnitExisting || 1)) * 100)}% par marquage
          </p>
        </div>
      </div>

      {/* Inputs vs Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Columns */}
        <div className="lg:col-span-6 space-y-4">
          {/* Box 1: Existing Situation */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                1. Situation & Coûts Actuels (Machine en Place)
              </span>
              <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                {formatMoney(totalExistingAnnualCost)} / an
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Consommables actuels (Encres + Solvants / an)</span>
                  <span className="font-semibold text-slate-900">{formatMoney(existingConsumableCost)}</span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="150000"
                  step="2000"
                  value={existingConsumableCost}
                  onChange={(e) => setExistingConsumableCost(Number(e.target.value))}
                  className="w-full accent-rose-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Maintenance préventive & Pièces d'usure / an</span>
                  <span className="font-semibold text-slate-900">{formatMoney(existingMaintenanceCost)}</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="100000"
                  step="2000"
                  value={existingMaintenanceCost}
                  onChange={(e) => setExistingMaintenanceCost(Number(e.target.value))}
                  className="w-full accent-rose-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Heures d'arrêt de ligne / an</label>
                  <input
                    type="number"
                    value={existingDowntimeHours}
                    onChange={(e) => setExistingDowntimeHours(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2 font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Coût horaire d'arrêt (MAD/h)</label>
                  <input
                    type="number"
                    value={hourlyDowntimeCost}
                    onChange={(e) => setHourlyDowntimeCost(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2 font-mono font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Box 2: Videojet Proposed Solution */}
          <div className="p-5 rounded-2xl bg-white border border-cyan-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-cyan-100 pb-2.5">
              <span className="text-xs font-bold text-cyan-900 uppercase tracking-wide">
                2. Nouvelle Solution Videojet (Recommandée)
              </span>
              <span className="text-xs font-mono font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md">
                {formatMoney(totalVideojetSubsequentAnnual)} / an
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Investissement Imprimante</label>
                <input
                  type="number"
                  value={equipmentPrice}
                  onChange={(e) => setEquipmentPrice(Number(e.target.value))}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2 font-mono font-semibold text-cyan-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Installation & Formation</label>
                <input
                  type="number"
                  value={installationPrice}
                  onChange={(e) => setInstallationPrice(Number(e.target.value))}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2 font-mono font-semibold"
                />
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Consommables Videojet optimisés / an (Make-up réduit)</span>
                  <span className="font-semibold text-cyan-700">{formatMoney(videojetConsumableCost)}</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="120000"
                  step="2000"
                  value={videojetConsumableCost}
                  onChange={(e) => setVideojetConsumableCost(Number(e.target.value))}
                  className="w-full accent-cyan-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Contrat de Maintenance Videojet SLA Platinum</span>
                  <span className="font-semibold text-cyan-700">{formatMoney(videojetMaintenanceCost)}</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="60000"
                  step="1000"
                  value={videojetMaintenanceCost}
                  onChange={(e) => setVideojetMaintenanceCost(Number(e.target.value))}
                  className="w-full accent-cyan-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Recharts Visualizations */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1">
                Comparatif Graphique des Coûts d'Exploitation Annuels
              </h2>
              <p className="text-[11px] text-slate-400 mb-4">
                Impact du système CleanFlow™ anti-arrêt et de la réduction de solvant Videojet
              </p>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip
                      formatter={(value: any) => [`${Number(value).toLocaleString()} MAD`, '']}
                      contentStyle={{ fontSize: '11px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="Solution Actuelle" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Solution Videojet" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-slate-900 text-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400">Synthèse du Retour sur Investissement</span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  + {formatMoney(annualSavings * 5 - initialInvestment)} sur 5 ans
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Le remplacement de la machine actuelle s'autofinance intégralement en{' '}
                <span className="text-white font-bold">{Math.round(paybackMonths * 10) / 10} mois</span> grâce aux économies cumulées de consommables et à la suppression des pannes bloquantes sur la ligne.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

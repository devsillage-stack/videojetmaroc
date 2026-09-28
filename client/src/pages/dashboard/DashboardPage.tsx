import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Printer,
  AlertTriangle,
  Wrench,
  CheckCircle,
  TrendingUp,
  Boxes,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  PlusCircle,
  Building2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import api from '../../services/api.js';
import { useCurrency } from '../../contexts/CurrencyContext.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { useAuth } from '../../contexts/AuthContext.js';

const COLORS = ['#002B49', '#00A3E0', '#FF5E00', '#10B981', '#6366F1'];

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-videojet-blue" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-sm">
        Erreur de chargement du tableau de bord.
      </div>
    );
  }

  const { kpis, machinesByFamily, recentTickets, recentInterventions } = data;

  return (
    <div className="space-y-6">
      {/* Title & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('dashboard.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/maintenance?tab=tickets&new=true"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Déclarer un Incident SAV
          </Link>
          <Link
            to="/machines?new=true"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-videojet-blue hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            + Machine
          </Link>
          <Link
            to="/quotes?new=true"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Nouveau Devis
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Installed Base */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('dashboard.totalMachines')}
            </span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700">
              <Printer className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{kpis.totalMachines}</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {kpis.operationalMachines} en ligne
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>En panne: {kpis.faultyMachines}</span>
            <Link to="/machines" className="text-brand-600 font-medium hover:underline flex items-center gap-0.5">
              Voir parc <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: SAV / Critical Line Stoppages */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('dashboard.criticalTickets')}
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600">{kpis.criticalTickets}</span>
            <span className="text-xs font-semibold text-slate-500">
              sur {kpis.openTickets} incidents ouverts
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Interventions résolues: {kpis.completedInterventions}</span>
            <Link to="/maintenance" className="text-brand-600 font-medium hover:underline flex items-center gap-0.5">
              Planning SAV <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 3: Stock & Consumables Expiration */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Alertes Consommables
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600">{kpis.expiringBatchesCount}</span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Péremptions &lt; 60j
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Stock bas critique: {kpis.lowStockCount} réf.</span>
            <Link to="/inventory" className="text-brand-600 font-medium hover:underline flex items-center gap-0.5">
              Consommables <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 4: Direction / Financial */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {kpis.financial ? 'Chiffre d\'Affaires Devis' : 'Clients Industriels'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            {kpis.financial ? (
              <>
                <span className="text-2xl font-extrabold text-slate-900 truncate">
                  {formatPrice(kpis.financial.totalRevenueAccepted)}
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {kpis.financial.globalMarginPercent}% marge
                </span>
              </>
            ) : (
              <>
                <span className="text-3xl font-extrabold text-slate-900">{kpis.totalClients}</span>
                <span className="text-xs font-semibold text-slate-500">Comptes actifs</span>
              </>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            {kpis.financial ? (
              <span>Facturé: {formatPrice(kpis.financial.totalInvoiced)}</span>
            ) : (
              <span>Maroc B2B</span>
            )}
            <Link to="/quotes" className="text-brand-600 font-medium hover:underline flex items-center gap-0.5">
              Offres & Devis <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Technology Distribution Chart */}
        <div className="lg:col-span-2 min-w-0 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  {t('dashboard.machinesByTech')}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                  {kpis.totalMachines} machine(s)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ventilation du parc Videojet par technologie d'impression
              </p>
            </div>
            {kpis.totalMachines > 0 && (
              <Link
                to="/machines"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                Voir le parc <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {kpis.totalMachines === 0 ? (
            /* Empty State when Database is Purged */
            <div className="py-7 px-4 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center mb-3">
                <Printer className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Parc de machines prêt pour la production
              </h3>
              <p className="text-xs text-slate-500 max-w-md mt-1 mb-4">
                La base a été purgée de toutes les données de test. Ajoutez vos vraies machines clientes (CIJ, Laser CO2, TTO, TIJ) pour afficher la répartition par technologie en temps réel.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <Link
                  to="/machines?new=true"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-videojet-blue text-white text-xs font-bold hover:bg-slate-800 shadow-xs transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  + Enregistrer une machine
                </Link>
                <Link
                  to="/clients?new=true"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-xs transition-colors"
                >
                  <Building2 className="w-4 h-4" />
                  + Créer un client
                </Link>
              </div>

              {/* Technologies readiness preview */}
              <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 pt-5 border-t border-slate-200/60">
                <div className="p-2.5 rounded-lg bg-white border border-slate-100 text-left">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span>CIJ Jet Continu</span>
                    <span className="text-cyan-600 font-mono">0</span>
                  </div>
                  <span className="text-[9.5px] text-slate-400">Séries 1580 / 1880</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-100 text-left">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span>Laser CO2</span>
                    <span className="text-amber-600 font-mono">0</span>
                  </div>
                  <span className="text-[9.5px] text-slate-400">Séries 3340 / 3640</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-100 text-left">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span>TTO Transfert</span>
                    <span className="text-emerald-600 font-mono">0</span>
                  </div>
                  <span className="text-[9.5px] text-slate-400">DataFlex 6530</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-100 text-left">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span>TIJ Thermique</span>
                    <span className="text-indigo-600 font-mono">0</span>
                  </div>
                  <span className="text-[9.5px] text-slate-400">Wolke m610 touch</span>
                </div>
              </div>
            </div>
          ) : (
            /* Live Recharts Bar Chart when machines exist */
            <div className="h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
                <BarChart data={machinesByFamily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {machinesByFamily.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Status Breakdown Mini Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Santé Globale du Parc</h2>
            <p className="text-xs text-slate-500 mt-0.5">Disponibilité opérationnelle en temps réel</p>
            
            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-emerald-700">Opérationnelles</span>
                  <span>{Math.round((kpis.operationalMachines / (kpis.totalMachines || 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${(kpis.operationalMachines / (kpis.totalMachines || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-rose-600">En Panne</span>
                  <span>{kpis.faultyMachines} machine(s)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all"
                    style={{ width: `${(kpis.faultyMachines / (kpis.totalMachines || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cyan-50/70 border border-cyan-100 mt-6">
            <div className="flex items-center gap-2 text-xs font-bold text-videojet-blue">
              <ShieldCheck className="w-4 h-4 text-cyan-600" />
              <span>Maintenance Prédictive MAXIMiZE™</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              Les séries CIJ 1880 transmettent automatiquement les alertes de viscosité pour prévenir les arrêts de ligne.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tickets */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">
              {t('dashboard.recentTickets')}
            </h2>
            <Link to="/maintenance?tab=tickets" className="text-xs text-brand-600 hover:underline font-medium">
              Voir tout
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Ticket</th>
                  <th className="py-2.5 px-3">Client</th>
                  <th className="py-2.5 px-3">Priorité</th>
                  <th className="py-2.5 px-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTickets.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{t.ticketNumber}</td>
                    <td className="py-2.5 px-3 text-slate-600">{t.client?.name}</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={t.priority} />
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Interventions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">
              {t('dashboard.recentInterventions')}
            </h2>
            <Link to="/maintenance?tab=interventions" className="text-xs text-brand-600 hover:underline font-medium">
              Voir tout
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Intervention</th>
                  <th className="py-2.5 px-3">Technicien</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentInterventions.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{inv.interventionNumber}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {inv.technician?.firstName} {inv.technician?.lastName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{inv.type}</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

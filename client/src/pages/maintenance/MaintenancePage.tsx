import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  Wrench,
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle,
  Play,
  FileSignature,
  Plus,
  Search,
  User,
  Printer,
  Package,
  FileDown,
  RotateCcw,
  Filter,
} from 'lucide-react';
import api from '../../services/api.js';
import {
  MaintenanceTicket,
  Intervention,
  Machine,
  Client,
  User as UserType,
  Product,
} from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { Modal } from '../../components/common/Modal.js';
import { SignaturePad } from '../../components/common/SignaturePad.js';
import { PermissionGate } from '../../components/common/PermissionGate.js';
import { downloadExport } from '../../utils/download.js';
import { enqueueOfflineAction } from '../../utils/offlineQueue.js';

const SlaBadge: React.FC<{
  target?: string;
  status: string;
  resolvedAt?: string;
}> = ({ target, status, resolvedAt }) => {
  if (!target) return <span className="text-slate-400 text-xs">Standard</span>;

  const targetDate = new Date(target);
  const now = new Date();

  if (status === 'RESOLU' || status === 'CLOTURE') {
    const isSuccess = resolvedAt ? new Date(resolvedAt) <= targetDate : true;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
          isSuccess
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}
      >
        <CheckCircle className="w-3 h-3" />
        {isSuccess ? 'SLA Respecté' : 'SLA Dépassé'}
      </span>
    );
  }

  const diffMs = targetDate.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = (diffMinutes / 60).toFixed(1);

  if (diffMinutes < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
        <AlertTriangle className="w-3 h-3" />
        Dépassé ({Math.abs(Number(diffHours))}h)
      </span>
    );
  }

  if (diffMinutes < 60) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
        <Clock className="w-3 h-3" />
        Urgent ({diffMinutes} min)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
      <Clock className="w-3 h-3" />
      Reste {diffHours}h
    </span>
  );
};

export const MaintenancePage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const activeTab = searchParams.get('tab') || 'tickets';
  const setActiveTab = (tab: string) => setSearchParams({ tab });

  // Modals state
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(searchParams.get('new') === 'true');
  const [isNewInterventionOpen, setIsNewInterventionOpen] = useState(false);
  const [completeInterventionTarget, setCompleteInterventionTarget] = useState<Intervention | null>(null);

  // New Ticket State
  const [ticketForm, setTicketForm] = useState({
    clientId: searchParams.get('clientId') || '',
    machineId: searchParams.get('machineId') || '',
    priority: 'NORMALE',
    faultDescription: '',
    errorCode: '',
    reportedBy: '',
  });

  // New Intervention State
  const [interventionForm, setInterventionForm] = useState({
    clientId: '',
    machineId: '',
    technicianId: '',
    ticketId: '',
    type: 'CURATIVE',
    scheduledDate: new Date().toISOString().split('T')[0],
  });

  // Completion Form State
  const [completionForm, setCompletionForm] = useState({
    hoursSpent: 1.5,
    travelHours: 1.0,
    travelDistanceKm: 50,
    travelExpenses: 150,
    diagnosis: '',
    workDone: '',
    customerFeedback: '',
    customerSignerName: '',
    customerSignerTitle: '',
    customerSignature: '',
    partsUsed: [] as { productId: string; quantity: number }[],
  });

  // Filter States
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketPriority, setTicketPriority] = useState('');
  const [ticketStatus, setTicketStatus] = useState('');
  const [ticketClient, setTicketClient] = useState('');

  const [interventionSearch, setInterventionSearch] = useState('');
  const [interventionStatus, setInterventionStatus] = useState('');
  const [interventionType, setInterventionType] = useState('');

  // Queries
  const { data: tickets, isLoading: isTicketsLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      const res = await api.get('/maintenance/tickets');
      return res.data.tickets as MaintenanceTicket[];
    },
  });

  const { data: interventions, isLoading: isInterventionsLoading } = useQuery({
    queryKey: ['interventions'],
    queryFn: async () => {
      const res = await api.get('/maintenance/interventions');
      return res.data.interventions as Intervention[];
    },
  });

  const { data: machines } = useQuery({
    queryKey: ['machines-selector'],
    queryFn: async () => {
      const res = await api.get('/machines');
      return res.data.machines as Machine[];
    },
  });

  const { data: clients } = useQuery({
    queryKey: ['clients-selector'],
    queryFn: async () => {
      const res = await api.get('/clients');
      return res.data.clients as Client[];
    },
  });

  const { data: technicians } = useQuery({
    queryKey: ['technicians-selector'],
    queryFn: async () => {
      const res = await api.get('/users?role=TECHNICIEN_SAV');
      return res.data.users as UserType[];
    },
  });

  const { data: products } = useQuery({
    queryKey: ['products-selector'],
    queryFn: async () => {
      const res = await api.get('/inventory/products');
      return res.data.products as Product[];
    },
  });

  // Filtered computations
  const filteredTickets = (tickets || []).filter((tk) => {
    if (ticketPriority && tk.priority !== ticketPriority) return false;
    if (ticketStatus && tk.status !== ticketStatus) return false;
    if (ticketClient && tk.clientId !== ticketClient) return false;
    if (ticketSearch) {
      const q = ticketSearch.toLowerCase();
      const matchNum = tk.ticketNumber?.toLowerCase().includes(q);
      const matchClient = tk.client?.name?.toLowerCase().includes(q);
      const matchSn = tk.machine?.serialNumber?.toLowerCase().includes(q);
      const matchModel = tk.machine?.model?.name?.toLowerCase().includes(q);
      const matchDesc = tk.faultDescription?.toLowerCase().includes(q);
      const matchErr = tk.errorCode?.toLowerCase().includes(q);
      if (!matchNum && !matchClient && !matchSn && !matchModel && !matchDesc && !matchErr) return false;
    }
    return true;
  });

  const filteredInterventions = (interventions || []).filter((inv) => {
    if (interventionStatus && inv.status !== interventionStatus) return false;
    if (interventionType && inv.type !== interventionType) return false;
    if (interventionSearch) {
      const q = interventionSearch.toLowerCase();
      const matchNum = inv.interventionNumber?.toLowerCase().includes(q);
      const matchClient = inv.client?.name?.toLowerCase().includes(q);
      const matchSn = inv.machine?.serialNumber?.toLowerCase().includes(q);
      const matchTech = `${inv.technician?.firstName || ''} ${inv.technician?.lastName || ''}`.toLowerCase().includes(q);
      if (!matchNum && !matchClient && !matchSn && !matchTech) return false;
    }
    return true;
  });

  // Mutations
  const createTicketMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/maintenance/tickets', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setIsNewTicketOpen(false);
      setTicketForm({
        clientId: '',
        machineId: '',
        priority: 'NORMALE',
        faultDescription: '',
        errorCode: '',
        reportedBy: '',
      });
    },
  });

  const createInterventionMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/maintenance/interventions', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interventions'] });
      setIsNewInterventionOpen(false);
    },
  });

  const startInterventionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/maintenance/interventions/${id}/start`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interventions'] });
      queryClient.invalidateQueries({ queryKey: ['machines'] });
    },
  });

  const completeInterventionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        enqueueOfflineAction({
          type: 'COMPLETE_INTERVENTION',
          endpoint: `/maintenance/interventions/${id}/complete`,
          method: 'POST',
          payload: data,
          description: `Clôture intervention ${id} (Mode hors-ligne)`,
        });
        return { offline: true, message: 'Fiche d\'intervention enregistrée localement' };
      }
      try {
        const res = await api.post(`/maintenance/interventions/${id}/complete`, data);
        return res.data;
      } catch (err: any) {
        if (typeof navigator !== 'undefined' && (!navigator.onLine || !err.response)) {
          enqueueOfflineAction({
            type: 'COMPLETE_INTERVENTION',
            endpoint: `/maintenance/interventions/${id}/complete`,
            method: 'POST',
            payload: data,
            description: `Clôture intervention ${id} (Mode hors-ligne)`,
          });
          return { offline: true, message: 'Fiche d\'intervention enregistrée localement' };
        }
        throw err;
      }
    },
    onSuccess: (res: any) => {
      if (res?.offline) {
        alert('Mode déconnecté : La fiche d\'intervention et la signature client ont été sauvegardées localement. Elles seront automatiquement transmises au serveur dès le rétablissement de la connexion.');
      }
      queryClient.invalidateQueries({ queryKey: ['interventions'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setCompleteInterventionTarget(null);
    },
  });

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    createTicketMutation.mutate(ticketForm);
  };

  const handleCreateIntervention = (e: React.FormEvent) => {
    e.preventDefault();
    createInterventionMutation.mutate(interventionForm);
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeInterventionTarget) return;
    completeInterventionMutation.mutate({
      id: completeInterventionTarget.id,
      data: completionForm,
    });
  };

  const addPartToIntervention = (productId: string) => {
    if (!productId) return;
    setCompletionForm((prev) => ({
      ...prev,
      partsUsed: [...prev.partsUsed, { productId, quantity: 1 }],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('maintenance.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('maintenance.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewTicketOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            {t('maintenance.newTicket')}
          </button>

          <PermissionGate roles={['SUPER_ADMIN', 'ADMIN', 'RESPONSABLE_SAV']}>
            <button
              onClick={() => setIsNewInterventionOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-videojet-blue hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors"
            >
              <Calendar className="w-4 h-4" />
              {t('maintenance.newIntervention')}
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'tickets'
              ? 'border-videojet-blue text-videojet-blue bg-white shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          {t('maintenance.ticketsTab')} ({tickets?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('interventions')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'interventions'
              ? 'border-videojet-blue text-videojet-blue bg-white shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4 text-cyan-600" />
          {t('maintenance.interventionsTab')} ({interventions?.length || 0})
        </button>
      </div>

      {/* TAB 1: TICKETS */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Ticket Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                placeholder="Rechercher par N° Ticket, Client, Machine, Code Erreur..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={ticketClient}
                onChange={(e) => setTicketClient(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 max-w-[160px]"
              >
                <option value="">Tous clients</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={ticketPriority}
                onChange={(e) => setTicketPriority(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Toutes priorités</option>
                <option value="CRITIQUE_LIGNE_ARRETEE">Critique (Ligne Arrêtée)</option>
                <option value="HAUTE">Haute</option>
                <option value="NORMALE">Normale</option>
                <option value="BASSE">Basse</option>
              </select>

              <select
                value={ticketStatus}
                onChange={(e) => setTicketStatus(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Tous statuts</option>
                <option value="OUVERT">Ouvert</option>
                <option value="ASSIGNE">Assigné</option>
                <option value="EN_COURS">En Cours</option>
                <option value="RESOLU">Résolu</option>
                <option value="CLOTURE">Clôturé</option>
              </select>

              {(ticketSearch || ticketPriority || ticketStatus || ticketClient) && (
                <button
                  onClick={() => {
                    setTicketSearch('');
                    setTicketPriority('');
                    setTicketStatus('');
                    setTicketClient('');
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors"
                  title="Réinitialiser les filtres"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Effacer</span>
                </button>
              )}

              <div className="text-[11px] font-bold text-slate-500 px-2 py-1 bg-slate-100 rounded-lg">
                {filteredTickets.length} ticket(s)
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">{t('maintenance.ticketNumber')}</th>
                    <th className="py-3 px-4">Client Industriel</th>
                    <th className="py-3 px-4">Machine & Modèle</th>
                    <th className="py-3 px-4">Description de la panne</th>
                    <th className="py-3 px-4">Code Erreur</th>
                    <th className="py-3 px-4">{t('maintenance.priority')}</th>
                    <th className="py-3 px-4">Échéance SLA</th>
                    <th className="py-3 px-4">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isTicketsLoading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Chargement des tickets...
                      </td>
                    </tr>
                  ) : filteredTickets.length > 0 ? (
                    filteredTickets.map((tk) => (
                      <tr key={tk.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{tk.ticketNumber}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{tk.client?.name}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900">{tk.machine?.serialNumber}</span>
                          <span className="block text-[10px] text-slate-500">{tk.machine?.model?.name}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                          {tk.faultDescription}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-rose-600 font-semibold">
                          {tk.errorCode || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={tk.priority} />
                        </td>
                        <td className="py-3 px-4">
                          <SlaBadge
                            target={tk.slaTargetResolutionAt}
                            status={tk.status}
                            resolvedAt={tk.resolvedAt}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={tk.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        {tickets && tickets.length > 0
                          ? 'Aucun ticket ne correspond à vos filtres de recherche.'
                          : 'Aucun incident en cours. Tout le parc est opérationnel.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTERVENTIONS */}
      {activeTab === 'interventions' && (
        <div className="space-y-4">
          {/* Intervention Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={interventionSearch}
                onChange={(e) => setInterventionSearch(e.target.value)}
                placeholder="Rechercher par N° Intervention, Client, Machine ou Technicien..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={interventionType}
                onChange={(e) => setInterventionType(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Tous types</option>
                <option value="CURATIVE">Curative (Dépannage)</option>
                <option value="PREVENTIVE">Préventive</option>
                <option value="INSTALLATION">Installation</option>
                <option value="FORMATION">Formation</option>
                <option value="AUDIT">Audit Technique</option>
              </select>

              <select
                value={interventionStatus}
                onChange={(e) => setInterventionStatus(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Tous statuts</option>
                <option value="PLANIFIEE">Planifiée</option>
                <option value="EN_COURS">En cours</option>
                <option value="TERMINEE">Terminée</option>
                <option value="ANNULEE">Annulée</option>
              </select>

              {(interventionSearch || interventionType || interventionStatus) && (
                <button
                  onClick={() => {
                    setInterventionSearch('');
                    setInterventionType('');
                    setInterventionStatus('');
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors"
                  title="Réinitialiser les filtres"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Effacer</span>
                </button>
              )}

              <div className="text-[11px] font-bold text-slate-500 px-2 py-1 bg-slate-100 rounded-lg">
                {filteredInterventions.length} intervention(s)
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">{t('maintenance.interventionNumber')}</th>
                    <th className="py-3 px-4">Client & Ligne</th>
                    <th className="py-3 px-4">Machine</th>
                    <th className="py-3 px-4">{t('maintenance.technician')}</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">{t('maintenance.scheduledDate')}</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-right">Actions Fiche SAV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isInterventionsLoading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Chargement des interventions...
                      </td>
                    </tr>
                  ) : filteredInterventions.length > 0 ? (
                    filteredInterventions.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{inv.interventionNumber}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800">{inv.client.name}</span>
                          <span className="block text-[10px] text-slate-500">{inv.client.city}</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium">{inv.machine.serialNumber}</td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {inv.technician.firstName} {inv.technician.lastName}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {inv.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {new Date(inv.scheduledDate).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => downloadExport(`/exports/interventions/${inv.id}/pdf`, `Fiche_SAV_${inv.interventionNumber}.pdf`)}
                              title="Télécharger la fiche d'intervention (PDF)"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                            >
                              <FileDown className="w-3.5 h-3.5 text-videojet-blue" />
                              PDF
                            </button>
                            {inv.status === 'PLANIFIEE' && (
                              <button
                                onClick={() => startInterventionMutation.mutate(inv.id)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold text-xs transition-colors"
                              >
                                <Play className="w-3.5 h-3.5" />
                                {t('maintenance.start')}
                              </button>
                            )}
                            {inv.status === 'EN_COURS' && (
                              <button
                                onClick={() => {
                                  setCompleteInterventionTarget(inv);
                                  setCompletionForm({
                                    hoursSpent: 2.0,
                                    travelHours: 1.0,
                                    travelDistanceKm: 50,
                                    travelExpenses: 150,
                                    diagnosis: inv.diagnosis || '',
                                    workDone: inv.workDone || '',
                                    customerFeedback: '',
                                    customerSignerName: '',
                                    customerSignerTitle: '',
                                    customerSignature: '',
                                    partsUsed: [],
                                  });
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs"
                              >
                                <FileSignature className="w-3.5 h-3.5" />
                                {t('maintenance.signAndClose')}
                              </button>
                            )}
                            {inv.status === 'TERMINEE' && (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Signé : {inv.customerSignerName || 'Client'}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        {interventions && interventions.length > 0
                          ? 'Aucune intervention ne correspond à vos filtres de recherche.'
                          : 'Aucune intervention enregistrée.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      <Modal
        isOpen={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
        title="Déclarer un nouvel incident SAV"
        subtitle="Enregistrez une panne client avec déclenchement des SLA de garantie"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Client Industriel *
              </label>
              <select
                value={ticketForm.clientId}
                onChange={(e) => setTicketForm({ ...ticketForm, clientId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              >
                <option value="">Sélectionner un client...</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Machine du Parc Concernée *
              </label>
              <select
                value={ticketForm.machineId}
                onChange={(e) => setTicketForm({ ...ticketForm, machineId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              >
                <option value="">Sélectionner une machine...</option>
                {machines
                  ?.filter((m) => !ticketForm.clientId || m.clientId === ticketForm.clientId)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.serialNumber} — {m.model.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Degré de Gravité / Priorité *
              </label>
              <select
                value={ticketForm.priority}
                onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="CRITIQUE_LIGNE_ARRETEE">🚨 CRITIQUE - LIGNE DE PRODUCTION ARRÊTÉE</option>
                <option value="HAUTE">Haute (Qualité marquage dégradée)</option>
                <option value="NORMALE">Normale (Maintenance périodique requise)</option>
                <option value="BASSE">Basse (Assistance / question technique)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Code Erreur Écran Videojet (optionnel)
              </label>
              <input
                type="text"
                value={ticketForm.errorCode}
                onChange={(e) => setTicketForm({ ...ticketForm, errorCode: e.target.value })}
                placeholder="Ex: E104-M, E302-Core..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Description détaillée des symptômes constatés *
            </label>
            <textarea
              rows={3}
              value={ticketForm.faultDescription}
              onChange={(e) => setTicketForm({ ...ticketForm, faultDescription: e.target.value })}
              placeholder="Ex: Le jet dévie vers la droite, présence de dépôts d'encre sur la tête de marquage..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewTicketOpen(false)}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createTicketMutation.isPending}
              className="px-4 py-2 font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
            >
              {createTicketMutation.isPending ? 'Enregistrement...' : 'Enregistrer le ticket'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Complete & Sign Intervention Modal */}
      {completeInterventionTarget && (
        <Modal
          isOpen={!!completeInterventionTarget}
          onClose={() => setCompleteInterventionTarget(null)}
          title={`Clôture de Fiche SAV : ${completeInterventionTarget.interventionNumber}`}
          subtitle={`${completeInterventionTarget.machine.model.name} (${completeInterventionTarget.machine.serialNumber}) — ${completeInterventionTarget.client.name}`}
          maxWidth="3xl"
        >
          <form onSubmit={handleCompleteSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Temps passé sur site (heures) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={completionForm.hoursSpent}
                  onChange={(e) => setCompletionForm({ ...completionForm, hoursSpent: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Temps de route / trajet (heures)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={completionForm.travelHours}
                  onChange={(e) => setCompletionForm({ ...completionForm, travelHours: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Distance Aller-Retour (km)
                </label>
                <input
                  type="number"
                  step="1"
                  value={completionForm.travelDistanceKm}
                  onChange={(e) => setCompletionForm({ ...completionForm, travelDistanceKm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Frais de déplacement (DH)
                </label>
                <input
                  type="number"
                  step="10"
                  value={completionForm.travelExpenses}
                  onChange={(e) => setCompletionForm({ ...completionForm, travelExpenses: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pièces consommées (déduction automatique de stock)
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addPartToIntervention(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="">+ Ajouter une pièce ou solvant utilisé...</option>
                  {products?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.partNumber} — {p.name} (Stock: {p.stockQuantity})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Parts List */}
            {completionForm.partsUsed.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <span className="font-semibold text-slate-700 block">Pièces & consommables utilisés :</span>
                {completionForm.partsUsed.map((pu, idx) => {
                  const p = products?.find((prod) => prod.id === pu.productId);
                  return (
                    <div key={idx} className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-slate-200">
                      <span className="font-bold">{p?.partNumber} — {p?.name}</span>
                      <div className="flex items-center gap-2">
                        <span>Quantité:</span>
                        <input
                          type="number"
                          min="1"
                          value={pu.quantity}
                          onChange={(e) => {
                            const newQty = parseFloat(e.target.value) || 1;
                            setCompletionForm((prev) => {
                              const updated = [...prev.partsUsed];
                              updated[idx].quantity = newQty;
                              return { ...prev, partsUsed: updated };
                            });
                          }}
                          className="w-16 px-2 py-0.5 border border-slate-200 rounded text-center"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Diagnostic technique constaté *
              </label>
              <textarea
                rows={2}
                value={completionForm.diagnosis}
                onChange={(e) => setCompletionForm({ ...completionForm, diagnosis: e.target.value })}
                placeholder="Ex: Filtre d'encre colmaté, buse de tir 60µ encrassée..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Travaux & Actions correctives réalisés *
              </label>
              <textarea
                rows={2}
                value={completionForm.workDone}
                onChange={(e) => setCompletionForm({ ...completionForm, workDone: e.target.value })}
                placeholder="Ex: Nettoyage ultrasons buse, purge du circuit encre, test d'impression 1000 cadences validé..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>

            {/* Signature Pad */}
            <div className="pt-2 border-t border-slate-100">
              <SignaturePad
                signerName={completionForm.customerSignerName}
                onSignerNameChange={(name) => setCompletionForm({ ...completionForm, customerSignerName: name })}
                signerTitle={completionForm.customerSignerTitle}
                onSignerTitleChange={(title) => setCompletionForm({ ...completionForm, customerSignerTitle: title })}
                onSave={(dataUrl) => setCompletionForm({ ...completionForm, customerSignature: dataUrl })}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCompleteInterventionTarget(null)}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={completeInterventionMutation.isPending || !completionForm.customerSignerName}
                className="px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs disabled:opacity-50"
              >
                {completeInterventionMutation.isPending ? 'Enregistrement...' : 'Valider et Clôturer le rapport SAV'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  Plus,
  RefreshCw,
  Search,
  Filter,
  MapPin,
  Wrench,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import api from '../../services/api.js';
import { Intervention, Machine, Client, User as UserType } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { Modal } from '../../components/common/Modal.js';

interface TechnicianWorkload {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  interventions: Intervention[];
}

export const PlanningPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [selectedTechId, setSelectedTechId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  // Reschedule Modal
  const [rescheduleTarget, setRescheduleTarget] = useState<Intervention | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleTechId, setRescheduleTechId] = useState<string>('');
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [overrideConflict, setOverrideConflict] = useState<boolean>(false);

  // Queries
  const { data: technicians, isLoading: isTechsLoading } = useQuery({
    queryKey: ['planning-technicians'],
    queryFn: async () => {
      const res = await api.get('/planning/technicians');
      return res.data.technicians as TechnicianWorkload[];
    },
  });

  const { data: interventions, isLoading: isInterventionsLoading } = useQuery({
    queryKey: ['planning-interventions', selectedTechId, selectedDate, viewMode],
    queryFn: async () => {
      const params: any = {};
      if (selectedTechId !== 'all') params.technicianId = selectedTechId;

      if (viewMode === 'day') {
        const start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(selectedDate);
        end.setHours(23, 59, 59, 999);
        params.startDate = start.toISOString();
        params.endDate = end.toISOString();
      } else {
        const curr = new Date(selectedDate);
        const first = curr.getDate() - curr.getDay() + 1; // Monday
        const monday = new Date(curr.setDate(first));
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(sunday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        params.startDate = monday.toISOString();
        params.endDate = sunday.toISOString();
      }

      const res = await api.get('/planning/interventions', { params });
      return res.data.interventions as Intervention[];
    },
  });

  // Check conflicts in real-time
  const checkConflictMutation = useMutation({
    mutationFn: async (payload: { technicianId: string; scheduledDate: string; excludeInterventionId?: string }) => {
      const res = await api.post('/planning/check-conflicts', payload);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.hasConflict) {
        setConflictWarning(data.message);
      } else {
        setConflictWarning(null);
      }
    },
  });

  // Reschedule Mutation
  const rescheduleMutation = useMutation({
    mutationFn: async (payload: { id: string; scheduledDate: string; technicianId: string; overrideConflict: boolean }) => {
      const res = await api.patch(`/planning/reschedule/${payload.id}`, {
        scheduledDate: payload.scheduledDate,
        technicianId: payload.technicianId,
        overrideConflict: payload.overrideConflict,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-interventions'] });
      queryClient.invalidateQueries({ queryKey: ['planning-technicians'] });
      setRescheduleTarget(null);
      setConflictWarning(null);
      setOverrideConflict(false);
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Erreur lors de la replanification');
    },
  });

  const handleDateShift = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const openRescheduleModal = (inv: Intervention) => {
    setRescheduleTarget(inv);
    const dateFormatted = new Date(inv.scheduledDate).toISOString().slice(0, 16);
    setRescheduleDate(dateFormatted);
    setRescheduleTechId(inv.technicianId);
    setConflictWarning(null);
    setOverrideConflict(false);
  };

  const handleDateOrTechChange = (newDateStr: string, newTechId: string) => {
    setRescheduleDate(newDateStr);
    setRescheduleTechId(newTechId);
    if (newDateStr && newTechId) {
      checkConflictMutation.mutate({
        technicianId: newTechId,
        scheduledDate: new Date(newDateStr).toISOString(),
        excludeInterventionId: rescheduleTarget?.id,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="w-7 h-7 text-brand-600" />
            Planning & Calendrier Techniciens SAV
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Affectation des interventions terrain, gestion de la charge des techniciens et détection des conflits
          </p>
        </div>

        {/* View Switcher & Date Controls */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center bg-slate-100 rounded-xl p-0.5 text-xs font-semibold">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'day' ? 'bg-white text-brand-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Jour
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'week' ? 'bg-white text-brand-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semaine
            </button>
          </div>

          <div className="flex items-center gap-1 pl-2 border-l border-slate-200 text-xs">
            <button
              onClick={() => handleDateShift(viewMode === 'day' ? -1 : -7)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1 border border-slate-200 rounded-lg font-medium text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              onClick={() => handleDateShift(viewMode === 'day' ? 1 : 7)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-2.5 py-1 text-slate-600 hover:text-brand-600 font-semibold text-xs transition-colors"
            >
              Aujourd'hui
            </button>
          </div>
        </div>
      </div>

      {/* Technician Filter & Workload Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Équipe Technique SAV Videojet Maroc ({technicians?.length || 0})
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Filtrer par technicien :</span>
            <select
              value={selectedTechId}
              onChange={(e) => setSelectedTechId(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">Tous les techniciens</option>
              {technicians?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isTechsLoading ? (
            <div className="col-span-full py-8 text-center text-slate-400 text-xs">
              Chargement des techniciens...
            </div>
          ) : (
            technicians?.map((tech) => {
              const activeCount = tech.interventions.filter((i) => i.status === 'EN_COURS').length;
              const plannedCount = tech.interventions.filter((i) => i.status === 'PLANIFIEE').length;
              const isSelected = selectedTechId === tech.id;

              return (
                <div
                  key={tech.id}
                  onClick={() => setSelectedTechId(selectedTechId === tech.id ? 'all' : tech.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-brand-50/50 border-brand-500 ring-2 ring-brand-500/20 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-sm">
                        {tech.firstName[0]}
                        {tech.lastName[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-slate-900">
                          {tech.firstName} {tech.lastName}
                        </h3>
                        <p className="text-[10px] text-slate-500">{tech.phone || tech.email}</p>
                      </div>
                    </div>
                    {activeCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                        Sur site
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Disponible
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 text-slate-600">
                    <span>En cours: <strong>{activeCount}</strong></span>
                    <span>Planifiées: <strong>{plannedCount}</strong></span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Interventions Timeline / List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-900 text-sm">
              Missions & Interventions planifiées ({interventions?.length || 0})
            </h2>
            <span className="text-xs text-slate-500">
              pour le {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        {isInterventionsLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Chargement du planning...
          </div>
        ) : interventions && interventions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {interventions.map((inv) => (
              <div key={inv.id} className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Time Badge */}
                  <div className="text-center px-3 py-2 bg-slate-100 rounded-xl min-w-[70px]">
                    <span className="block text-xs font-bold text-slate-900">
                      {new Date(inv.scheduledDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(inv.scheduledDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  {/* Main Details */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{inv.interventionNumber}</span>
                      <StatusBadge status={inv.status} />
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {inv.type}
                      </span>
                      {inv.ticket && (
                        <span className="text-[10px] font-mono font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          {inv.ticket.ticketNumber} ({inv.ticket.priority})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        🏢 {inv.client?.name}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5" />
                        {inv.client?.city}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-slate-700">
                        <Wrench className="w-3.5 h-3.5" />
                        {inv.machine?.serialNumber} ({inv.machine?.model?.name})
                      </span>
                    </div>

                    {inv.diagnosis && (
                      <p className="text-[11px] text-slate-500 italic max-w-2xl">
                        Motif : {inv.diagnosis}
                      </p>
                    )}
                  </div>
                </div>

                {/* Technician & Action */}
                <div className="flex items-center gap-3 self-end md:self-center">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 block">
                      {inv.technician?.firstName} {inv.technician?.lastName}
                    </span>
                    <span className="text-[10px] text-slate-500">Technicien affecté</span>
                  </div>

                  <button
                    onClick={() => openRescheduleModal(inv)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors"
                  >
                    Replanifier
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <CalendarIcon className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-medium text-sm">Aucune intervention planifiée pour cette période.</p>
            <p className="text-xs text-slate-400">Sélectionnez une autre date ou un autre technicien.</p>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <Modal
          isOpen={true}
          onClose={() => setRescheduleTarget(null)}
          title={`Replanifier l'intervention ${rescheduleTarget.interventionNumber}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-semibold text-slate-800">
                {rescheduleTarget.client?.name} — {rescheduleTarget.machine?.serialNumber}
              </span>
              <p className="text-slate-500 text-[11px]">
                {rescheduleTarget.diagnosis || 'Maintenance programmée'}
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Technicien affecté *
              </label>
              <select
                value={rescheduleTechId}
                onChange={(e) => handleDateOrTechChange(rescheduleDate, e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {technicians?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.firstName} {t.lastName} ({t.phone || 'Technicien SAV'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Date et heure d'intervention *
              </label>
              <input
                type="datetime-local"
                value={rescheduleDate}
                onChange={(e) => handleDateOrTechChange(e.target.value, rescheduleTechId)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>

            {/* Conflict Warning Box */}
            {conflictWarning && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-start gap-2 text-amber-800 font-semibold">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{conflictWarning}</span>
                </div>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer pt-1 border-t border-amber-200/60">
                  <input
                    type="checkbox"
                    checked={overrideConflict}
                    onChange={(e) => setOverrideConflict(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span className="font-semibold text-[11px]">
                    Ignorer le conflit et forcer la double affectation
                  </span>
                </label>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRescheduleTarget(null)}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={Boolean(conflictWarning && !overrideConflict) || rescheduleMutation.isPending}
                onClick={() => {
                  rescheduleMutation.mutate({
                    id: rescheduleTarget.id,
                    scheduledDate: new Date(rescheduleDate).toISOString(),
                    technicianId: rescheduleTechId,
                    overrideConflict,
                  });
                }}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors shadow-xs"
              >
                {rescheduleMutation.isPending ? 'Enregistrement...' : 'Confirmer le planning'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

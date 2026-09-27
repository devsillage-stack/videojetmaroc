import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusMap: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  // Machine status
  OPERATIONNELLE: { label: 'Opérationnelle', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  EN_PANNE: { label: 'En Panne', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  EN_MAINTENANCE: { label: 'En Maintenance', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  ARRETEE: { label: 'Arrêtée', bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },

  // Ticket Priority
  CRITIQUE_LIGNE_ARRETEE: { label: 'CRITIQUE - LIGNE ARRÊTÉE', bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-600' },
  HAUTE: { label: 'Haute', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  NORMALE: { label: 'Normale', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  BASSE: { label: 'Basse', bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },

  // Ticket Status
  OUVERT: { label: 'Ouvert', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  ASSIGNE: { label: 'Assigné', bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  EN_COURS: { label: 'En Cours', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  RESOLU: { label: 'Résolu', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  CLOTURE: { label: 'Clôturé', bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },

  // Intervention Status
  PLANIFIEE: { label: 'Planifiée', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  TERMINEE: { label: 'Terminée', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  ANNULEE: { label: 'Annulée', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },

  // Quote Status
  BROUILLON: { label: 'Brouillon', bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
  EN_ATTENTE_VALIDATION: { label: 'Validation', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  ENVOYE: { label: 'Envoyé', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  ACCEPTE: { label: 'Accepté', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  REFUSE: { label: 'Refusé', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },

  // Batch Status
  VALIDE: { label: 'Valide', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  ALERTE_PEREMPTION: { label: 'Péremption Proche (<60j)', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  PERIME: { label: 'PÉRIMÉ', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },

  // Invoice Status
  EMISE: { label: 'Émise', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  PAYEE: { label: 'Payée', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  PAYEE_PARTIEL: { label: 'Partiellement Payée', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  EN_RETARD: { label: 'En Retard', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const conf = statusMap[status] || {
    label: status,
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
  };

  const pad = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${conf.bg} ${conf.text} ${pad}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
      {conf.label}
    </span>
  );
};

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Receipt,
  Search,
  CheckCircle,
  CreditCard,
  Building2,
  Calendar,
  AlertCircle,
  FileDown,
} from 'lucide-react';
import api from '../../services/api.js';
import { Invoice } from '../../types/index.js';
import { useCurrency } from '../../contexts/CurrencyContext.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { Modal } from '../../components/common/Modal.js';
import { PermissionGate } from '../../components/common/PermissionGate.js';
import { downloadExport } from '../../utils/download.js';

export const InvoicesPage: React.FC = () => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('VIREMENT_BANCAIRE');

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', search],
    queryFn: async () => {
      const res = await api.get('/invoices', { params: { search } });
      return res.data.invoices as Invoice[];
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async ({ id, amount, paymentMethod }: { id: string; amount: number; paymentMethod: string }) => {
      const res = await api.post(`/invoices/${id}/payment`, { amount, paymentMethod });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setSelectedInvoice(null);
    },
  });

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    recordPaymentMutation.mutate({
      id: selectedInvoice.id,
      amount: Number(paymentAmount),
      paymentMethod,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {t('nav.invoices')} & Suivi des Règlements
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Suivi des créances clients, facturation multi-devises et encaissements bancaires
        </p>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par numéro de facture ou nom client..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">N° Facture</th>
                <th className="py-3 px-4">Client Industriel</th>
                <th className="py-3 px-4">Émission</th>
                <th className="py-3 px-4">Échéance</th>
                <th className="py-3 px-4">Montant TTC</th>
                <th className="py-3 px-4">Encaissé</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Chargement des factures...
                  </td>
                </tr>
              ) : invoices && invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{inv.client.name}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(inv.issueDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(inv.dueDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {formatPrice(inv.totalTtc, inv.currency)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-700">
                      {formatPrice(inv.paidAmount, inv.currency)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => downloadExport(`/exports/invoices/${inv.id}/pdf`, `Facture_${inv.invoiceNumber}.pdf`)}
                          title="Télécharger la facture en PDF"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                        >
                          <FileDown className="w-3.5 h-3.5 text-videojet-blue" />
                          PDF
                        </button>
                        {inv.status !== 'PAYEE' && (
                          <PermissionGate roles={['SUPER_ADMIN', 'ADMIN', 'COMPTABILITE', 'DIRECTION']}>
                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setPaymentAmount(inv.totalTtc - inv.paidAmount);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Encaisser
                            </button>
                          </PermissionGate>
                        )}
                        {inv.status === 'PAYEE' && (
                          <span className="text-emerald-700 font-semibold text-xs flex items-center justify-end gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Soldée
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Aucune facture enregistrée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Enregistrer un règlement : Facture ${selectedInvoice.invoiceNumber}`}
          subtitle={`${selectedInvoice.client.name} — Reste à payer : ${formatPrice(selectedInvoice.totalTtc - selectedInvoice.paidAmount, selectedInvoice.currency)}`}
          maxWidth="md"
        >
          <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Montant du règlement reçu ({selectedInvoice.currency}) *
              </label>
              <input
                type="number"
                step="0.01"
                max={selectedInvoice.totalTtc - selectedInvoice.paidAmount}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Mode de paiement *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="VIREMENT_BANCAIRE">Virement Bancaire</option>
                <option value="CHEQUE">Chèque Bancaire</option>
                <option value="EFFET_COMMERCE">Effet de Commerce (LCR)</option>
                <option value="ESPECES">Espèces</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={recordPaymentMutation.isPending || paymentAmount <= 0}
                className="px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs disabled:opacity-50"
              >
                {recordPaymentMutation.isPending ? 'Enregistrement...' : 'Valider l\'encaissement'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

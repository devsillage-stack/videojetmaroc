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
  Eye,
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
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('VIREMENT_BANCAIRE');

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', search],
    queryFn: async () => {
      const res = await api.get('/invoices', { params: { search } });
      return res.data.invoices as Invoice[];
    },
  });

  const { data: invoiceDetails, isLoading: isInvoiceDetailsLoading } = useQuery({
    queryKey: ['invoice-detail', previewInvoice?.id],
    queryFn: async () => {
      if (!previewInvoice?.id) return null;
      const res = await api.get(`/invoices/${previewInvoice.id}`);
      return res.data.invoice;
    },
    enabled: Boolean(previewInvoice?.id),
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
                          onClick={() => setPreviewInvoice(inv)}
                          title="Visualiser le détail et les lignes de la facture"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Détails
                        </button>
                        <button
                          onClick={() => downloadExport(`/exports/invoices/${inv.id}/pdf`, `Facture_${inv.invoiceNumber}.pdf`)}
                          title="Télécharger la facture en PDF"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
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

      {/* Invoice Details Preview Modal */}
      <Modal
        isOpen={Boolean(previewInvoice)}
        onClose={() => setPreviewInvoice(null)}
        title={`Facture Client — ${previewInvoice?.invoiceNumber || ''}`}
        maxWidth="2xl"
      >
        {isInvoiceDetailsLoading ? (
          <div className="py-12 text-center text-slate-400">Chargement de la facture...</div>
        ) : invoiceDetails ? (
          <div className="space-y-6 text-xs">
            {/* Header info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Client Destinataire</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{invoiceDetails.client?.name}</p>
                <p className="text-xs text-slate-500">{invoiceDetails.client?.city || 'Maroc'}</p>
                {invoiceDetails.quote && (
                  <p className="text-[11px] text-cyan-700 font-mono mt-1">Réf Devis : {invoiceDetails.quote.quoteNumber}</p>
                )}
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Statut & Échéance</p>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge status={invoiceDetails.status} />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Émise le : {new Date(invoiceDetails.issueDate).toLocaleDateString('fr-FR')}
                </p>
                <p className="text-xs text-slate-500">
                  Échéance : {new Date(invoiceDetails.dueDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Paiement & Devise</p>
                <p className="text-xs font-semibold text-slate-700 mt-1">{invoiceDetails.paymentMethod || 'Virement bancaire'}</p>
                <p className="text-xs text-slate-500">Devise : {invoiceDetails.currency || 'MAD'}</p>
              </div>
            </div>

            {/* Line items if available */}
            {invoiceDetails.quote?.items && invoiceDetails.quote.items.length > 0 && (
              <div className="border border-slate-200/80 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Désignation</th>
                      <th className="py-2.5 px-3 text-center">Qté</th>
                      <th className="py-2.5 px-3 text-right">Prix Unitaire</th>
                      <th className="py-2.5 px-3 text-right">Total HT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoiceDetails.quote.items.map((item: any, i: number) => (
                      <tr key={item.id || i} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-slate-800">{item.description}</p>
                          {item.product && (
                            <p className="text-[10px] text-slate-400 font-mono">Réf: {item.product.partNumber}</p>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          {formatPrice(item.unitPrice, invoiceDetails.currency)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {formatPrice(item.totalPrice, invoiceDetails.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Financial summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900 text-white p-4 rounded-xl">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Total TTC facturé :</span>
                  <span className="font-bold text-white">{formatPrice(invoiceDetails.totalTtc, invoiceDetails.currency)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Déjà encaissé :</span>
                  <span>{formatPrice(invoiceDetails.paidAmount, invoiceDetails.currency)}</span>
                </div>
              </div>
              <div className="space-y-1.5 text-xs sm:border-l sm:border-slate-800 sm:pl-4">
                <div className="flex justify-between text-base font-extrabold">
                  <span className="text-slate-300">Solde restant dû :</span>
                  <span className={invoiceDetails.totalTtc - invoiceDetails.paidAmount > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                    {formatPrice(invoiceDetails.totalTtc - invoiceDetails.paidAmount, invoiceDetails.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => downloadExport(`/exports/invoices/${invoiceDetails.id}/pdf`, `Facture_${invoiceDetails.invoiceNumber}.pdf`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5 text-videojet-blue" />
                Télécharger Facture PDF
              </button>

              <div className="flex items-center gap-2">
                {invoiceDetails.status !== 'PAYEE' && (
                  <PermissionGate roles={['SUPER_ADMIN', 'ADMIN', 'COMPTABILITE', 'DIRECTION']}>
                    <button
                      type="button"
                      onClick={() => {
                        const inv = invoiceDetails;
                        setPreviewInvoice(null);
                        setSelectedInvoice(inv);
                        setPaymentAmount(inv.totalTtc - inv.paidAmount);
                      }}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Encaisser cette facture
                    </button>
                  </PermissionGate>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewInvoice(null)}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl font-semibold cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

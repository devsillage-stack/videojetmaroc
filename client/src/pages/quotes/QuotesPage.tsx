import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle,
  FileCheck2,
  Trash2,
  Coins,
  Receipt,
  Eye,
  ArrowRight,
  FileDown,
  Building2,
  Calendar,
  Send,
  XCircle,
  PackageCheck,
  Printer,
} from 'lucide-react';
import api from '../../services/api.js';
import { Quote, Client, Product, MachineModel } from '../../types/index.js';
import { useCurrency } from '../../contexts/CurrencyContext.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { Modal } from '../../components/common/Modal.js';
import { PermissionGate } from '../../components/common/PermissionGate.js';
import { downloadExport } from '../../utils/download.js';

export const QuotesPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { formatPrice, currencies } = useCurrency();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [isNewQuoteOpen, setIsNewQuoteOpen] = useState(searchParams.get('new') === 'true');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  // New Quote Form
  const [clientId, setClientId] = useState('');
  const [currency, setCurrency] = useState('MAD');
  const [exchangeRate, setExchangeRate] = useState(1.0);
  const [taxRateId, setTaxRateId] = useState('tax-tva-20');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [paymentTerms, setPaymentTerms] = useState('30 jours fin de mois');
  const [items, setItems] = useState<any[]>([
    {
      itemType: 'PRODUCT',
      productId: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      costPrice: 0,
      discountPercent: 0,
    },
  ]);

  // Queries
  const { data: quotes, isLoading } = useQuery({
    queryKey: ['quotes', search],
    queryFn: async () => {
      const res = await api.get('/quotes', { params: { search } });
      return res.data.quotes as Quote[];
    },
  });

  const { data: clients } = useQuery({
    queryKey: ['clients-for-quotes'],
    queryFn: async () => {
      const res = await api.get('/clients');
      return res.data.clients as Client[];
    },
  });

  const { data: products } = useQuery({
    queryKey: ['products-for-quotes'],
    queryFn: async () => {
      const res = await api.get('/inventory/products');
      return res.data.products as Product[];
    },
  });

  const { data: models } = useQuery({
    queryKey: ['models-for-quotes'],
    queryFn: async () => {
      const res = await api.get('/machines/models');
      return res.data.models as MachineModel[];
    },
  });

  // Currency selection handler
  const handleCurrencyChange = (newCurr: string) => {
    setCurrency(newCurr);
    const currObj = currencies.find((c) => c.code === newCurr);
    setExchangeRate(currObj?.rateToBase || 1.0);
  };

  // Line item handlers
  const handleItemProductSelect = (index: number, prodId: string) => {
    const prod = products?.find((p) => p.id === prodId);
    if (!prod) return;

    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        productId: prod.id,
        description: `${prod.partNumber} — ${prod.name}`,
        unitPrice: prod.unitPrice,
        costPrice: prod.costPrice || 0,
      };
      return next;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        itemType: 'PRODUCT',
        productId: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        costPrice: 0,
        discountPercent: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations for live preview
  const subtotalHt = items.reduce((acc, it) => {
    const lineDiscount = it.discountPercent / 100;
    return acc + it.quantity * it.unitPrice * (1 - lineDiscount);
  }, 0);

  const discountAmount = (subtotalHt * discountPercent) / 100;
  const totalHt = subtotalHt - discountAmount;
  const taxPercent = taxRateId === 'tax-tva-20' ? 20 : 0;
  const taxAmount = (totalHt * taxPercent) / 100;
  const totalTtc = totalHt + taxAmount;

  // Mutations
  const createQuoteMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/quotes', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setIsNewQuoteOpen(false);
    },
  });

  const convertToInvoiceMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const res = await api.post(`/quotes/${quoteId}/convert-to-invoice`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      if (selectedQuote) {
        setSelectedQuote(null);
      }
    },
  });

  const convertToOrderMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const res = await api.post(`/quotes/${quoteId}/convert-to-order`, {});
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      alert('Bon de commande client créé avec succès depuis ce devis !');
      if (selectedQuote) {
        setSelectedQuote(null);
      }
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.put(`/quotes/${id}/status`, { status });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote-detail', selectedQuote?.id] });
      if (selectedQuote && selectedQuote.id === data.quote?.id) {
        setSelectedQuote((prev: any) => prev ? { ...prev, status: data.quote.status } : null);
      }
    },
  });

  const { data: quoteDetails, isLoading: isQuoteDetailsLoading, isError: isQuoteDetailsError } = useQuery({
    queryKey: ['quote-detail', selectedQuote?.id],
    queryFn: async () => {
      if (!selectedQuote?.id) return null;
      const res = await api.get(`/quotes/${selectedQuote.id}`);
      return res.data.quote;
    },
    enabled: Boolean(selectedQuote?.id),
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createQuoteMutation.mutate({
      clientId,
      taxRateId,
      currency,
      exchangeRate,
      discountPercent: Number(discountPercent),
      validUntil,
      paymentTerms,
      items: items.map((it) => ({
        ...it,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        costPrice: Number(it.costPrice || 0),
        discountPercent: Number(it.discountPercent || 0),
      })),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('quotes.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('quotes.subtitle')}
          </p>
        </div>

        <PermissionGate roles={['SUPER_ADMIN', 'ADMIN', 'COMMERCIAL', 'DIRECTION']}>
          <button
            onClick={() => setIsNewQuoteOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-videojet-blue hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('quotes.newQuote')}
          </button>
        </PermissionGate>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par numéro de devis ou client..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">{t('quotes.quoteNumber')}</th>
                <th className="py-3 px-4">{t('quotes.client')}</th>
                <th className="py-3 px-4">{t('quotes.totalHt')}</th>
                <th className="py-3 px-4">{t('quotes.totalTtc')}</th>
                <PermissionGate roles={['SUPER_ADMIN', 'ADMIN', 'DIRECTION']}>
                  <th className="py-3 px-4">{t('quotes.margin')}</th>
                </PermissionGate>
                <th className="py-3 px-4">{t('quotes.validUntil')}</th>
                <th className="py-3 px-4">{t('quotes.status')}</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Chargement des devis...
                  </td>
                </tr>
              ) : quotes && quotes.length > 0 ? (
                quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{q.quoteNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{q.client.name}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {formatPrice(q.totalHt, q.currency)}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      {formatPrice(q.totalTtc, q.currency)}
                    </td>
                    <PermissionGate roles={['SUPER_ADMIN', 'ADMIN', 'DIRECTION']}>
                      <td className="py-3 px-4 font-semibold text-indigo-700">
                        {q.estimatedMargin !== undefined ? formatPrice(q.estimatedMargin, q.currency) : '—'}
                      </td>
                    </PermissionGate>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(q.validUntil).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={q.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedQuote(q)}
                          title="Visualiser et gérer le devis"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-lg font-semibold text-xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Détails
                        </button>
                        <button
                          onClick={() => downloadExport(`/exports/quotes/${q.id}/pdf`, `Devis_${q.quoteNumber}.pdf`)}
                          title="Télécharger le devis en PDF"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                        >
                          <FileDown className="w-3.5 h-3.5 text-videojet-blue" />
                          PDF
                        </button>
                        {q.status !== 'ACCEPTE' && (
                          <button
                            onClick={() => convertToInvoiceMutation.mutate(q.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-videojet-blue hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            Facturer
                          </button>
                        )}
                        {q.status === 'ACCEPTE' && (
                          <span className="text-emerald-700 font-semibold text-xs flex items-center justify-end gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Facturé
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Aucun devis enregistré.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Quote Modal */}
      <Modal
        isOpen={isNewQuoteOpen}
        onClose={() => setIsNewQuoteOpen(false)}
        title="Élaborer un nouveau devis commercial"
        subtitle="Support multi-devises (MAD / EUR / USD), taux de TVA et calcul des marges"
        maxWidth="3xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Client Industriel *
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
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
                Devise de Facturation *
              </label>
              <select
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none font-bold"
              >
                <option value="MAD">MAD (Dirham Marocain)</option>
                <option value="EUR">EUR (€ Euro)</option>
                <option value="USD">USD ($ Dollar US)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Régime TVA *
              </label>
              <select
                value={taxRateId}
                onChange={(e) => setTaxRateId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="tax-tva-20">TVA Normale (20%)</option>
                <option value="tax-tva-0">TVA 0% (Exonération / Export)</option>
              </select>
            </div>
          </div>

          {/* Line items table */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800">Articles & Lignes du devis :</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-brand-700 hover:text-brand-800 font-semibold text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter une ligne
              </button>
            </div>

            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="col-span-5">
                  <select
                    value={it.productId || ''}
                    onChange={(e) => handleItemProductSelect(idx, e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs"
                    required
                  >
                    <option value="">Sélectionner un article / consommable...</option>
                    {products?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.partNumber} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    value={it.quantity}
                    onChange={(e) => {
                      const qty = parseFloat(e.target.value) || 1;
                      setItems((prev) => {
                        const next = [...prev];
                        next[idx].quantity = qty;
                        return next;
                      });
                    }}
                    placeholder="Qté"
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-center text-xs"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    value={it.unitPrice}
                    onChange={(e) => {
                      const p = parseFloat(e.target.value) || 0;
                      setItems((prev) => {
                        const next = [...prev];
                        next[idx].unitPrice = p;
                        return next;
                      });
                    }}
                    placeholder="Prix U."
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-right text-xs"
                    required
                  />
                </div>

                <div className="col-span-2 text-right font-bold text-slate-800">
                  {formatPrice(it.quantity * it.unitPrice, currency)}
                </div>

                <div className="col-span-1 text-center">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totals Summary */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Sous-total HT :</span>
              <span>{formatPrice(subtotalHt, currency)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>TVA ({taxPercent}%) :</span>
              <span>{formatPrice(taxAmount, currency)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800">
              <span>Total TTC :</span>
              <span className="text-cyan-400">{formatPrice(totalTtc, currency)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewQuoteOpen(false)}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createQuoteMutation.isPending || !clientId}
              className="px-5 py-2 font-bold bg-videojet-blue text-white hover:bg-slate-800 rounded-xl shadow-xs disabled:opacity-50"
            >
              {createQuoteMutation.isPending ? 'Génération...' : 'Créer et Enregistrer le Devis'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Quote Detail Modal */}
      <Modal
        isOpen={Boolean(selectedQuote)}
        onClose={() => setSelectedQuote(null)}
        title={`Détails du Devis — ${selectedQuote?.quoteNumber || ''}`}
        maxWidth="2xl"
      >
        {isQuoteDetailsLoading ? (
          <div className="py-12 text-center text-slate-400">Chargement des détails du devis...</div>
        ) : isQuoteDetailsError ? (
          <div className="py-12 text-center text-rose-500 font-medium">
            Impossible de charger les détails de ce devis. Veuillez réessayer.
          </div>
        ) : quoteDetails ? (
          <div className="space-y-6">
            {/* Header info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Client Destinataire</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{quoteDetails.client?.name || 'Client non spécifié'}</p>
                <p className="text-xs text-slate-500">{quoteDetails.client?.city || 'Maroc'}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Statut & Échéance</p>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge status={quoteDetails.status} />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Valide jusqu'au : {quoteDetails.validUntil ? new Date(quoteDetails.validUntil).toLocaleDateString('fr-FR') : '—'}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Conditions & Devise</p>
                <p className="text-xs font-semibold text-slate-700 mt-1">{quoteDetails.paymentTerms || '30 jours'}</p>
                <p className="text-xs text-slate-500">Devise : {quoteDetails.currency || 'MAD'}</p>
              </div>
            </div>

            {/* Line items table */}
            <div className="border border-slate-200/80 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Désignation</th>
                    <th className="py-2.5 px-3 text-center">Qté</th>
                    <th className="py-2.5 px-3 text-right">Prix Unitaire</th>
                    <th className="py-2.5 px-3 text-center">Remise</th>
                    <th className="py-2.5 px-3 text-right">Total HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quoteDetails.items?.map((item: any, i: number) => (
                    <tr key={item.id || i} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-slate-800">{item.description}</p>
                        {item.product && (
                          <p className="text-[10px] text-slate-400 font-mono">Réf: {item.product.partNumber}</p>
                        )}
                        {item.machineModel && (
                          <p className="text-[10px] text-slate-400 font-mono">Modèle: {item.machineModel.name}</p>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-medium">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">
                        {formatPrice(item.unitPrice, quoteDetails.currency)}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500">
                        {item.discountPercent ? `${item.discountPercent}%` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatPrice(item.totalLineHt ?? (item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100)), quoteDetails.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 text-white p-4 rounded-xl">
              <div className="space-y-1 text-xs text-slate-400">
                <PermissionGate roles={['SUPER_ADMIN', 'ADMIN', 'DIRECTION']}>
                  {quoteDetails.estimatedMargin !== undefined && quoteDetails.estimatedMargin !== null && (
                    <p>Marge prévisionnelle : <span className="text-emerald-400 font-bold">{formatPrice(quoteDetails.estimatedMargin, quoteDetails.currency)}</span></p>
                  )}
                </PermissionGate>
                <p>Émis par : {quoteDetails.createdBy ? `${quoteDetails.createdBy.firstName} ${quoteDetails.createdBy.lastName}` : 'NEXORA Commercial'}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-xs text-slate-400">Total HT : <span className="text-slate-200 font-semibold">{formatPrice(quoteDetails.totalHt ?? 0, quoteDetails.currency)}</span></p>
                <p className="text-xs text-slate-400">TVA ({quoteDetails.taxRate?.rate || 20}%) : <span className="text-slate-200 font-semibold">{formatPrice(quoteDetails.taxAmount ?? 0, quoteDetails.currency)}</span></p>
                <p className="text-base font-extrabold text-cyan-400">Total TTC : {formatPrice(quoteDetails.totalTtc ?? 0, quoteDetails.currency)}</p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="border-t border-slate-200 pt-4 flex flex-wrap items-center justify-between gap-3">
              {/* Status changers */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Statut :</span>
                {quoteDetails.status !== 'ENVOYE' && (
                  <button
                    onClick={() => updateStatusMutation.mutate({ id: quoteDetails.id, status: 'ENVOYE' })}
                    disabled={updateStatusMutation.isPending}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Envoyer au Client
                  </button>
                )}
                {quoteDetails.status !== 'ACCEPTE' && (
                  <button
                    onClick={() => updateStatusMutation.mutate({ id: quoteDetails.id, status: 'ACCEPTE' })}
                    disabled={updateStatusMutation.isPending}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Valider / Accepter
                  </button>
                )}
                {quoteDetails.status !== 'REFUSE' && (
                  <button
                    onClick={() => updateStatusMutation.mutate({ id: quoteDetails.id, status: 'REFUSE' })}
                    disabled={updateStatusMutation.isPending}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Refuser
                  </button>
                )}
              </div>

              {/* Conversion and PDF buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadExport(`/exports/quotes/${quoteDetails.id}/pdf`, `Devis_${quoteDetails.quoteNumber}.pdf`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5 text-videojet-blue" />
                  Exporter PDF
                </button>
                <button
                  type="button"
                  onClick={() => convertToOrderMutation.mutate(quoteDetails.id)}
                  disabled={convertToOrderMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  {convertToOrderMutation.isPending ? 'Création...' : 'Créer Bon de Commande'}
                </button>
                <button
                  type="button"
                  onClick={() => convertToInvoiceMutation.mutate(quoteDetails.id)}
                  disabled={convertToInvoiceMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-videojet-blue hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  {convertToInvoiceMutation.isPending ? 'Facturation...' : 'Convertir en Facture'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

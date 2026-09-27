import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  Truck,
  Plus,
  Search,
  Building2,
  Package,
  History,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  DollarSign,
  FileText,
  Star,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import api from '../../services/api.js';
import {
  Supplier,
  PurchaseOrder,
  Product,
  StockMovement,
  ReplenishmentSuggestion,
} from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { Modal } from '../../components/common/Modal.js';
import { useCurrency } from '../../contexts/CurrencyContext.js';
import { downloadExport } from '../../utils/download.js';

export const SuppliersPage: React.FC = () => {
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const activeTab = searchParams.get('tab') || 'suppliers';
  const setActiveTab = (tab: string) => setSearchParams({ tab });

  const [search, setSearch] = useState('');

  // Modals state
  const [isNewSupplierOpen, setIsNewSupplierOpen] = useState(false);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [receiveTarget, setReceiveTarget] = useState<PurchaseOrder | null>(null);

  // New Supplier Form
  const [supplierForm, setSupplierForm] = useState({
    code: '',
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    city: 'Casablanca',
    country: 'Maroc',
    paymentTerms: '30 jours net',
    currency: 'MAD',
    rating: 5,
    notes: '',
  });

  // New Purchase Order Form
  const [orderForm, setOrderForm] = useState({
    supplierId: '',
    currency: 'MAD',
    notes: '',
    items: [{ productId: '', quantity: 10, unitPrice: 0 }],
  });

  // Reception Form
  const [receptionForm, setReceptionForm] = useState<{
    receivedItems: {
      itemId: string;
      productName: string;
      orderedQty: number;
      alreadyReceivedQty: number;
      receivedQuantity: number;
      batchNumber: string;
      expirationDate: string;
      warehouseLocation: string;
    }[];
  }>({ receivedItems: [] });

  // Queries
  const { data: suppliers, isLoading: isSuppliersLoading } = useQuery({
    queryKey: ['suppliers', search],
    queryFn: async () => {
      const res = await api.get('/purchasing/suppliers', { params: { search } });
      return res.data.suppliers as Supplier[];
    },
  });

  const { data: purchaseOrders, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const res = await api.get('/purchasing/orders');
      return res.data.purchaseOrders as PurchaseOrder[];
    },
  });

  const { data: suggestions, isLoading: isSuggestionsLoading } = useQuery({
    queryKey: ['replenishment-suggestions'],
    queryFn: async () => {
      const res = await api.get('/inventory/replenishment-suggestions');
      return res.data.suggestions as ReplenishmentSuggestion[];
    },
  });

  const { data: movements, isLoading: isMovementsLoading } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: async () => {
      const res = await api.get('/inventory/movements');
      return res.data.movements as StockMovement[];
    },
  });

  const { data: products } = useQuery({
    queryKey: ['products-for-purchases'],
    queryFn: async () => {
      const res = await api.get('/inventory/products');
      return res.data.products as Product[];
    },
  });

  // Mutations
  const createSupplierMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/purchasing/suppliers', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsNewSupplierOpen(false);
      setSupplierForm({
        code: '',
        name: '',
        contactName: '',
        email: '',
        phone: '',
        address: '',
        city: 'Casablanca',
        country: 'Maroc',
        paymentTerms: '30 jours net',
        currency: 'MAD',
        rating: 5,
        notes: '',
      });
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Erreur lors de la création du fournisseur');
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/purchasing/orders', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      setIsNewOrderOpen(false);
      setOrderForm({
        supplierId: '',
        currency: 'MAD',
        notes: '',
        items: [{ productId: '', quantity: 10, unitPrice: 0 }],
      });
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Erreur lors de la création du bon d\'achat');
    },
  });

  const receiveOrderMutation = useMutation({
    mutationFn: async (payload: { orderId: string; data: any }) => {
      const res = await api.post(`/purchasing/orders/${payload.orderId}/receive`, payload.data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products-for-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['replenishment-suggestions'] });
      setReceiveTarget(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Erreur lors de la réception du bon');
    },
  });

  const openReceiveModal = (order: PurchaseOrder) => {
    setReceiveTarget(order);
    const inYear = new Date();
    inYear.setFullYear(inYear.getFullYear() + 1);

    setReceptionForm({
      receivedItems: order.items.map((item) => ({
        itemId: item.id,
        productName: item.product?.name || item.productId,
        orderedQty: item.quantity,
        alreadyReceivedQty: item.receivedQuantity,
        receivedQuantity: Math.max(0, item.quantity - item.receivedQuantity),
        batchNumber: `LOT-REC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        expirationDate: inYear.toISOString().split('T')[0],
        warehouseLocation: 'Dépôt Casablanca Aisle 1',
      })),
    });
  };

  const handleQuickReorder = (sugg: ReplenishmentSuggestion) => {
    if (!sugg.supplier) {
      alert('Veuillez d\'abord rattacher un fournisseur principal à ce produit.');
      return;
    }
    setOrderForm({
      supplierId: sugg.supplier.id,
      currency: sugg.product.currency || 'MAD',
      notes: `Commande automatique de réapprovisionnement pour déficit de stock (${sugg.deficit} unités)`,
      items: [
        {
          productId: sugg.product.id,
          quantity: sugg.suggestedReorderQuantity,
          unitPrice: sugg.product.unitPrice * 0.5, // approx cost
        },
      ],
    });
    setIsNewOrderOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Truck className="w-7 h-7 text-brand-600" />
            Fournisseurs, Achats & Mouvements de Stock
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestion des approvisionnements Videojet, réceptions de marchandises, alertes de réassort et traçabilité des lots
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'suppliers' && (
            <button
              onClick={() => setIsNewSupplierOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Nouveau Fournisseur
            </button>
          )}

          {activeTab === 'orders' && (
            <button
              onClick={() => setIsNewOrderOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Nouvelle Commande Fournisseur
            </button>
          )}

          {activeTab === 'movements' && (
            <button
              onClick={() => downloadExport('/exports/movements/excel', 'Historique_Mouvements_Stock.xlsx')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Exporter Mouvements Excel
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'suppliers'
              ? 'border-brand-600 text-brand-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Fournisseurs Industriels ({suppliers?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'border-brand-600 text-brand-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Bons de Commande Achats ({purchaseOrders?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('replenishment')}
          className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'replenishment'
              ? 'border-brand-600 text-brand-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Réapprovisionnement Conseillé ({suggestions?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'movements'
              ? 'border-brand-600 text-brand-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          Journal des Mouvements de Stock ({movements?.length || 0})
        </button>
      </div>

      {/* TAB 1: SUPPLIERS DIRECTORY */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, code fournisseur, ville..."
              className="w-full text-xs bg-transparent focus:outline-none text-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isSuppliersLoading ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                Chargement des fournisseurs...
              </div>
            ) : suppliers && suppliers.length > 0 ? (
              suppliers.map((sup) => (
                <div
                  key={sup.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                          {sup.code}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 mt-1">{sup.name}</h3>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full text-amber-700 text-xs font-bold border border-amber-200">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {sup.rating}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600">
                      📍 {sup.city}, {sup.country}
                    </p>

                    <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                      {sup.contactName && <p>👤 Contact: {sup.contactName}</p>}
                      {sup.email && <p>✉️ {sup.email}</p>}
                      {sup.phone && <p>📞 {sup.phone}</p>}
                      {sup.paymentTerms && <p>💳 Règlement: {sup.paymentTerms}</p>}
                    </div>

                    {sup.notes && (
                      <p className="text-[11px] text-slate-400 italic pt-1 line-clamp-2">
                        {sup.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs font-medium text-slate-600">
                    <span>Articles rattachés: <strong>{sup._count?.products || 0}</strong></span>
                    <span>Commandes: <strong>{sup._count?.purchaseOrders || 0}</strong></span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                Aucun fournisseur trouvé.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PURCHASE ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">N° Commande Achat</th>
                  <th className="py-3 px-4">Fournisseur</th>
                  <th className="py-3 px-4">Date Commande</th>
                  <th className="py-3 px-4">Articles</th>
                  <th className="py-3 px-4">Montant TTC</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Suivi Colis</th>
                  <th className="py-3 px-4 text-right">Actions Réception</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isOrdersLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Chargement des bons de commande fournisseur...
                    </td>
                  </tr>
                ) : purchaseOrders && purchaseOrders.length > 0 ? (
                  purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                        {po.orderNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{po.supplier?.name}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">{po.supplier?.code}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(po.orderDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-700">
                          {po.items?.length || 0} référence(s)
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {formatMoney(po.totalTtc, po.currency)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={po.status} />
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {po.trackingNumber || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {po.status !== 'RECUE_COMPLETE' && po.status !== 'ANNULEE' && (
                          <button
                            onClick={() => openReceiveModal(po)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold text-xs transition-colors"
                          >
                            <Package className="w-3.5 h-3.5" />
                            Réceptionner
                          </button>
                        )}
                        {po.status === 'RECUE_COMPLETE' && (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Réceptionné
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Aucune commande d'achat enregistrée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REPLENISHMENT SUGGESTIONS */}
      {activeTab === 'replenishment' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">
                Articles en Seuil Critique d'Alerte ({suggestions?.length || 0})
              </h2>
              <p className="text-xs text-slate-500">
                Calcul automatique basé sur stock réel vs seuil de sécurité minimum
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Référence</th>
                  <th className="py-3 px-4">Désignation Consommable / Pièce</th>
                  <th className="py-3 px-4">Fournisseur Rattaché</th>
                  <th className="py-3 px-4">Stock Actuel</th>
                  <th className="py-3 px-4">Seuil Min</th>
                  <th className="py-3 px-4">Déficit</th>
                  <th className="py-3 px-4 font-bold text-brand-700">Qté Conseillée</th>
                  <th className="py-3 px-4 text-right">Action Rapide</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isSuggestionsLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Analyse des stocks en cours...
                    </td>
                  </tr>
                ) : suggestions && suggestions.length > 0 ? (
                  suggestions.map((sugg) => (
                    <tr key={sugg.product.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {sugg.product.partNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{sugg.product.name}</span>
                        <span className="block text-[10px] text-slate-500">
                          {sugg.product.type} — {sugg.product.technology}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {sugg.supplier?.name || (
                          <span className="text-rose-500 italic">Non rattaché</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-rose-600">
                        {sugg.product.stockQuantity} {sugg.product.unit}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {sugg.product.minStockThreshold} {sugg.product.unit}
                      </td>
                      <td className="py-3 px-4 text-rose-600 font-bold">
                        -{sugg.deficit}
                      </td>
                      <td className="py-3 px-4 font-bold text-brand-700 bg-brand-50/50">
                        +{sugg.suggestedReorderQuantity} {sugg.product.unit}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleQuickReorder(sugg)}
                          className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold text-xs transition-colors"
                        >
                          Commander
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-emerald-600 font-medium">
                      ✓ Tous les stocks sont au-dessus des seuils de sécurité !
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: STOCK MOVEMENTS AUDIT TRAIL */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">
                Traçabilité & Historique des Mouvements de Stock
              </h2>
              <p className="text-xs text-slate-500">
                Enregistrement immuable des entrées achats, sorties interventions et ajustements
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">N° Mouvement</th>
                  <th className="py-3 px-4">Date & Heure</th>
                  <th className="py-3 px-4">Type de flux</th>
                  <th className="py-3 px-4">Article</th>
                  <th className="py-3 px-4">Variation Quantité</th>
                  <th className="py-3 px-4">Stock Avant → Après</th>
                  <th className="py-3 px-4">Opérateur / Justificatif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isMovementsLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Chargement de la traçabilité...
                    </td>
                  </tr>
                ) : movements && movements.length > 0 ? (
                  movements.map((mvt) => {
                    const isPositive = mvt.quantity > 0;
                    return (
                      <tr key={mvt.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {mvt.movementNumber}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {new Date(mvt.createdAt).toLocaleString('fr-FR')}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isPositive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isPositive ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {mvt.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800">{mvt.product?.partNumber}</span>
                          <span className="block text-[10px] text-slate-500">{mvt.product?.name}</span>
                        </td>
                        <td className="py-3 px-4 font-bold text-sm">
                          <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                            {isPositive ? `+${mvt.quantity}` : mvt.quantity} {mvt.product?.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {mvt.stockBefore} → <strong>{mvt.stockAfter}</strong>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                          {mvt.reason || '—'}
                          {mvt.user && (
                            <span className="block text-[10px] text-slate-400">
                              Par: {mvt.user.firstName} {mvt.user.lastName}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Aucun mouvement de stock enregistré.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: NEW SUPPLIER */}
      {isNewSupplierOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsNewSupplierOpen(false)}
          title="Créer un nouveau fournisseur industriel"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createSupplierMutation.mutate(supplierForm);
            }}
            className="space-y-4 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Code Fournisseur *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: FRN-MAR-003"
                  value={supplierForm.code}
                  onChange={(e) => setSupplierForm({ ...supplierForm, code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Raison Sociale *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Videojet France SARL"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Référent</label>
                <input
                  type="text"
                  placeholder="Ex: M. Jean Dupont"
                  value={supplierForm.contactName}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contactName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Commandes</label>
                <input
                  type="email"
                  placeholder="orders@fournisseur.com"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ville</label>
                <input
                  type="text"
                  value={supplierForm.city}
                  onChange={(e) => setSupplierForm({ ...supplierForm, city: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pays</label>
                <input
                  type="text"
                  value={supplierForm.country}
                  onChange={(e) => setSupplierForm({ ...supplierForm, country: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Modalité Paiement</label>
                <input
                  type="text"
                  placeholder="Ex: 30 jours net"
                  value={supplierForm.paymentTerms}
                  onChange={(e) => setSupplierForm({ ...supplierForm, paymentTerms: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Notes & Consignes Achats</label>
              <textarea
                rows={2}
                value={supplierForm.notes}
                onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNewSupplierOpen(false)}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={createSupplierMutation.isPending}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors shadow-xs"
              >
                {createSupplierMutation.isPending ? 'Enregistrement...' : 'Créer le fournisseur'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: NEW PURCHASE ORDER */}
      {isNewOrderOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsNewOrderOpen(false)}
          title="Émettre un bon de commande fournisseur (Achats & Réassort)"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createOrderMutation.mutate(orderForm);
            }}
            className="space-y-4 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fournisseur *</label>
                <select
                  required
                  value={orderForm.supplierId}
                  onChange={(e) => setOrderForm({ ...orderForm, supplierId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="">Sélectionner un fournisseur...</option>
                  {suppliers?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name} ({s.country})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Devise *</label>
                <select
                  value={orderForm.currency}
                  onChange={(e) => setOrderForm({ ...orderForm, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="MAD">MAD (Dirham Marocain)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">Lignes de commande d'achat :</label>
                <button
                  type="button"
                  onClick={() =>
                    setOrderForm({
                      ...orderForm,
                      items: [...orderForm.items, { productId: '', quantity: 10, unitPrice: 0 }],
                    })
                  }
                  className="text-brand-600 font-bold hover:underline text-[11px]"
                >
                  + Ajouter un article
                </button>
              </div>

              {orderForm.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 items-center">
                  <div className="col-span-6">
                    <select
                      required
                      value={item.productId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        const prod = products?.find((p) => p.id === pid);
                        const updated = [...orderForm.items];
                        updated[idx].productId = pid;
                        if (prod) updated[idx].unitPrice = prod.unitPrice * 0.5; // default purchase cost
                        setOrderForm({ ...orderForm, items: updated });
                      }}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="">Sélectionner article...</option>
                      {products?.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.partNumber} — {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-3">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qté"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...orderForm.items];
                        updated[idx].quantity = parseFloat(e.target.value) || 1;
                        setOrderForm({ ...orderForm, items: updated });
                      }}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center"
                    />
                  </div>

                  <div className="col-span-3">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="Prix unit HT"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const updated = [...orderForm.items];
                        updated[idx].unitPrice = parseFloat(e.target.value) || 0;
                        setOrderForm({ ...orderForm, items: updated });
                      }}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-right"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Notes / Instructions d'expédition</label>
              <textarea
                rows={2}
                value={orderForm.notes}
                onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                placeholder="Ex: Livraison sous douane Tanger Med, expédition fret DHL express..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNewOrderOpen(false)}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={createOrderMutation.isPending}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors shadow-xs"
              >
                {createOrderMutation.isPending ? 'Émission en cours...' : 'Émettre le bon d\'achat'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: RECEIVE PURCHASE ORDER */}
      {receiveTarget && (
        <Modal
          isOpen={true}
          onClose={() => setReceiveTarget(null)}
          title={`Réceptionner la commande ${receiveTarget.orderNumber}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-brand-900 space-y-1">
              <span className="font-bold">Fournisseur: {receiveTarget.supplier?.name}</span>
              <p className="text-[11px] text-brand-700">
                La validation de la réception incrémentera le stock réel en magasin et créera la traçabilité du lot avec alerte de péremption.
              </p>
            </div>

            <div className="space-y-3">
              {receptionForm.receivedItems.map((item, idx) => (
                <div key={item.itemId} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>{item.productName}</span>
                    <span className="text-slate-500 font-normal">
                      Commandé: {item.orderedQty} (Déjà reçu: {item.alreadyReceivedQty})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Qté réceptionnée *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={item.orderedQty - item.alreadyReceivedQty}
                        value={item.receivedQuantity}
                        onChange={(e) => {
                          const updated = [...receptionForm.receivedItems];
                          updated[idx].receivedQuantity = parseFloat(e.target.value) || 0;
                          setReceptionForm({ receivedItems: updated });
                        }}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-center font-bold text-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        N° de Lot *
                      </label>
                      <input
                        type="text"
                        value={item.batchNumber}
                        onChange={(e) => {
                          const updated = [...receptionForm.receivedItems];
                          updated[idx].batchNumber = e.target.value;
                          setReceptionForm({ receivedItems: updated });
                        }}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg font-mono text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Date Péremption *
                      </label>
                      <input
                        type="date"
                        value={item.expirationDate}
                        onChange={(e) => {
                          const updated = [...receptionForm.receivedItems];
                          updated[idx].expirationDate = e.target.value;
                          setReceptionForm({ receivedItems: updated });
                        }}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Emplacement Dépôt
                      </label>
                      <input
                        type="text"
                        value={item.warehouseLocation}
                        onChange={(e) => {
                          const updated = [...receptionForm.receivedItems];
                          updated[idx].warehouseLocation = e.target.value;
                          setReceptionForm({ receivedItems: updated });
                        }}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-slate-700"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReceiveTarget(null)}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={receiveOrderMutation.isPending}
                onClick={() => {
                  receiveOrderMutation.mutate({
                    orderId: receiveTarget.id,
                    data: {
                      receivedItems: receptionForm.receivedItems.map((i) => ({
                        itemId: i.itemId,
                        receivedQuantity: i.receivedQuantity,
                        batchNumber: i.batchNumber,
                        expirationDate: new Date(i.expirationDate).toISOString(),
                        warehouseLocation: i.warehouseLocation,
                      })),
                    },
                  });
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-xs"
              >
                {receiveOrderMutation.isPending ? 'Enregistrement...' : 'Valider la réception en magasin'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

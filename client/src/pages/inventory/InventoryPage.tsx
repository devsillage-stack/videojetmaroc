import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Boxes,
  AlertTriangle,
  Plus,
  Search,
  Calendar,
  Layers,
  ShieldAlert,
  Clock,
  MapPin,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';
import api from '../../services/api.js';
import { Product, StockBatch } from '../../types/index.js';
import { useCurrency } from '../../contexts/CurrencyContext.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { Modal } from '../../components/common/Modal.js';
import { PermissionGate } from '../../components/common/PermissionGate.js';
import { downloadExport } from '../../utils/download.js';

export const InventoryPage: React.FC = () => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'products' | 'batches'>('products');
  const [search, setSearch] = useState('');
  const [selectedTech, setSelectedTech] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);

  // Form states
  const [productForm, setProductForm] = useState({
    partNumber: '',
    name: '',
    type: 'ENCRE',
    technology: 'CIJ',
    description: '',
    unitPrice: 500,
    costPrice: 250,
    minStockThreshold: 10,
    unit: 'CARTOUCHE',
  });

  const [batchForm, setBatchForm] = useState({
    productId: '',
    batchNumber: '',
    expirationDate: '',
    quantity: 10,
    warehouseLocation: 'Dépôt Central Casablanca',
  });

  // Queries
  const { data: products, isLoading: isProductsLoading } = useQuery({
    queryKey: ['inventory-products', search, selectedTech, lowStockOnly],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      if (selectedTech) params.technology = selectedTech;
      if (lowStockOnly) params.lowStock = 'true';
      const res = await api.get('/inventory/products', { params });
      return res.data.products as Product[];
    },
  });

  const { data: expirationAlerts } = useQuery({
    queryKey: ['expiration-alerts'],
    queryFn: async () => {
      const res = await api.get('/inventory/alerts/expiration');
      return res.data.alerts as StockBatch[];
    },
  });

  // Mutations
  const createProductMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/inventory/products', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      setIsAddProductOpen(false);
      setProductForm({
        partNumber: '',
        name: '',
        type: 'ENCRE',
        technology: 'CIJ',
        description: '',
        unitPrice: 500,
        costPrice: 250,
        minStockThreshold: 10,
        unit: 'CARTOUCHE',
      });
    },
  });

  const addBatchMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/inventory/batches', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      queryClient.invalidateQueries({ queryKey: ['expiration-alerts'] });
      setIsAddBatchOpen(false);
    },
  });

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProductMutation.mutate({
      ...productForm,
      unitPrice: Number(productForm.unitPrice),
      costPrice: Number(productForm.costPrice),
      minStockThreshold: Number(productForm.minStockThreshold),
    });
  };

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addBatchMutation.mutate({
      ...batchForm,
      quantity: Number(batchForm.quantity),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('inventory.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('inventory.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadExport('/exports/inventory/excel', 'Catalogue_Stock_Videojet.xlsx')}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-xl shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Exporter Catalogue Excel
          </button>
          <PermissionGate roles={['SUPER_ADMIN', 'ADMIN', 'MAGASINIER']}>
            <button
              onClick={() => setIsAddBatchOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-xs transition-colors"
            >
              <Calendar className="w-4 h-4 text-cyan-600" />
              {t('inventory.addBatch')}
            </button>
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-videojet-blue hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('inventory.addProduct')}
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Expiration Alerts Banner */}
      {expirationAlerts && expirationAlerts.length > 0 && (
        <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <span className="font-bold text-amber-900 block">
              Attention : {expirationAlerts.length} lot(s) d'encre ou solvant en alerte de péremption (&lt; 60 jours ou périmé)
            </span>
            <p className="text-amber-800 mt-0.5">
              Vérifiez la traçabilité des lots pour éviter toute utilisation de consommable dont les propriétés chimiques ont altéré la viscosité.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('batches')}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition-colors shrink-0"
          >
            Consulter les lots
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('products')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'products'
              ? 'border-videojet-blue text-videojet-blue bg-white shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4 text-cyan-600" />
          {t('inventory.productsTab')} ({products?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('batches')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'batches'
              ? 'border-videojet-blue text-videojet-blue bg-white shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-500" />
          {t('inventory.batchesTab')} ({expirationAlerts?.length || 0})
        </button>
      </div>

      {/* TAB 1: PRODUCTS CATALOG */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par référence Videojet (ex: V411-D, V706-D) ou nom..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={selectedTech}
                onChange={(e) => setSelectedTech(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Toutes technologies</option>
                <option value="CIJ">Jet Continu CIJ</option>
                <option value="LASER_CO2">Laser CO2</option>
                <option value="TTO">Transfert Thermique TTO</option>
                <option value="TIJ">Jet Thermique Wolke TIJ</option>
              </select>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                  className="rounded border-slate-300 text-videojet-blue focus:ring-brand-500"
                />
                Stock bas uniquement
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">{t('inventory.partNumber')}</th>
                    <th className="py-3 px-4">{t('inventory.name')}</th>
                    <th className="py-3 px-4">Technologie</th>
                    <th className="py-3 px-4">{t('inventory.stock')}</th>
                    <th className="py-3 px-4">{t('inventory.unitPrice')}</th>
                    <PermissionGate roles={['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'COMPTABILITE']}>
                      <th className="py-3 px-4 text-slate-400">Coût Achat (Confidentiel)</th>
                    </PermissionGate>
                    <th className="py-3 px-4">État Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isProductsLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Chargement du catalogue...
                      </td>
                    </tr>
                  ) : products && products.length > 0 ? (
                    products.map((p) => {
                      const isLowStock = p.stockQuantity <= p.minStockThreshold;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.partNumber}</td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800">{p.name}</span>
                            <span className="block text-[10px] text-slate-500">{p.type} — {p.unit}</span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-600">{p.technology}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {p.stockQuantity} {p.unit}
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-700">
                            {formatPrice(p.unitPrice, p.currency)}
                          </td>
                          <PermissionGate roles={['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'COMPTABILITE']}>
                            <td className="py-3 px-4 text-slate-500 font-medium">
                              {p.costPrice !== undefined ? formatPrice(p.costPrice, p.currency) : '—'}
                            </td>
                          </PermissionGate>
                          <td className="py-3 px-4">
                            {isLowStock ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700">
                                <AlertTriangle className="w-3 h-3" />
                                Réapprovisionner (&le; {p.minStockThreshold})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                                <CheckCircle className="w-3 h-3" />
                                En stock
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Aucun article correspondant.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BATCHES & EXPIRATION TRACEABILITY */}
      {activeTab === 'batches' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">{t('inventory.batchNumber')}</th>
                  <th className="py-3 px-4">Article & Réf</th>
                  <th className="py-3 px-4">Quantité en lot</th>
                  <th className="py-3 px-4">{t('inventory.expiration')}</th>
                  <th className="py-3 px-4">{t('inventory.location')}</th>
                  <th className="py-3 px-4">Statut Péremption</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expirationAlerts && expirationAlerts.length > 0 ? (
                  expirationAlerts.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{b.batchNumber}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{b.product?.name}</span>
                        <span className="block text-[10px] text-slate-500 font-mono">{b.product?.partNumber}</span>
                      </td>
                      <td className="py-3 px-4 font-bold">{b.quantity} {b.product?.unit}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {new Date(b.expirationDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{b.warehouseLocation || 'Dépôt Central'}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={b.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Aucun lot en alerte de péremption. Tous les consommables sont valides.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        title="Créer un article ou pièce dans le catalogue"
        subtitle="Référencement officiel Videojet"
        maxWidth="2xl"
      >
        <form onSubmit={handleProductSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Référence Constructeur *
              </label>
              <input
                type="text"
                value={productForm.partNumber}
                onChange={(e) => setProductForm({ ...productForm, partNumber: e.target.value })}
                placeholder="Ex: V411-D ou 399180"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Désignation Commerciale *
              </label>
              <input
                type="text"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="Ex: Encre Noire MEK 750ml"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Type de produit *
              </label>
              <select
                value={productForm.type}
                onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="ENCRE">Encre</option>
                <option value="SOLVANT_MAKEUP">Solvant / Make-up</option>
                <option value="RUBAN_TTO">Ruban TTO</option>
                <option value="TETE_IMPRESSION">Tête d'impression</option>
                <option value="FILTRE">Filtre</option>
                <option value="MODULE_COEUR">Module Cœur (Core)</option>
                <option value="PIECE_MECANIQUE">Pièce mécanique</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Technologie Machine *
              </label>
              <select
                value={productForm.technology}
                onChange={(e) => setProductForm({ ...productForm, technology: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="CIJ">Jet Continu (CIJ)</option>
                <option value="LASER_CO2">Laser CO2</option>
                <option value="TTO">Transfert Thermique (TTO)</option>
                <option value="TIJ">Jet Thermique (TIJ)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Prix de Vente Catalogue (MAD) *
              </label>
              <input
                type="number"
                step="0.01"
                value={productForm.unitPrice}
                onChange={(e) => setProductForm({ ...productForm, unitPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Coût de Revient Achat (MAD - Confidentiel) *
              </label>
              <input
                type="number"
                step="0.01"
                value={productForm.costPrice}
                onChange={(e) => setProductForm({ ...productForm, costPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddProductOpen(false)}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createProductMutation.isPending}
              className="px-4 py-2 font-semibold bg-videojet-blue text-white hover:bg-slate-800 rounded-xl shadow-xs"
            >
              {createProductMutation.isPending ? 'Enregistrement...' : 'Créer l\'article'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Batch Modal */}
      <Modal
        isOpen={isAddBatchOpen}
        onClose={() => setIsAddBatchOpen(false)}
        title="Réceptionner un lot d'encre ou pièce"
        subtitle="Enregistrez le numéro de lot constructeur et la date d'expiration"
        maxWidth="md"
      >
        <form onSubmit={handleBatchSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Article du catalogue *
            </label>
            <select
              value={batchForm.productId}
              onChange={(e) => setBatchForm({ ...batchForm, productId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              required
            >
              <option value="">Sélectionner un article...</option>
              {products?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.partNumber} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Numéro de Lot Videojet *
            </label>
            <input
              type="text"
              value={batchForm.batchNumber}
              onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })}
              placeholder="Ex: LOT-VJ-2024-099"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Date de péremption *
              </label>
              <input
                type="date"
                value={batchForm.expirationDate}
                onChange={(e) => setBatchForm({ ...batchForm, expirationDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Quantité reçue *
              </label>
              <input
                type="number"
                min="1"
                value={batchForm.quantity}
                onChange={(e) => setBatchForm({ ...batchForm, quantity: parseFloat(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Emplacement dans l'entrepôt
            </label>
            <input
              type="text"
              value={batchForm.warehouseLocation}
              onChange={(e) => setBatchForm({ ...batchForm, warehouseLocation: e.target.value })}
              placeholder="Ex: Allée 2, Étagère B"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddBatchOpen(false)}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={addBatchMutation.isPending}
              className="px-4 py-2 font-semibold bg-videojet-blue text-white hover:bg-slate-800 rounded-xl shadow-xs"
            >
              {addBatchMutation.isPending ? 'Enregistrement...' : 'Enregistrer la réception'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
